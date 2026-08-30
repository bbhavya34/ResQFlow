from django.db import connection, transaction
from django.utils import timezone
import numpy as np
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from hydrology_engine.hydrology_model import map_gwetroot_to_S, scs_cn_runoff

from .models import FeedbackEntry, FloodZone, ReliefCamp, RescueResource, SOSRequest
from .serializers import (
    FeedbackEntrySerializer,
    FloodZoneSerializer,
    ReliefCampSerializer,
    RescueResourceSerializer,
    SOSRequestSerializer,
)


class SOSRequestViewSet(viewsets.ModelViewSet):
    queryset = SOSRequest.objects.select_related("assigned_resource").all()
    serializer_class = SOSRequestSerializer

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        resource_id = request.data.get("resourceId")
        assignment_status = request.data.get(
            "status", SOSRequest.Status.ASSIGNED)
        if assignment_status not in {SOSRequest.Status.ASSIGNED, SOSRequest.Status.DISPATCHED}:
            return Response({"detail": "Invalid assignment status."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            sos = SOSRequest.objects.select_for_update().get(pk=pk)
            resource = RescueResource.objects.select_for_update().get(pk=resource_id)
            if resource.availability != RescueResource.Availability.AVAILABLE and sos.assigned_resource_id != resource.id:
                return Response({"detail": "Resource is not available."}, status=status.HTTP_409_CONFLICT)
            sos.assigned_resource = resource
            sos.status = assignment_status
            sos.save(update_fields=[
                     "assigned_resource", "status", "updated_at"])
            resource.availability = RescueResource.Availability.ENGAGED
            resource.last_update = "just now"
            resource.save(
                update_fields=["availability", "last_update", "updated_at"])

        return Response(SOSRequestSerializer(sos).data)


class RescueResourceViewSet(viewsets.ModelViewSet):
    queryset = RescueResource.objects.all()
    serializer_class = RescueResourceSerializer


class ReliefCampViewSet(viewsets.ModelViewSet):
    queryset = ReliefCamp.objects.all()
    serializer_class = ReliefCampSerializer


class FloodZoneViewSet(viewsets.ModelViewSet):
    queryset = FloodZone.objects.all()
    serializer_class = FloodZoneSerializer


class FeedbackEntryViewSet(viewsets.ModelViewSet):
    queryset = FeedbackEntry.objects.select_related("sos").all()
    serializer_class = FeedbackEntrySerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            entry = serializer.save()
            if entry.type == "Rescued":
                entry.sos.status = SOSRequest.Status.RESCUED
                entry.sos.save(update_fields=["status", "updated_at"])
                if entry.sos.assigned_resource_id:
                    resource = RescueResource.objects.select_for_update().get(
                        pk=entry.sos.assigned_resource_id
                    )
                    resource.availability = RescueResource.Availability.AVAILABLE
                    resource.last_update = "just now"
                    resource.save(
                        update_fields=["availability", "last_update", "updated_at"])


@api_view(["GET"])
def health(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT PostGIS_Version()")
        postgis_version = cursor.fetchone()[0]
    return Response({"status": "ok", "database": "postgresql", "postgis": postgis_version})


@api_view(["GET"])
def bootstrap(request):
    return Response(
        {
            "sosList": SOSRequestSerializer(SOSRequest.objects.select_related("assigned_resource").all(), many=True).data,
            "resources": RescueResourceSerializer(RescueResource.objects.all(), many=True).data,
            "camps": ReliefCampSerializer(ReliefCamp.objects.all(), many=True).data,
            "floodZones": FloodZoneSerializer(FloodZone.objects.all(), many=True).data,
            "feedback": FeedbackEntrySerializer(FeedbackEntry.objects.select_related("sos").all(), many=True).data,
            "syncedAt": timezone.localtime().isoformat(),
        }
    )


@api_view(["POST"])
def predict_hydrology(request):
    """Run the SCS-CN runoff inference for a precipitation time series."""
    precipitation = request.data.get("precipitation")
    soil_moisture = request.data.get(
        "soil_moisture", request.data.get("soilMoisture"))

    if precipitation is None or soil_moisture is None:
        return Response(
            {"detail": "precipitation and soil_moisture arrays are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        precipitation_array = np.asarray(precipitation, dtype=float)
        soil_moisture_array = np.asarray(soil_moisture, dtype=float)
    except (TypeError, ValueError):
        return Response(
            {"detail": "precipitation and soil_moisture must contain only numbers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if precipitation_array.ndim not in (1, 3) or soil_moisture_array.ndim not in (0, 1, 2):
        return Response(
            {"detail": "Use precipitation as [time] or [time, rows, columns], and soil_moisture as a scalar, [time], or [rows, columns]."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if precipitation_array.size == 0 or soil_moisture_array.size == 0:
        return Response({"detail": "Input arrays cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
    if not np.isfinite(precipitation_array).all() or not np.isfinite(soil_moisture_array).all():
        return Response({"detail": "Input arrays must contain finite numbers."}, status=status.HTTP_400_BAD_REQUEST)
    if (precipitation_array < 0).any() or not ((0 <= soil_moisture_array).all() and (soil_moisture_array <= 1).all()):
        return Response(
            {"detail": "Precipitation must be non-negative and soil_moisture must be between 0 and 1."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if precipitation_array.ndim == 3 and soil_moisture_array.ndim == 2 and precipitation_array.shape[1:] != soil_moisture_array.shape:
        return Response({"detail": "Grid dimensions must match."}, status=status.HTTP_400_BAD_REQUEST)
    if soil_moisture_array.ndim == 1 and (
        precipitation_array.ndim != 1 or soil_moisture_array.shape[
            0] != precipitation_array.shape[0]
    ):
        return Response(
            {"detail": "A one-dimensional soil_moisture array must match one-dimensional precipitation by time step."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if soil_moisture_array.ndim == 1:
        storage = map_gwetroot_to_S(soil_moisture_array)
        initial_abstraction = 0.2 * storage
        runoff_by_step = np.where(
            precipitation_array > initial_abstraction,
            (precipitation_array - initial_abstraction) ** 2
            / np.where(precipitation_array - initial_abstraction + storage == 0, 1e-6, precipitation_array - initial_abstraction + storage),
            0.0,
        )
        return Response(
            {
                "prediction": {
                    "runoff_mm": runoff_by_step.tolist(),
                    "peak_runoff_mm": float(runoff_by_step.max()),
                    "total_runoff_mm": float(runoff_by_step.sum()),
                    "time_steps": int(runoff_by_step.size),
                    "grid_shape": [],
                },
                "model": "SCS-CN runoff",
            }
        )

    if precipitation_array.ndim == 1:
        precipitation_array = precipitation_array[:, None, None]
    if soil_moisture_array.ndim == 0:
        soil_moisture_array = np.full(
            precipitation_array.shape[1:], soil_moisture_array.item())

    storage = map_gwetroot_to_S(soil_moisture_array)
    runoff = scs_cn_runoff(precipitation_array, storage)
    runoff_by_step = runoff.reshape(runoff.shape[0], -1).mean(axis=1)

    return Response(
        {
            "prediction": {
                "runoff_mm": runoff_by_step.tolist(),
                "peak_runoff_mm": float(runoff_by_step.max()),
                "total_runoff_mm": float(runoff_by_step.sum()),
                "time_steps": int(runoff_by_step.size),
                "grid_shape": list(runoff.shape[1:]),
            },
            "model": "SCS-CN runoff",
        }
    )

from django.db import connection, transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

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
        assignment_status = request.data.get("status", SOSRequest.Status.ASSIGNED)
        if assignment_status not in {SOSRequest.Status.ASSIGNED, SOSRequest.Status.DISPATCHED}:
            return Response({"detail": "Invalid assignment status."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            sos = SOSRequest.objects.select_for_update().get(pk=pk)
            resource = RescueResource.objects.select_for_update().get(pk=resource_id)
            if resource.availability != RescueResource.Availability.AVAILABLE and sos.assigned_resource_id != resource.id:
                return Response({"detail": "Resource is not available."}, status=status.HTTP_409_CONFLICT)
            sos.assigned_resource = resource
            sos.status = assignment_status
            sos.save(update_fields=["assigned_resource", "status", "updated_at"])
            resource.availability = RescueResource.Availability.ENGAGED
            resource.last_update = "just now"
            resource.save(update_fields=["availability", "last_update", "updated_at"])

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
                    resource.save(update_fields=["availability", "last_update", "updated_at"])


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

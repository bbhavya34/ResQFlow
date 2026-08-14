from django.contrib.gis.geos import Point
from rest_framework import serializers

from .models import FeedbackEntry, FloodZone, ReliefCamp, RescueResource, SOSRequest


class PointModelSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, required=False)
    lng = serializers.FloatField(write_only=True, required=False)
    point_field = "location"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        point = getattr(instance, self.point_field)
        data["lat"] = point.y
        data["lng"] = point.x
        return data

    def _set_point(self, validated_data):
        lat = validated_data.pop("lat", None)
        lng = validated_data.pop("lng", None)
        if lat is not None and lng is not None:
            validated_data[self.point_field] = Point(lng, lat, srid=4326)
        elif self.instance is None:
            raise serializers.ValidationError({"location": "Both lat and lng are required."})

    def create(self, validated_data):
        self._set_point(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._set_point(validated_data)
        return super().update(instance, validated_data)


class SOSRequestSerializer(PointModelSerializer):
    floodDepthM = serializers.FloatField(source="flood_depth_m")
    receivedAt = serializers.CharField(source="received_at")
    assignedResourceId = serializers.PrimaryKeyRelatedField(
        source="assigned_resource",
        queryset=RescueResource.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = SOSRequest
        fields = [
            "id",
            "channel",
            "raw",
            "lat",
            "lng",
            "place",
            "district",
            "state",
            "people",
            "children",
            "elderly",
            "disabled",
            "livestock",
            "floodDepthM",
            "medical",
            "receivedAt",
            "status",
            "assignedResourceId",
            "factors",
            "notes",
        ]


class RescueResourceSerializer(PointModelSerializer):
    lastUpdate = serializers.CharField(source="last_update")

    class Meta:
        model = RescueResource
        fields = [
            "id",
            "name",
            "type",
            "agency",
            "category",
            "lat",
            "lng",
            "base",
            "capacity",
            "capabilities",
            "availability",
            "verified",
            "contact",
            "lastUpdate",
        ]


class ReliefCampSerializer(PointModelSerializer):
    foodDays = serializers.FloatField(source="food_days")
    waterDays = serializers.FloatField(source="water_days")
    medicalStaff = serializers.IntegerField(source="medical_staff")

    class Meta:
        model = ReliefCamp
        fields = [
            "id",
            "name",
            "district",
            "state",
            "lat",
            "lng",
            "capacity",
            "occupancy",
            "foodDays",
            "waterDays",
            "medicalStaff",
            "urgent",
            "status",
        ]


class FloodZoneSerializer(PointModelSerializer):
    point_field = "center"
    radiusKm = serializers.FloatField(source="radius_km")

    class Meta:
        model = FloodZone
        fields = [
            "id",
            "name",
            "state",
            "river",
            "risk",
            "probability",
            "radiusKm",
            "lat",
            "lng",
            "forecast",
        ]


class FeedbackEntrySerializer(serializers.ModelSerializer):
    sosId = serializers.PrimaryKeyRelatedField(source="sos", queryset=SOSRequest.objects.all())

    class Meta:
        model = FeedbackEntry
        fields = ["id", "sosId", "type", "by", "at", "note"]

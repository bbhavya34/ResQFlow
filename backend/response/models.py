from django.contrib.gis.db import models


class SOSRequest(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW"
        TRIAGED = "TRIAGED"
        ASSIGNED = "ASSIGNED"
        DISPATCHED = "DISPATCHED"
        RESCUED = "RESCUED"
        CLOSED = "CLOSED"

    id = models.CharField(primary_key=True, max_length=32)
    channel = models.CharField(max_length=8)
    raw = models.TextField(blank=True)
    location = models.PointField(srid=4326, geography=True, spatial_index=True)
    place = models.CharField(max_length=200)
    district = models.CharField(max_length=120)
    state = models.CharField(max_length=120)
    people = models.PositiveIntegerField(default=1)
    children = models.PositiveIntegerField(default=0)
    elderly = models.PositiveIntegerField(default=0)
    disabled = models.PositiveIntegerField(default=0)
    livestock = models.PositiveIntegerField(default=0)
    flood_depth_m = models.FloatField(default=0)
    medical = models.BooleanField(default=False)
    received_at = models.CharField(max_length=80)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.NEW)
    assigned_resource = models.ForeignKey(
        "RescueResource",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assignments",
    )
    factors = models.JSONField(default=list)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class RescueResource(models.Model):
    class Availability(models.TextChoices):
        AVAILABLE = "AVAILABLE"
        ENGAGED = "ENGAGED"
        MAINTENANCE = "MAINTENANCE"

    id = models.CharField(primary_key=True, max_length=32)
    name = models.CharField(max_length=160)
    type = models.CharField(max_length=40)
    agency = models.CharField(max_length=160)
    category = models.CharField(max_length=16)
    location = models.PointField(srid=4326, geography=True, spatial_index=True)
    base = models.CharField(max_length=160)
    capacity = models.PositiveIntegerField(default=0)
    capabilities = models.JSONField(default=list)
    availability = models.CharField(
        max_length=16, choices=Availability.choices, default=Availability.AVAILABLE
    )
    verified = models.BooleanField(default=False)
    contact = models.CharField(max_length=120, blank=True)
    last_update = models.CharField(max_length=80, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]


class ReliefCamp(models.Model):
    class Status(models.TextChoices):
        STABLE = "STABLE"
        STRAINED = "STRAINED"
        CRITICAL = "CRITICAL"

    id = models.CharField(primary_key=True, max_length=32)
    name = models.CharField(max_length=180)
    district = models.CharField(max_length=120)
    state = models.CharField(max_length=120)
    location = models.PointField(srid=4326, geography=True, spatial_index=True)
    capacity = models.PositiveIntegerField(default=0)
    occupancy = models.PositiveIntegerField(default=0)
    food_days = models.FloatField(default=0)
    water_days = models.FloatField(default=0)
    medical_staff = models.PositiveIntegerField(default=0)
    urgent = models.JSONField(default=list)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.STABLE)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]


class FloodZone(models.Model):
    class Risk(models.TextChoices):
        SEVERE = "SEVERE"
        HIGH = "HIGH"
        MODERATE = "MODERATE"

    id = models.CharField(primary_key=True, max_length=32)
    name = models.CharField(max_length=180)
    state = models.CharField(max_length=120)
    river = models.CharField(max_length=120)
    risk = models.CharField(max_length=16, choices=Risk.choices)
    probability = models.FloatField()
    radius_km = models.FloatField()
    center = models.PointField(srid=4326, geography=True, spatial_index=True)
    forecast = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]


class FeedbackEntry(models.Model):
    id = models.CharField(primary_key=True, max_length=40)
    sos = models.ForeignKey(SOSRequest, on_delete=models.CASCADE, related_name="feedback")
    type = models.CharField(max_length=80)
    by = models.CharField(max_length=160)
    at = models.CharField(max_length=40)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

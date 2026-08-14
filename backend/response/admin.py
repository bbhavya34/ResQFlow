from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import FeedbackEntry, FloodZone, ReliefCamp, RescueResource, SOSRequest


@admin.register(SOSRequest, RescueResource, ReliefCamp, FloodZone)
class SpatialAdmin(GISModelAdmin):
    list_per_page = 50


admin.site.register(FeedbackEntry)

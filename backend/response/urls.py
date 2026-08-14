from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    FeedbackEntryViewSet,
    FloodZoneViewSet,
    ReliefCampViewSet,
    RescueResourceViewSet,
    SOSRequestViewSet,
    bootstrap,
    health,
)


router = DefaultRouter()
router.register("sos", SOSRequestViewSet)
router.register("resources", RescueResourceViewSet)
router.register("camps", ReliefCampViewSet)
router.register("flood-zones", FloodZoneViewSet)
router.register("feedback", FeedbackEntryViewSet)

urlpatterns = [
    path("health/", health, name="health"),
    path("bootstrap/", bootstrap, name="bootstrap"),
    path("", include(router.urls)),
]

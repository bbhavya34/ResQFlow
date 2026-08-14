from django.contrib.gis.geos import Point
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import RescueResource, SOSRequest


class ResponseApiTests(APITestCase):
    def setUp(self):
        self.resource = RescueResource.objects.create(
            id="R-TEST",
            name="Test Rescue Boat",
            type="Boat",
            agency="Test SDRF",
            category="OFFICIAL",
            location=Point(76.3, 10.1, srid=4326),
            base="Test Base",
            capacity=10,
            capabilities=["Shallow water"],
            availability=RescueResource.Availability.AVAILABLE,
            verified=True,
            contact="100",
            last_update="now",
        )
        self.sos = SOSRequest.objects.create(
            id="SOS-TEST",
            channel="APP",
            location=Point(76.31, 10.11, srid=4326),
            place="Test Place",
            district="Ernakulam",
            state="Kerala",
            people=4,
            flood_depth_m=1.2,
            received_at="now",
            factors=[],
        )

    def test_health_confirms_postgis(self):
        response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["database"], "postgresql")
        self.assertTrue(response.data["postgis"])

    def test_assignment_updates_sos_and_resource_atomically(self):
        response = self.client.post(
            f"/api/v1/sos/{self.sos.id}/assign/",
            {"resourceId": self.resource.id, "status": "DISPATCHED"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.sos.refresh_from_db()
        self.resource.refresh_from_db()
        self.assertEqual(self.sos.assigned_resource_id, self.resource.id)
        self.assertEqual(self.sos.status, SOSRequest.Status.DISPATCHED)
        self.assertEqual(self.resource.availability, RescueResource.Availability.ENGAGED)

    def test_bootstrap_serializes_coordinates(self):
        response = self.client.get(reverse("bootstrap"))
        self.assertEqual(response.status_code, 200)
        item = response.data["sosList"][0]
        self.assertEqual(item["lat"], 10.11)
        self.assertEqual(item["lng"], 76.31)

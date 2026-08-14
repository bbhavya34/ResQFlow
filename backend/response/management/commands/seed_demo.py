from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from response.models import FeedbackEntry, FloodZone, ReliefCamp, RescueResource, SOSRequest


def point(lat, lng):
    return Point(lng, lat, srid=4326)


class Command(BaseCommand):
    help = "Idempotently seed the database with prototype disaster-response records."

    def handle(self, *args, **options):
        resources = [
            {
                "id": "R-KL-01",
                "name": "NDRF Rescue Boat 7",
                "type": "Boat",
                "agency": "NDRF 4th Battalion",
                "category": "OFFICIAL",
                "location": point(10.1024, 76.3561),
                "base": "Aluva",
                "capacity": 12,
                "capabilities": ["Shallow water", "First aid", "Livestock"],
                "availability": "AVAILABLE",
                "verified": True,
                "contact": "+91 90000 01001",
                "last_update": "2 min ago",
            },
            {
                "id": "R-AS-02",
                "name": "SDRF Swift Water Team",
                "type": "Team",
                "agency": "Assam SDRF",
                "category": "OFFICIAL",
                "location": point(26.1512, 91.7391),
                "base": "Guwahati",
                "capacity": 8,
                "capabilities": ["Swift water", "Rope rescue", "First aid"],
                "availability": "AVAILABLE",
                "verified": True,
                "contact": "+91 90000 01002",
                "last_update": "4 min ago",
            },
            {
                "id": "R-BR-03",
                "name": "District ALS Ambulance",
                "type": "Ambulance",
                "agency": "Bihar Health Department",
                "category": "OFFICIAL",
                "location": point(25.6123, 85.1418),
                "base": "Patna",
                "capacity": 4,
                "capabilities": ["ALS", "Medical", "Paramedic"],
                "availability": "AVAILABLE",
                "verified": True,
                "contact": "+91 90000 01003",
                "last_update": "1 min ago",
            },
            {
                "id": "R-KL-04",
                "name": "Verified Civilian Country Boat",
                "type": "Boat",
                "agency": "Aluva Boat Collective",
                "category": "CIVILIAN",
                "location": point(10.1192, 76.3422),
                "base": "Aluva East",
                "capacity": 9,
                "capabilities": ["Shallow water", "Local knowledge", "Livestock"],
                "availability": "AVAILABLE",
                "verified": True,
                "contact": "+91 90000 01004",
                "last_update": "3 min ago",
            },
        ]
        for item in resources:
            RescueResource.objects.update_or_create(id=item["id"], defaults=item)

        sos_records = [
            {
                "id": "A1029",
                "channel": "SMS",
                "raw": "SOS 10.1135 76.3512 6",
                "location": point(10.1135, 76.3512),
                "place": "Aluva East",
                "district": "Ernakulam",
                "state": "Kerala",
                "people": 6,
                "children": 2,
                "elderly": 1,
                "disabled": 1,
                "livestock": 3,
                "flood_depth_m": 2.4,
                "medical": True,
                "received_at": "4 min ago",
                "status": "NEW",
                "factors": [
                    {"label": "Flood depth", "value": 23, "max": 25, "note": "2.4 m reported"},
                    {"label": "Vulnerable people", "value": 19, "max": 20, "note": "Children, elderly and disabled"},
                    {"label": "Population", "value": 12, "max": 15, "note": "6 persons"},
                    {"label": "Road access", "value": 14, "max": 15, "note": "Road submerged"},
                    {"label": "History", "value": 9, "max": 10, "note": "Severe flood zone"},
                    {"label": "Livestock", "value": 4, "max": 5, "note": "3 cattle"},
                    {"label": "Resource distance", "value": 9, "max": 10, "note": "Boat within 3 km"},
                ],
            },
            {
                "id": "A1028",
                "channel": "APP",
                "raw": "",
                "location": point(26.1681, 91.7554),
                "place": "Noonmati",
                "district": "Kamrup Metropolitan",
                "state": "Assam",
                "people": 8,
                "children": 3,
                "elderly": 1,
                "disabled": 0,
                "livestock": 2,
                "flood_depth_m": 1.6,
                "medical": False,
                "received_at": "11 min ago",
                "status": "TRIAGED",
                "factors": [
                    {"label": "Flood depth", "value": 17, "max": 25, "note": "1.6 m and rising"},
                    {"label": "Vulnerable people", "value": 14, "max": 20, "note": "3 children, 1 elderly"},
                    {"label": "Population", "value": 13, "max": 15, "note": "8 persons"},
                    {"label": "Road access", "value": 11, "max": 15, "note": "Lane inaccessible"},
                    {"label": "History", "value": 8, "max": 10, "note": "Brahmaputra backflow"},
                    {"label": "Livestock", "value": 3, "max": 5, "note": "2 goats"},
                    {"label": "Resource distance", "value": 7, "max": 10, "note": "Team under 5 km"},
                ],
            },
            {
                "id": "A1027",
                "channel": "IVR",
                "raw": "",
                "location": point(25.6048, 85.1647),
                "place": "Rajendra Nagar",
                "district": "Patna",
                "state": "Bihar",
                "people": 3,
                "children": 0,
                "elderly": 2,
                "disabled": 0,
                "livestock": 0,
                "flood_depth_m": 1.2,
                "medical": True,
                "received_at": "18 min ago",
                "status": "NEW",
                "factors": [
                    {"label": "Flood depth", "value": 14, "max": 25, "note": "1.2 m reported"},
                    {"label": "Vulnerable people", "value": 16, "max": 20, "note": "2 elderly persons"},
                    {"label": "Population", "value": 8, "max": 15, "note": "3 persons"},
                    {"label": "Road access", "value": 10, "max": 15, "note": "Street waterlogged"},
                    {"label": "History", "value": 6, "max": 10, "note": "Recurring drainage flood"},
                    {"label": "Livestock", "value": 0, "max": 5, "note": "None"},
                    {"label": "Resource distance", "value": 8, "max": 10, "note": "Ambulance nearby"},
                ],
            },
        ]
        for item in sos_records:
            item["assigned_resource"] = None
            SOSRequest.objects.update_or_create(id=item["id"], defaults=item)

        camps = [
            {
                "id": "C-KL-01",
                "name": "Aluva Government HSS",
                "district": "Ernakulam",
                "state": "Kerala",
                "location": point(10.1076, 76.3579),
                "capacity": 500,
                "occupancy": 412,
                "food_days": 2.2,
                "water_days": 3.0,
                "medical_staff": 4,
                "urgent": ["Baby food", "Sanitary supplies"],
                "status": "STRAINED",
            },
            {
                "id": "C-AS-02",
                "name": "Noonmati Relief Centre",
                "district": "Kamrup Metropolitan",
                "state": "Assam",
                "location": point(26.1753, 91.7612),
                "capacity": 350,
                "occupancy": 289,
                "food_days": 1.4,
                "water_days": 2.1,
                "medical_staff": 2,
                "urgent": ["Food grain", "Doctor deputation"],
                "status": "CRITICAL",
            },
            {
                "id": "C-BR-03",
                "name": "Patna College Shelter",
                "district": "Patna",
                "state": "Bihar",
                "location": point(25.6172, 85.1683),
                "capacity": 420,
                "occupancy": 238,
                "food_days": 4.0,
                "water_days": 3.8,
                "medical_staff": 5,
                "urgent": [],
                "status": "STABLE",
            },
        ]
        for item in camps:
            ReliefCamp.objects.update_or_create(id=item["id"], defaults=item)

        zones = [
            {
                "id": "FZ-KL-01",
                "name": "Periyar Basin",
                "state": "Kerala",
                "river": "Periyar",
                "risk": "SEVERE",
                "probability": 0.91,
                "radius_km": 18,
                "center": point(10.12, 76.36),
                "forecast": "Idukki shutter release and heavy upstream rainfall",
            },
            {
                "id": "FZ-AS-02",
                "name": "Guwahati Urban Basin",
                "state": "Assam",
                "river": "Brahmaputra",
                "risk": "HIGH",
                "probability": 0.78,
                "radius_km": 14,
                "center": point(26.17, 91.75),
                "forecast": "Backflow risk with continued rainfall",
            },
            {
                "id": "FZ-BR-03",
                "name": "Patna Urban Drainage",
                "state": "Bihar",
                "river": "Ganga",
                "risk": "MODERATE",
                "probability": 0.62,
                "radius_km": 12,
                "center": point(25.61, 85.16),
                "forecast": "Drainage congestion near low-lying wards",
            },
        ]
        for item in zones:
            FloodZone.objects.update_or_create(id=item["id"], defaults=item)

        FeedbackEntry.objects.update_or_create(
            id="FB-1",
            defaults={
                "sos_id": "A1028",
                "type": "Situation update",
                "by": "Assam SDRF Control",
                "at": "12:48",
                "note": "Team mobilised; approach road remains partially accessible.",
            },
        )
        self.stdout.write(self.style.SUCCESS("PostGIS demo data is ready."))

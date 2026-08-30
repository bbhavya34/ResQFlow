from django.contrib import admin
from django.urls import include, path

from response.views import predict_hydrology


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/predict-hydrology/", predict_hydrology, name="predict-hydrology"),
    path("api/v1/", include("response.urls")),
]

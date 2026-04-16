"""Root URL configuration."""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("admin-api/", include("accounts.AccountUrls")),
    path("api/", include("accounts.urls")),
]

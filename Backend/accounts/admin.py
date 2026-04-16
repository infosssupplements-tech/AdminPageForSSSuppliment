"""Admin panel configuration for accounts app."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Referral, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "phone",
        "first_name",
        "last_name",
        "email",
        "points",
        "referral_code",
        "referred_by",
        "is_active",
        "date_joined",
    ]
    list_filter = ["is_active", "is_staff", "date_joined"]
    search_fields = ["phone", "email", "first_name", "last_name", "referral_code"]
    readonly_fields = ["referral_code", "points"]
    ordering = ["-date_joined"]

    fieldsets = (
        (None, {"fields": ("phone", "username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "email")}),
        (
            "Referral Info",
            {"fields": ("points", "referral_code", "referred_by")},
        ),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone", "email", "first_name", "last_name", "password1", "password2"),
            },
        ),
    )


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = [
        "referrer",
        "referee",
        "referrer_points_awarded",
        "referee_points_awarded",
        "created_at",
    ]
    list_filter = ["created_at"]
    search_fields = [
        "referrer__phone",
        "referrer__first_name",
        "referee__phone",
        "referee__first_name",
    ]
    readonly_fields = [
        "referrer",
        "referee",
        "referrer_points_awarded",
        "referee_points_awarded",
        "created_at",
    ]

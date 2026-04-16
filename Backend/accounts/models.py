"""
Models:
  - User          Custom user with `phone`, `points` and a unique `referral_code`.
  - Referral      Tracks who referred whom and how many points were awarded.
"""
import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended user with phone login, referral points and a unique referral code."""

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True)
    points = models.PositiveIntegerField(default=0)
    referral_code = models.CharField(max_length=12, unique=True, blank=True)
    referred_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals_made",
    )

    # Login via phone number
    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["username", "email"]

    def save(self, *args, **kwargs):
        # Auto-generate a unique referral code on first save
        if not self.referral_code:
            self.referral_code = uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.phone} - {self.first_name} ({self.points} pts)"


class Referral(models.Model):
    """
    Audit log for every successful referral.
    Created once when a referred user signs up.
    """

    referrer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referrals_given",
    )
    referee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referrals_received",
    )
    referrer_points_awarded = models.PositiveIntegerField()
    referee_points_awarded = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        # Prevent duplicate referral records
        constraints = [
            models.UniqueConstraint(
                fields=["referrer", "referee"],
                name="unique_referral",
            )
        ]

    def __str__(self):
        return f"{self.referrer.phone} -> {self.referee.phone}"

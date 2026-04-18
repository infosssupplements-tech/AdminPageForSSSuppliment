"""
Serializers for authentication, user profile, and referral data.

Frontend sends:
  Signup: { name, email, phone, password, confirmPassword, referralCode }
  Login:  { phone, password }
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

# User model is defined in models.py but is not managed by Django ORM.
# Actual user data is handled by MongoDB.


# ---------------------------------------------------------------------------
# Auth serializers
# ---------------------------------------------------------------------------
class SignupSerializer(serializers.Serializer):
    """
    Register a new user.
    Fields match the React frontend exactly:
      name, email, phone, password, confirmPassword, referralCode (optional)
    """

    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)
    confirmPassword = serializers.CharField(write_only=True, min_length=8)
    referralCode = serializers.CharField(
        write_only=True, required=False, allow_blank=True, default=""
    )

    def validate(self, data):
        if data["password"] != data["confirmPassword"]:
            raise serializers.ValidationError(
                {"confirmPassword": "Passwords do not match."}
            )
        return data


class LoginSerializer(serializers.Serializer):
    """Login with phone number + password."""
    phone = serializers.CharField()
    password = serializers.CharField()


# ---------------------------------------------------------------------------
# Profile & referral serializers
# ---------------------------------------------------------------------------

# The following serializers are commented out because they rely on Django's ORM
# and ModelSerializer, which is not used for actual data persistence in this project.
# User data is managed directly via MongoDB collections.
# If these serializers are needed for data representation, they should be
# rewritten as serializers.Serializer and handle data transformation manually
# from MongoDB documents.

# class UserProfileSerializer(serializers.ModelSerializer): ...
# class ReferralSerializer(serializers.ModelSerializer): ...
# class LeaderboardSerializer(serializers.ModelSerializer): ...

"""
Serializers for authentication, user profile, and referral data.

Frontend sends:
  Signup: { name, email, phone, password, confirmPassword, referralCode }
  Login:  { phone, password }
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Referral

User = get_user_model()


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

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    def validate_referralCode(self, value):
        if value:
            if not User.objects.filter(referral_code=value).exists():
                raise serializers.ValidationError("Invalid referral code.")
        return value

    def validate(self, data):
        if data["password"] != data["confirmPassword"]:
            raise serializers.ValidationError(
                {"confirmPassword": "Passwords do not match."}
            )
        return data

    def create(self, validated_data):
        referral_code = validated_data.get("referralCode", "")
        name = validated_data["name"]

        # Split name into first_name / last_name
        name_parts = name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        # Use phone as the username (since USERNAME_FIELD is phone)
        user = User(
            username=validated_data["phone"],  # required by AbstractUser
            email=validated_data["email"],
            phone=validated_data["phone"],
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(validated_data["password"])
        user.save()

        # --- Process referral ---
        if referral_code:
            try:
                referrer = User.objects.get(referral_code=referral_code)
            except User.DoesNotExist:
                return user

            if referrer.pk == user.pk:
                return user  # can't refer yourself

            referrer_pts = getattr(
                settings, "REFERRAL_POINTS_FOR_REFERRER", 100
            )
            referee_pts = getattr(
                settings, "REFERRAL_POINTS_FOR_REFEREE", 50
            )

            # Award points
            referrer.points += referrer_pts
            referrer.save(update_fields=["points"])

            user.points += referee_pts
            user.referred_by = referrer
            user.save(update_fields=["points", "referred_by"])

            # Create audit record
            Referral.objects.create(
                referrer=referrer,
                referee=user,
                referrer_points_awarded=referrer_pts,
                referee_points_awarded=referee_pts,
            )

        return user


class LoginSerializer(serializers.Serializer):
    """Login with phone number + password."""
    phone = serializers.CharField()
    password = serializers.CharField()


# ---------------------------------------------------------------------------
# Profile & referral serializers
# ---------------------------------------------------------------------------
class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only profile data shown on the user's dashboard."""

    name = serializers.SerializerMethodField()
    total_referrals = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "points",
            "referral_code",
            "total_referrals",
            "date_joined",
        ]
        read_only_fields = fields

    def get_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full if full else obj.username

    def get_total_referrals(self, obj):
        return obj.referrals_given.count()


class ReferralSerializer(serializers.ModelSerializer):
    """Detail of a single referral record."""

    referrer_phone = serializers.CharField(source="referrer.phone", read_only=True)
    referrer_name = serializers.SerializerMethodField()
    referee_phone = serializers.CharField(source="referee.phone", read_only=True)
    referee_name = serializers.SerializerMethodField()

    class Meta:
        model = Referral
        fields = [
            "id",
            "referrer_phone",
            "referrer_name",
            "referee_phone",
            "referee_name",
            "referrer_points_awarded",
            "referee_points_awarded",
            "created_at",
        ]
        read_only_fields = fields

    def get_referrer_name(self, obj):
        return f"{obj.referrer.first_name} {obj.referrer.last_name}".strip()

    def get_referee_name(self, obj):
        return f"{obj.referee.first_name} {obj.referee.last_name}".strip()


class LeaderboardSerializer(serializers.ModelSerializer):
    """Minimal user data for the points leaderboard."""

    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "phone", "points"]
        read_only_fields = fields

    def get_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full if full else obj.username

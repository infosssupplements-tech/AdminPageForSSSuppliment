"""Admin auth helpers for JWT generation and authentication."""

from datetime import datetime, timedelta
from types import SimpleNamespace

import jwt
from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header


def _jwt_secret() -> str:
    """Return a non-empty secret even when env vars are misconfigured."""
    return (
        getattr(settings, "SECRET_KEY", None)
        or getattr(settings, "DJANGO_SECRET_KEY", None)
        or "django-insecure-change-this-in-production"
    )


def generate_token(admin: dict) -> str:
    """Generate a short-lived JWT for admin login responses."""
    now = datetime.utcnow()
    payload = {
        "admin_id": str(admin.get("_id", "")),
        "email": admin.get("email", ""),
        "name": admin.get("name", "Admin"),
        "type": "admin_access",
        "iat": now,
        "exp": now + timedelta(hours=24),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


class AdminJWTAuthentication(BaseAuthentication):
    """Authenticate admin endpoints with the custom JWT from generate_token()."""

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        if not auth:
            return None
        if auth[0].lower() != b"bearer":
            return None
        if len(auth) != 2:
            raise exceptions.AuthenticationFailed("Invalid Authorization header.")

        token = auth[1].decode("utf-8")
        try:
            payload = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token has expired.")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Invalid token.")

        admin_id = str(payload.get("admin_id", ""))
        email = payload.get("email", "")
        name = payload.get("name", "Admin")
        if not admin_id:
            raise exceptions.AuthenticationFailed("Invalid token payload.")

        # request.user only needs id/email/name for current admin views.
        user = SimpleNamespace(
            id=admin_id,
            email=email,
            name=name,
            is_authenticated=True,
        )
        return (user, token)

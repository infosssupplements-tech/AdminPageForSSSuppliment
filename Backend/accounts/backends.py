"""Custom authentication backend - login with phone number instead of username."""
from django.contrib.auth import get_user_model

User = get_user_model()


class PhoneBackend:
    """Authenticate using phone number + password."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        `username` param receives the phone number value.
        This is because Django's authenticate() maps the first
        positional credential to `username` by default.
        """
        phone = kwargs.get("phone", username)
        if phone is None:
            return None

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return None

        if user.check_password(password):
            return user
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

import jwt
from datetime import datetime, timedelta
from django.conf import settings

ACCESS_TOKEN_LIFETIME = timedelta(hours=24)
REFRESH_TOKEN_LIFETIME = timedelta(days=7)
ACCESS_TOKEN_EXPIRY = 24 * 60 * 60 

def generate_tokens_for_user(user_id: str):
    now = datetime.utcnow()

    access_payload = {
        "user_id": user_id,      
        "type": "access",
        "exp": now + ACCESS_TOKEN_LIFETIME,
        "iat": now,
    }

    refresh_payload = {
        "user_id": user_id,      
        "type": "refresh", 
        "exp": now + REFRESH_TOKEN_LIFETIME,
        "iat": now,
    }

    access_token = jwt.encode(
        access_payload,
        settings.SECRET_KEY,
        algorithm="HS256"
    )

    refresh_token = jwt.encode(
        refresh_payload,
        settings.SECRET_KEY,
        algorithm="HS256"
    )

    return {
        "access": access_token,
        "refresh": refresh_token,
    }
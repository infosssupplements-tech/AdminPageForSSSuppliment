from rest_framework.response import Response
from mongo.collections import users_col, referrals_col
from utils.password import hash_password, verify_password
from utils.jwt import generate_tokens_for_user


def LoginLogic(phone, password) :
    if not phone or not password:
        return Response({"detail": "Phone and password required"}, status=400)

    user = users_col.find_one({"phone": phone})
    if not user or not verify_password(password, user["password"]):
        return Response({"detail": "Invalid credentials"}, status=401)
     
    tokens = generate_tokens_for_user(str(user["_id"]))
    return tokens, user
from utils.jwt_helper import decode_token
from mongo.collections import users_col, referrals_col
from bson import ObjectId
from rest_framework.response import Response


def ProfileForRefferal(auth) :
    token = auth.replace("Bearer ", "")
    payload = decode_token(token)
    user = users_col.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        return Response({"detail": "User not found"}, status=404)
    return user
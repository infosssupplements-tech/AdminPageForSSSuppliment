from rest_framework.response import Response
from rest_framework import status
from mongo.collections import users_col, otps_col
import secrets
from datetime import datetime, timedelta


def FPassword(request):
    phone = str(request.data.get('phone', '')).strip()
    email = str(request.data.get('email', '')).strip().lower()
    if not phone or not email:
        return Response({
            "success": False, 
            "error": "Phone and email required"
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find user
    user_data = users_col.find_one({'phone': phone, 'email': email})
    
    print(f"USER FOUND: {user_data is not None}")

    if not user_data:
        return Response({
            "success": False,
            "error": "No user found with this phone and email"
        }, status=status.HTTP_404_NOT_FOUND)

    
    otps_col.delete_many({'phone': phone, 'email': email})

    
    otp_code = str(secrets.randbelow(900000) + 100000)
    expires_at = datetime.now() + timedelta(minutes=10)
    otp_doc = {
        'user_id': str(user_data['_id']),
        'phone': phone,
        'email': email,
        'name': user_data.get('name', 'User'),
        'otp': otp_code,
        'is_used': False,
        'expires_at': expires_at,
        'created_at': datetime.now()
    }
    
    otps_col.insert_one(otp_doc)
    return Response({
        "success": True,
        "message": "User info with OTP ready - send email from frontend",
        "data": {
            "name": user_data.get('name', 'User'),
            "phone": phone,
            "email": email,
            "otp": otp_code 
        }
    }, status=status.HTTP_200_OK)

from datetime import datetime
from rest_framework.response import Response


def RPassword(request, otps_col, users_col, hash_password):
    """Reset password after OTP verification"""
    print("RESET_PASSWORD")
    print("DATA:", request.data)

    phone = str(request.data.get('phone', '')).strip()
    email = str(request.data.get('email', '')).strip()
    otp_code = str(request.data.get('otp', '')).strip()
    new_password = str(request.data.get('new_password', '')).strip()
    
    if not all([phone, email, otp_code, new_password]):
        return Response({"success": False, "error": "All fields required"}, status=400)
    
    if len(new_password) < 6:
        return Response({"success": False, "error": "Password must be 6+ characters"}, status=400)

    otp_doc = otps_col.find_one({
        'phone': phone,
        'email': email,
        'otp': otp_code,
        'is_used': True,
        'expires_at': {'$gt': datetime.now()}
    })
    
    if not otp_doc:
        return Response({"success": False, "error": "Verify OTP first"}, status=400)

    hashed_password = hash_password(new_password)
    result = users_col.update_one(
        {'phone': phone, 'email': email},
        {'$set': {'password': hashed_password}}
    )
    
    if result.modified_count == 0:
        return Response({"success": False, "error": "User not found"}, status=404)

    otps_col.delete_one({'_id': otp_doc['_id']})
    
    print("PASSWORD RESET SUCCESS!")
    return Response({
        "success": True, 
        "message": "Password reset successful! Login now."
    })

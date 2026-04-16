from rest_framework.response import Response
from utils.jwt_helper import decode_token
from bson import ObjectId


def ProfiView(request, users_collection) :
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Token required'}, status=401)
        
        token = auth_header.split(' ')[1]
        payload = decode_token(token)
        user_id = payload['user_id']
        
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return Response({'error': 'User not found'}, status=404)
        
        return Response({
            'points': int(user.get('points', 0)),
            'phone': user.get('phone', ''),
            'name': user.get('name', ''),
            'email': user.get('email', ''),
            'referral_code': user.get('referral_code', '')
        })
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=401)
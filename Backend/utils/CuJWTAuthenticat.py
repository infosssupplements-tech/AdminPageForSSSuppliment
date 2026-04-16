from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from mongo.collections import users_col, user_addresses_col
import jwt
from django.conf import settings
from datetime import datetime
from utils.password import verify_password, hash_password
from bson import ObjectId
import traceback


class CustomJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '): 
            return None
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            if not user_id: 
                return None  
            user = users_col.find_one({"_id": ObjectId(str(user_id))})
            if not user: 
                return None
            
            user_dict = dict(user)
            user_dict['id'] = str(user_id)
            return (user_dict, payload)
            
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            return None
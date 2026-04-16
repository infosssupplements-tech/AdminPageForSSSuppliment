from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from rest_framework.response import Response
from pymongo import MongoClient
from bson import ObjectId
from utils.jwt_helper import decode_token
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
from mongo.collections import users_col, referrals_col
from Mail.mail import MailFunction
from utils.password import hash_password, verify_password
from utils.jwt import generate_tokens_for_user
from utils.jwt_helper import decode_token
from django.core.mail import EmailMultiAlternatives
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.conf import settings
from datetime import datetime, timedelta
from mongo.collections import users_col, otps_col
from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import api_view, permission_classes
from .db import get_products_collection


from .RouterFunctions.Signup import signup_logic
from .RouterFunctions.login import LoginLogic
from .RouterFunctions.ProfileShowForRefferPoint import ProfileForRefferal
from .RouterFunctions.Refferal import get_my_referrals
from .RouterFunctions.CreateUserOrder import CreateOrderUser, calculate_order_quote, get_user_id_from_auth
import requests
import hmac
import hashlib
from .RouterFunctions.ForgotPassword import FPassword
from .RouterFunctions.ResetPassword import RPassword
from .RouterFunctions.VerifyOTP import VOtp
from .RouterFunctions.ProfileView import ProfiView
from .RouterFunctions.LboardView import board
from utils.CuJWTAuthenticat import CustomJWTAuthentication
# .................................................. UserAccount Portion ...........................................
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from mongo.collections import users_col, user_addresses_col, orders_col
import jwt
from django.conf import settings
from datetime import datetime
from utils.password import verify_password, hash_password
from bson import ObjectId
import traceback




load_dotenv()

#MONGO_URI = os.getenv(
#    "MONGO_URI",
#    "mongodb+srv://sssuppliment2025_db_user:hvwSArrVRQFhEsAD@supplimentcluster.q0id4n0.mongodb.net/sssuppliment_db?retryWrites=true&w=majority"
#)
#mongo_client = MongoClient(MONGO_URI)
#db = mongo_client["sssuppliment_db"]  
#orders_collection = db['orders']
#users_collection = db['users']
#user_addresses_col = db['user_address']






#####################################################################################################################
# .................................................. UserAccount Portion ...........................................
class ProfileForAccountView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    def get(self, request):
        try:
            if not request.user or 'id' not in request.user:
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = request.user['id']
            
            
            user_data = users_col.find_one({"_id": ObjectId(str(user_id))})
            if not user_data:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
         
            address_data = user_addresses_col.find_one({"user_id": str(user_id)})
            
          
            if address_data:
                address_dict = dict(address_data)
                if '_id' in address_dict:
                    address_dict['id'] = str(address_dict['_id'])
                    del address_dict['_id']
            else:
                address_dict = {}
            
            response_data = {
                "id": str(user_id),
                "email": user_data.get('email', '') or '',
                "name": user_data.get('name', '') or '',
                "phone": user_data.get('phone', '') or '',
                "address": address_data.get('full_address', '') if address_data else '',
                "points": user_data.get('points', 0),
                "address_fields": address_dict  
            }
            
            #print(f"Returning: {response_data}") 
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            #print(f"GET Profile ERROR: {str(e)}")
            #print(traceback.format_exc())
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        try:
            #print(f"PUT Profile - request.user: {request.user}")
            
            if not request.user or 'id' not in request.user:
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = request.user['id']
            data = request.data
            #print(f"Frontend sent: {data}")
            
           
            address_fields = data.get('address_fields', {})
            full_address = data.get('address', '')
            
            #print(f"Full address: {full_address}")
            #print(f"Address fields: {address_fields}")
            
            
            address_doc = {
                "user_id": str(user_id),  
                "full_address": full_address or '',
                "delivery_phone": address_fields.get('delivery_phone', '') or '',
                "flat_house": address_fields.get('flat_house', '') or '',
                "address2": address_fields.get('address2', '') or '',
                "address3": address_fields.get('address3', '') or '',
                "area_street": address_fields.get('area_street', '') or '',
                "town_city": address_fields.get('town_city', '') or '',
                "state": address_fields.get('state', '') or '',
                "pincode": address_fields.get('pincode', '') or '',
                "landmark": address_fields.get('landmark', '') or '',
                "updated_at": datetime.utcnow()
            }
            
            #print(f"Saving address_doc: {address_doc}")
            
           
            result = user_addresses_col.update_one(
                {"user_id": str(user_id)},
                {"$set": address_doc},
                upsert=True
            )
            
            #print(f"Update result: {result.modified_count} modified, {result.upserted_id}") 
            
            return Response({
                "message": "Profile updated successfully",
                "address": full_address,
                "address_fields": address_fields
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            #print(f"PUT Profile ERROR: {str(e)}")
            #print(traceback.format_exc())
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ChangePasswordView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    
    def post(self, request):
        try:
            if not request.user or 'id' not in request.user:
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = request.user['id']
            data = request.data
            
            user_data = users_col.find_one({"_id": ObjectId(str(user_id))})
            if not user_data:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            
            current_password = data.get('current_password', '')
            if not current_password:
                return Response({"error": "Current password required"}, status=status.HTTP_400_BAD_REQUEST)
                
            if not verify_password(current_password, user_data.get('password')):
                return Response({"error": "Current password incorrect"}, status=status.HTTP_400_BAD_REQUEST)
            
            
            new_password = data.get('new_password', '')
            confirm_password = data.get('confirm_password', '')
            
            if new_password != confirm_password:
                return Response({"error": "New passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
            
            if len(new_password) < 6:
                return Response({"error": "New password must be at least 6 characters"}, status=status.HTTP_400_BAD_REQUEST)
            
            
            new_hashed = hash_password(new_password)
            users_col.update_one(
                {"_id": ObjectId(str(user_id))}, 
                {"$set": {"password": new_hashed, "updated_at": datetime.utcnow()}}
            )
            
            return Response({"message": "Password changed successfully"})
            
        except Exception as e:
            #print(f"Change Password ERROR: {str(e)}")
            #print(traceback.format_exc())
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





######### ================== Mail Function ===================
def MailFunction(userMail, userName, password):
    subject = 'Testing mail'
    from_email = settings.EMAIL_HOST_USER
    to_email = userMail
    text_content = 'This is a fallback plain text message.'
    html_content = f'<p><pre>Hi {userName}, thank you for signing up on UPOLABDHI!......... 🎉</pre> <pre>Your username: {userName}Y \our password: {password}....🔑</pre>  <pre>Please keep your credentials safe and do not share them with others........</pre>   <pre>Your registration was successful.....😊😊 — Welcome to UPOLABDHI!..... 😀😀</pre></p>'

    msg = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()
######### ================== Mail Function ===================

# Add to your utils or signup_logic file
#import random
#import string

#def generate_referral_code(length=8):
#    """Generate unique referral code like 'ABCD1234'"""
#    chars = string.ascii_uppercase + string.digits
#    code = ''.join(random.choices(chars, k=length))
#    return code











# ================== HEALTH CHECK ==================
def wake_up(request):
    return JsonResponse({"status": "backend awake"})


@api_view(['GET'])
@permission_classes([AllowAny])
def products_public(request):
    """Public read-only products endpoint for frontend runtime sync."""
    try:
        collection = get_products_collection()
        products = list(collection.find({}))
        for product in products:
            if "_id" in product:
                product["_id"] = str(product["_id"])
            if "id" in product:
                product["id"] = str(product["id"])

        return Response({"success": True, "data": products}, status=status.HTTP_200_OK)
    except Exception as exc:
        return Response(
            {"success": False, "data": [], "error": str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


# .............................................. SIGNUP ...............................................
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            phone = data.get("phone")
            password = data.get("password")
            name = data.get("name")
            email = data.get("email")
            referral_code = data.get("referralCode")
            
            print("📱 Signup request:", {
                "phone": phone[:4] + "****" if phone else None,
                "name": name,
                "has_referral": bool(referral_code)
            })

            user_id, user, tokens = signup_logic(
                data, phone, password, name, email, referral_code
            )
            
            return Response({
                "success": True,
                "user": {
                    "id": user_id,
                    "name": user["name"],
                    "phone": user["phone"],
                    "email": user.get("email"),
                    "points": user.get("points", 0), 
                    "referral_code": user.get("referral_code"),
                },
                "tokens": tokens,
            }, status=201)
            
        except ValueError as ve:
            print(f"Validation error: {str(ve)}")
            return Response({
                "success": False,
                "error": str(ve)
            }, status=400)
            
        except Exception as e:
            print(f"Signup error: {str(e)}")
            return Response({
                "success": False,
                "error": "Signup failed. Please try again."
            }, status=500)

        


# ....................................... LOGIN ...................................................
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone")
        password = request.data.get("password")

        tokens, user = LoginLogic(phone, password)


        return Response({
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "phone": user["phone"],
                "email": user.get("email"),
                "points": user.get("points", 0),
            },
            "tokens": tokens,
        })


# .............................................. PROFILE ..................................................
class ProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return Response({"detail": "Unauthorized"}, status=401)

        try:
            user = ProfileForRefferal(auth)

            return Response({
                "id": str(user["_id"]),
                "name": user["name"],
                "phone": user["phone"],
                "email": user.get("email"),
                "points": user.get("points", 0),
                "referral_code": user.get("referral_code") or str(user["_id"]),
                "total_referrals": referrals_col.count_documents({"referrer_id": str(user["_id"])}),
            })
        except Exception as e:
            print("PROFILE ERROR:", e)
            return Response({"detail": "Invalid token"}, status=401)


# # .............................................. MY REFERRALS .................................................. 
class MyReferralsView(APIView):
    def get(self, request):
        try:
            auth = request.headers.get("Authorization")
            referrals = get_my_referrals(auth)  
            return Response(referrals, status=status.HTTP_200_OK)
            
        except Exception as e:
            print("REFERRAL VIEW ERROR:", e)
            return Response([], status=status.HTTP_200_OK)


# .................................................. LEADERBOARD ...................................................
class LeaderboardView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
            print('Leaderboard requested...')
            users_cursor = users_col.find().sort("points", -1).limit(50)
            return board(users_cursor)
            









# ................................................ Order placed with coin =.............................................
from rest_framework.decorators import api_view
from rest_framework.response import Response

from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def order_quote(request):
    try:
        auth_header = request.headers.get('Authorization')
        data = request.data

        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Token required'}, status=401)

        user_id = get_user_id_from_auth(auth_header)
        user = users_col.find_one({"_id": ObjectId(user_id)})
        if not user:
            return Response({'error': 'User not found'}, status=404)

        items = data.get("items", [])
        use_coins = bool(data.get("use_coins", False))
        quote = calculate_order_quote(items, user.get("points", 0), use_coins=use_coins)

        return Response(
            {
                "success": True,
                "data": {
                    "points": user.get("points", 0),
                    "items_subtotal": quote["items_subtotal"],
                    "shipping_fee": quote["shipping_fee"],
                    "is_free_shipping": quote["is_free_shipping"],
                    "cart_total_with_shipping": quote["cart_total"],
                    "max_coins_allowed": quote["max_coins_allowed"],
                    "coins_used": quote["coins_used"],
                    "coin_discount": quote["coin_discount_value"],
                    "final_total": quote["final_total"],
                    "coin_value": quote["coin_value"],
                    "coin_percent": quote["coin_percent"],
                    "earned_points": quote["earned_points"],
                },
            },
            status=200,
        )
    except ValueError as ve:
        return Response({'error': str(ve)}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def create_order(request):
    try:
        auth_header = request.headers.get('Authorization')
        data = request.data
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Token required'}, status=401)
        
        order_id, earned_points, new_points, quote = CreateOrderUser(
            auth_header, 
            data, 
            users_col, 
            orders_col
        )
        
        print(f"✅ Order {order_id} created! Earned: {earned_points}, New points: {new_points}")
        
        return Response({
            'order': {
                'id': order_id,
                'earnedPoints': earned_points,
                'summary': {
                    'items_subtotal': quote["items_subtotal"],
                    'shipping_fee': quote["shipping_fee"],
                    'cart_total_with_shipping': quote["cart_total"],
                    'coins_used': quote["coins_used"],
                    'coin_discount': quote["coin_discount_value"],
                    'final_total': quote["final_total"],
                }
            },
            'earnedPoints': earned_points,  
            'user': {
                'points': new_points         
            }
        }, status=201)
        
    except ValueError as ve:
        print(f"Validation error: {str(ve)}")
        return Response({'error': str(ve)}, status=400)
        
    except Exception as e:
        print(f"Order error: {str(e)}")
        print(f"Request data: {request.data}")
        return Response({
            'error': str(e),
            'detail': 'Order creation failed'
        }, status=500)







# ................................................ profile_view .............................................

@api_view(['POST'])
def razorpay_create_order(request):
    try:
        auth_header = request.headers.get('Authorization')
        data = request.data

        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Token required'}, status=401)

        items = data.get('items', [])
        use_coins = bool(data.get('use_coins', False))

        user_id = get_user_id_from_auth(auth_header)
        user = users_col.find_one({'_id': ObjectId(user_id)})
        if not user:
            return Response({'error': 'User not found'}, status=404)

        quote = calculate_order_quote(items, user.get('points', 0), use_coins=use_coins)
        amount_in_paise = int(round(quote['final_total'] * 100))

        key_id = getattr(settings, 'RAZORPAY_KEY_ID', None)
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        if not key_id or not key_secret:
            return Response({'error': 'Razorpay keys are not configured.'}, status=500)

        payload = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'receipt': f'order_{uuid.uuid4().hex[:12]}',
            'payment_capture': 1,
        }

        response = requests.post(
            'https://api.razorpay.com/v1/orders',
            auth=(key_id, key_secret),
            json=payload,
        )

        if response.status_code not in (200, 201):
            return Response({'error': 'Failed to create Razorpay order', 'detail': response.text}, status=500)

        razorpay_data = response.json()
        return Response({
            'success': True,
            'razorpayOrderId': razorpay_data.get('id'),
            'amount': razorpay_data.get('amount'),
            'currency': razorpay_data.get('currency'),
            'keyId': key_id,
            'quote': {
                'final_total': quote['final_total'],
                'items_subtotal': quote['items_subtotal'],
                'shipping_fee': quote['shipping_fee'],
                'cart_total_with_shipping': quote['cart_total'],
                'coins_used': quote['coins_used'],
                'coin_discount': quote['coin_discount_value'],
            },
        }, status=201)

    except Exception as e:
        print(f"Razorpay create order error: {e}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def razorpay_verify_payment(request):
    try:
        auth_header = request.headers.get('Authorization')
        data = request.data

        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Token required'}, status=401)

        user_id = get_user_id_from_auth(auth_header)
        user = users_col.find_one({'_id': ObjectId(user_id)})
        if not user:
            return Response({'error': 'User not found'}, status=404)

        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        items = data.get('items', [])
        use_coins = bool(data.get('use_coins', False))
        address = data.get('address', {})

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return Response({'error': 'Razorpay payment details are required'}, status=400)

        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        expected_signature = hmac.new(
            key_secret.encode('utf-8'),
            msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8'),
            digestmod=hashlib.sha256,
        ).hexdigest()

        if expected_signature != razorpay_signature:
            return Response({'error': 'Invalid Razorpay signature'}, status=400)

        order_id, earned_points, new_points, quote = CreateOrderUser(
            auth_header,
            {
                'items': items,
                'use_coins': use_coins,
                'payment_method': 'online',
                'address': address,
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            },
            users_col,
            orders_col,
        )

        return Response({
            'success': True,
            'order': {
                'id': order_id,
                'earnedPoints': earned_points,
                'summary': {
                    'items_subtotal': quote['items_subtotal'],
                    'shipping_fee': quote['shipping_fee'],
                    'cart_total_with_shipping': quote['cart_total'],
                    'coins_used': quote['coins_used'],
                    'coin_discount': quote['coin_discount_value'],
                    'final_total': quote['final_total'],
                },
            },
            'user': {'points': new_points},
        }, status=201)

    except Exception as e:
        print(f"Razorpay verify payment error: {e}")
        return Response({'error': str(e)}, status=500)


# ................................................ profile_view .............................................
@api_view(['GET'])
def profile_view(request):
    return ProfiView(request, users_col)





################################################################################################################
################################################################################################################
# ................................................ forgot_password .............................................
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Generate OTP and return user info to frontend for email"""
    #print("FORGOT_PASSWORD START")
    #print("DATA:", request.data)
    return FPassword(request)

    
# ................................................ verify_otp .............................................
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify OTP from frontend"""
    #print("VERIFY_OTP")
    #print("DATA:", request.data)
    return VOtp(request, otps_col)

# ................................................ reset_password .............................................
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    return RPassword(request, otps_col, users_col, hash_password)






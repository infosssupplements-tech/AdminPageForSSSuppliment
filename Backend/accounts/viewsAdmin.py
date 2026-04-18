"""
API Views for SSSupplement Admin Backend.
Full CRUD for Users, Referrals, Orders, Products + Auth.
"""

from datetime import datetime, timezone
import os
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import PyMongoError
import bcrypt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings

from .db import (
    get_users_collection,
    get_referrals_collection,
    get_orders_collection,
    get_products_collection,
    get_admins_collection,
    get_supplement_inventory_collection,
    get_sports_inventory_collection,
    get_bills_collection,
    get_bill_items_collection,
)
from .serializers_admin import (
    UserSerializer, UserUpdateSerializer,
    ReferralSerializer, ReferralUpdateSerializer,
    OrderSerializer, OrderUpdateSerializer,
    ProductSerializer, ProductUpdateSerializer,
    SupplementInventorySerializer, SportsInventorySerializer,
    BillSerializer, BillItemSerializer,
    LoginSerializer,
)
from .authentication import generate_token, AdminJWTAuthentication


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    for k in list(doc.keys()):
        if isinstance(doc[k], ObjectId):
            doc[k] = str(doc[k])
    return doc


def serialize_docs(docs):
    """Convert list of MongoDB documents."""
    return [serialize_doc(doc) for doc in docs]


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# ─── Auth Views ──────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    """Admin login endpoint."""
    permission_classes = [AllowAny]

    def post(self, request):
        # print("LoginView post called")
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Check against admin collection first
        admin = None
        try:
            admins = get_admins_collection()
            admin = admins.find_one({'email': email})
        except PyMongoError as e:
            # print(f"MongoDB error: {e}")
            # If MongoDB is unavailable, continue with env-based admin auth fallback.
            admin = None

        # print(f"admin: {admin}")

        if admin:
            stored_password = admin.get('password', '')
            password_ok = False

            # Support both bcrypt-hashed and legacy plain-text stored passwords.
            if isinstance(stored_password, bytes):
                try:
                    password_ok = bcrypt.checkpw(password.encode('utf-8'), stored_password)
                except ValueError:
                    password_ok = False
            elif isinstance(stored_password, str):
                if stored_password.startswith('$2'):
                    try:
                        password_ok = bcrypt.checkpw(
                            password.encode('utf-8'),
                            stored_password.encode('utf-8')
                        )
                    except ValueError:
                        password_ok = False
                else:
                    password_ok = (password == stored_password)

            if password_ok:
                token = generate_token(admin)
                response = Response({
                    'success': True,
                    'token': token,
                    'admin': {
                        '_id': str(admin.get('_id', '')),
                        'email': admin.get('email', email),
                        'name': admin.get('name', 'Admin'),
                    }
                })
                response.set_cookie(
                    'admin_token',
                    token,
                    max_age=60 * 60 * 24 * 7,
                    httponly=True,
                    samesite='Lax'
                )
                return response

        # Fallback: check environment variable credentials
        admin_email = "khutiasudip@gmail.com"
        admin_password = "9547899170"
        # print(f"admin_email: {admin_email}, admin_password: {admin_password}")
        if admin_email and admin_password and email == admin_email and password == admin_password:
            # print("Credentials match")
            admin_data = {
                '_id': 'env_admin',
                'email': email,
                'name': 'Admin',
            }
            token = generate_token(admin_data)
            # print(f"token: {token}")
            response = Response({
                'success': True,
                'token': token,
                'admin': {
                    '_id': 'env_admin',
                    'email': email,
                    'name': 'Admin',
                }
            })
            response.set_cookie(
                'admin_token',
                token,
                max_age=60 * 60 * 24 * 7,
                httponly=True,
                samesite='Lax'
            )
            return response

        return Response(
            {'success': False, 'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@method_decorator(csrf_exempt, name='dispatch')
class TestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({"ok": True})


@method_decorator(csrf_exempt, name='dispatch')
class MeView(APIView):
    """Get current authenticated admin info."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        return Response({
            'success': True,
            'admin': {
                '_id': request.user.id,
                'email': request.user.email,
                'name': request.user.name,
            }
        })


class LogoutView(APIView):
    """Admin logout endpoint."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def post(self, request):
        # For JWT, logout is just client-side token removal
        # But we can return success
        response = Response({
            'success': True,
            'message': 'Logged out successfully'
        })
        response.delete_cookie('admin_token')
        return response


# ─── Dashboard View ──────────────────────────────────────────────────

class DashboardView(APIView):
    """Dashboard stats endpoint."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        users = get_users_collection()
        orders = get_orders_collection()
        products = get_products_collection()
        referrals = get_referrals_collection()

        total_users = users.count_documents({})
        total_orders = orders.count_documents({})
        total_products = products.count_documents({})
        total_referrals = referrals.count_documents({})

        # Calculate total revenue from delivered orders
        pipeline = [
            {'$match': {'status': {'$in': ['confirmed', 'shipped', 'delivered']}}},
            {'$group': {'_id': None, 'total': {'$sum': '$cash_paid'}}}
        ]
        revenue_result = list(orders.aggregate(pipeline))
        total_revenue = revenue_result[0]['total'] if revenue_result else 0

        # Pending orders
        pending_orders = orders.count_documents({'status': 'pending'})

        # Recent orders
        recent_orders = list(
            orders.find().sort('created_at', -1).limit(5)
        )

        # Recent referrals
        recent_referrals = list(
            referrals.find().sort('created_at', -1).limit(5)
        )

        return Response({
            'success': True,
            'data': {
                'total_users': total_users,
                'total_orders': total_orders,
                'total_products': total_products,
                'total_referrals': total_referrals,
                'total_revenue': total_revenue,
                'pending_orders': pending_orders,
                'recent_orders': serialize_docs(recent_orders),
                'recent_referrals': serialize_docs(recent_referrals),
            }
        })


# ─── User Views ──────────────────────────────────────────────────────

class UserListCreateView(APIView):
    """List all users or create a new user."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        collection = get_users_collection()

        # Search & filter
        query = {}
        search = request.query_params.get('search', '')
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
                {'phone': {'$regex': search, '$options': 'i'}},
            ]

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        skip = (page - 1) * page_size

        total = collection.count_documents(query)
        users = list(
            collection.find(query)
            .sort('created_at', -1)
            .skip(skip)
            .limit(page_size)
        )

        return Response({
            'success': True,
            'data': serialize_docs(users),
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
            }
        })

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        collection = get_users_collection()
        data = serializer.validated_data

        # Check duplicate email
        if collection.find_one({'email': data['email']}):
            return Response(
                {'success': False, 'error': 'Email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Hash password if provided
        password = data.get('password', 'default123')
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        now = datetime.now(timezone.utc)
        user_doc = {
            'phone': data['phone'],
            'email': data['email'],
            'name': data['name'],
            'password': hashed.decode('utf-8'),
            'points': data.get('points', 0),
            'referral_code': data.get('referral_code'),
            'created_at': now,
            'updated_at': now,
        }

        result = collection.insert_one(user_doc)
        user_doc['_id'] = str(result.inserted_id)

        return Response(
            {'success': True, 'data': serialize_doc(user_doc)},
            status=status.HTTP_201_CREATED
        )


class UserDetailView(APIView):
    """Retrieve, update, or delete a single user."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get_object(self, pk):
        collection = get_users_collection()
        try:
            return collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({'success': True, 'data': serialize_doc(user)})

    def put(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UserUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        update_data = {k: v for k, v in serializer.validated_data.items() if v is not None}
        update_data['updated_at'] = datetime.now(timezone.utc)

        collection = get_users_collection()
        collection.update_one(
            {'_id': ObjectId(pk)},
            {'$set': update_data}
        )

        updated_user = self.get_object(pk)
        return Response({'success': True, 'data': serialize_doc(updated_user)})

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        collection = get_users_collection()
        collection.delete_one({'_id': ObjectId(pk)})
        return Response({'success': True, 'message': 'User deleted.'})


# ─── User Address View ───────────────────────────────────────────────

class UserAddressView(APIView):
    """Get addresses for a user from their orders."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request, pk):
        orders = get_orders_collection()
        user_orders = list(orders.find({'user_id': pk}, {'address': 1, 'order_id': 1}))
        addresses = []
        for order in user_orders:
            if 'address' in order:
                addr = order['address']
                addr['order_id'] = order.get('order_id', '')
                addresses.append(addr)

        return Response({'success': True, 'data': addresses})


# ─── Referral Views ──────────────────────────────────────────────────

class ReferralListCreateView(APIView):
    """List all referrals or create a new one."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        collection = get_referrals_collection()

        query = {}
        status_filter = request.query_params.get('status', '')
        if status_filter:
            query['status'] = status_filter

        search = request.query_params.get('search', '')
        if search:
            query['$or'] = [
                {'referred_user.name': {'$regex': search, '$options': 'i'}},
                {'referred_user.email': {'$regex': search, '$options': 'i'}},
                {'referrer_id': {'$regex': search, '$options': 'i'}},
            ]

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        skip = (page - 1) * page_size

        total = collection.count_documents(query)
        referrals = list(
            collection.find(query)
            .sort('created_at', -1)
            .skip(skip)
            .limit(page_size)
        )

        return Response({
            'success': True,
            'data': serialize_docs(referrals),
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
            }
        })

    def post(self, request):
        serializer = ReferralSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        collection = get_referrals_collection()
        data = serializer.validated_data
        data['created_at'] = datetime.now(timezone.utc)

        result = collection.insert_one(data)
        data['_id'] = str(result.inserted_id)

        return Response(
            {'success': True, 'data': serialize_doc(data)},
            status=status.HTTP_201_CREATED
        )


class ReferralDetailView(APIView):
    """Retrieve, update, or delete a referral."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get_object(self, pk):
        collection = get_referrals_collection()
        try:
            return collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            return None

    def get(self, request, pk):
        referral = self.get_object(pk)
        if not referral:
            return Response(
                {'success': False, 'error': 'Referral not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({'success': True, 'data': serialize_doc(referral)})

    def put(self, request, pk):
        referral = self.get_object(pk)
        if not referral:
            return Response(
                {'success': False, 'error': 'Referral not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReferralUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        update_data = {k: v for k, v in serializer.validated_data.items() if v is not None}

        collection = get_referrals_collection()
        collection.update_one(
            {'_id': ObjectId(pk)},
            {'$set': update_data}
        )

        updated = self.get_object(pk)
        return Response({'success': True, 'data': serialize_doc(updated)})

    def delete(self, request, pk):
        referral = self.get_object(pk)
        if not referral:
            return Response(
                {'success': False, 'error': 'Referral not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        collection = get_referrals_collection()
        collection.delete_one({'_id': ObjectId(pk)})
        return Response({'success': True, 'message': 'Referral deleted.'})


# ─── Order Views ─────────────────────────────────────────────────────

class OrderListCreateView(APIView):
    """List all orders or create a new one."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        collection = get_orders_collection()

        query = {}
        status_filter = request.query_params.get('status', '')
        if status_filter:
            query['status'] = status_filter

        payment_filter = request.query_params.get('payment_method', '')
        if payment_filter:
            query['payment_method'] = payment_filter

        search = request.query_params.get('search', '')
        if search:
            query['$or'] = [
                {'order_id': {'$regex': search, '$options': 'i'}},
                {'address.fullName': {'$regex': search, '$options': 'i'}},
                {'address.phone': {'$regex': search, '$options': 'i'}},
            ]

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        skip = (page - 1) * page_size

        total = collection.count_documents(query)
        orders = list(
            collection.find(query)
            .sort('created_at', -1)
            .skip(skip)
            .limit(page_size)
        )

        return Response({
            'success': True,
            'data': serialize_docs(orders),
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
            }
        })

    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        collection = get_orders_collection()
        data = serializer.validated_data
        data['created_at'] = datetime.now(timezone.utc)

        result = collection.insert_one(data)
        data['_id'] = str(result.inserted_id)

        return Response(
            {'success': True, 'data': serialize_doc(data)},
            status=status.HTTP_201_CREATED
        )


class OrderDetailView(APIView):
    """Retrieve, update, or delete an order."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get_object(self, pk):
        collection = get_orders_collection()
        try:
            return collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            return None

    def get(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response(
                {'success': False, 'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({'success': True, 'data': serialize_doc(order)})

    def put(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response(
                {'success': False, 'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        update_data = {k: v for k, v in serializer.validated_data.items() if v is not None}

        collection = get_orders_collection()
        collection.update_one(
            {'_id': ObjectId(pk)},
            {'$set': update_data}
        )

        updated = self.get_object(pk)
        return Response({'success': True, 'data': serialize_doc(updated)})

    def delete(self, request, pk):
        order = self.get_object(pk)
        if not order:
            return Response(
                {'success': False, 'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        collection = get_orders_collection()
        collection.delete_one({'_id': ObjectId(pk)})
        return Response({'success': True, 'message': 'Order deleted.'})


class OrderStatusView(APIView):
    """Update order status only."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def patch(self, request, pk):
        new_status = request.data.get('status')
        status_changed_at = request.data.get('status_changed_at')
        valid_statuses = ['pending', 'confirmed', 'packed_and_ready', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'success': False, 'error': f'Invalid status. Must be one of: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        update_data = {'status': new_status}
        if status_changed_at:
            update_data['status_changed_at'] = status_changed_at

        collection = get_orders_collection()
        try:
            result = collection.update_one(
                {'_id': ObjectId(pk)},
                {'$set': update_data}
            )
        except InvalidId:
            return Response(
                {'success': False, 'error': 'Invalid order ID.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if result.matched_count == 0:
            return Response(
                {'success': False, 'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        order = collection.find_one({'_id': ObjectId(pk)})
        return Response({'success': True, 'data': serialize_doc(order)})


# ─── Product Views ───────────────────────────────────────────────────

class ProductListCreateView(APIView):
    """List all products or create a new one."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        collection = get_products_collection()

        query = {}
        category = request.query_params.get('category', '')
        if category:
            query['category'] = {'$regex': category, '$options': 'i'}

        brand = request.query_params.get('brand', '')
        if brand:
            query['brand'] = {'$regex': brand, '$options': 'i'}

        in_stock = request.query_params.get('inStock', '')
        if in_stock.lower() == 'true':
            query['inStock'] = True
        elif in_stock.lower() == 'false':
            query['inStock'] = False

        search = request.query_params.get('search', '')
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'brand': {'$regex': search, '$options': 'i'}},
                {'category': {'$regex': search, '$options': 'i'}},
            ]

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        skip = (page - 1) * page_size

        total = collection.count_documents(query)
        products = list(
            collection.find(query)
            .sort('name', 1)
            .skip(skip)
            .limit(page_size)
        )

        print(f"Found {len(products)} products out of {total} total")  # Debug logging

        return Response({
            'success': True,
            'data': serialize_docs(products),
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
            }
        })

    def post(self, request):
        print("Product POST request data:", request.data)  # Debug logging
        print("Request data keys:", list(request.data.keys()))  # Debug logging
        serializer = ProductSerializer(data=request.data)
        if not serializer.is_valid():
            print("Product serializer errors:", serializer.errors)  # Debug logging
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        collection = get_products_collection()
        data = serializer.validated_data
        print("Validated data:", data)  # Debug logging
        data['created_at'] = datetime.now(timezone.utc)

        try:
            result = collection.insert_one(data)
            data['_id'] = str(result.inserted_id)
            print("Product created with ID:", data['_id'])  # Debug logging
            print("Inserted data:", data)  # Debug logging
        except Exception as e:
            print("MongoDB insert error:", str(e))  # Debug logging
            return Response(
                {'success': False, 'error': 'Database error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {'success': True, 'data': serialize_doc(data)},
            status=status.HTTP_201_CREATED
        )


class ProductDetailView(APIView):
    """Retrieve, update, or delete a product."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get_object(self, pk):
        collection = get_products_collection()
        try:
            return collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            # Try by custom 'id' field as well
            return collection.find_one({'id': pk})

    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response(
                {'success': False, 'error': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({'success': True, 'data': serialize_doc(product)})

    def put(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response(
                {'success': False, 'error': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        update_data = {k: v for k, v in serializer.validated_data.items() if v is not None}
        update_data['updated_at'] = datetime.now(timezone.utc)

        collection = get_products_collection()
        collection.update_one(
            {'_id': product['_id']},
            {'$set': update_data}
        )

        updated = collection.find_one({'_id': product['_id']})
        return Response({'success': True, 'data': serialize_doc(updated)})

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response(
                {'success': False, 'error': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        collection = get_products_collection()
        collection.delete_one({'_id': product['_id']})
        return Response({'success': True, 'message': 'Product deleted.'})


# ─── Inventory Dashboard Views ───────────────────────────────────────

class InventoryDashboardView(APIView):
    """Inventory dashboard with stats and product listings."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        supplement_col = get_supplement_inventory_collection()
        sports_col = get_sports_inventory_collection()
        bills_col = get_bills_collection()

        # Total products count
        total_supplements = supplement_col.count_documents({})
        total_sports = sports_col.count_documents({})
        total_products = total_supplements + total_sports

        # Total inventory value
        supplement_pipeline = [
            {'$match': {'pcs': {'$gt': 0}}},
            {'$group': {'_id': None, 'total': {'$sum': {'$multiply': ['$pcs', '$price']}}}}
        ]
        sports_pipeline = [
            {'$match': {'pcs': {'$gt': 0}}},
            {'$group': {'_id': None, 'total': {'$sum': {'$multiply': ['$pcs', '$price']}}}}
        ]

        supplement_value = list(supplement_col.aggregate(supplement_pipeline))
        sports_value = list(sports_col.aggregate(sports_pipeline))

        total_value = (supplement_value[0]['total'] if supplement_value else 0) + \
                     (sports_value[0]['total'] if sports_value else 0)

        # All supplement products sorted by expiry date (soonest first)
        # The frontend will handle highlighting those expiring within 5 months.
        all_supplements_by_expiry = list(supplement_col.find({
            'pcs': {'$gt': 0}
        }).sort('exp_date', 1))

        # Total bills count
        total_bills = bills_col.count_documents({})

        return Response({
            'success': True,
            'data': {
                'total_products': total_products,
                'total_value': float(total_value),
                'total_supplements': total_supplements,
                'total_sports': total_sports,
                'near_expiry_products': serialize_docs(all_supplements_by_expiry),
                'total_bills': total_bills,
            }
        })


class TotalProductsValueView(APIView):
    """View all available products in inventory."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        supplement_col = get_supplement_inventory_collection()
        sports_col = get_sports_inventory_collection()

        supplements = list(supplement_col.find().sort('created_at', -1))
        sports = list(sports_col.find().sort('created_at', -1))

        return Response({
            'success': True,
            'data': {
                'supplements': serialize_docs(supplements),
                'sports': serialize_docs(sports),
            }
        })


class NearExpiryProductsView(APIView):
    """View all products sorted by expiry date to highlight near expiry ones on frontend."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        supplement_col = get_supplement_inventory_collection()

        all_by_expiry = list(supplement_col.find({
            'pcs': {'$gt': 0}
        }).sort('exp_date', 1))

        return Response({
            'success': True,
            'data': serialize_docs(all_by_expiry),
        })


# ─── Supplement Inventory Views ──────────────────────────────────────

class SupplementInventoryListCreateView(APIView):
    """List all supplement inventory or create a new one."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        collection = get_supplement_inventory_collection()

        search = request.query_params.get('search', '')
        query = {}
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'batch_code': {'$regex': search, '$options': 'i'}},
                {'distributor': {'$regex': search, '$options': 'i'}},
            ]

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        skip = (page - 1) * page_size

        total = collection.count_documents(query)
        supplements = list(
            collection.find(query)
            .sort('created_at', -1)
            .skip(skip)
            .limit(page_size)
        )

        # Calculate total value
        pipeline = [
            {'$match': {'pcs': {'$gt': 0}}},
            {'$group': {'_id': None, 'total': {'$sum': {'$multiply': ['$pcs', '$price']}}}}
        ]
        value_result = list(collection.aggregate(pipeline))
        total_value = value_result[0]['total'] if value_result else 0

        return Response({
            'success': True,
            'data': serialize_docs(supplements),
            'total_value': float(total_value),
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
            }
        })

    def post(self, request):
        serializer = SupplementInventorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        collection = get_supplement_inventory_collection()
        data = serializer.validated_data
        data['created_at'] = datetime.now(timezone.utc)
        data['updated_at'] = datetime.now(timezone.utc)

        # Check for duplicate batch_code
        if collection.find_one({'batch_code': data['batch_code']}):
            return Response(
                {'success': False, 'error': 'Batch code already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = collection.insert_one(data)
        data['_id'] = str(result.inserted_id)

        return Response(
            {'success': True, 'data': serialize_doc(data)},
            status=status.HTTP_201_CREATED
        )


class SupplementInventoryDetailView(APIView):
    """Retrieve, update, or delete supplement inventory."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get_object(self, pk):
        collection = get_supplement_inventory_collection()
        try:
            return collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            return None

    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response(
                {'success': False, 'error': 'Supplement inventory not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({'success': True, 'data': serialize_doc(item)})

    def put(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response(
                {'success': False, 'error': 'Supplement inventory not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SupplementInventorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        update_data = serializer.validated_data
        update_data['updated_at'] = datetime.now(timezone.utc)

        collection = get_supplement_inventory_collection()
        collection.update_one(
            {'_id': ObjectId(pk)},
            {'$set': update_data}
        )

        updated = self.get_object(pk)
        return Response({'success': True, 'data': serialize_doc(updated)})

    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response(
                {'success': False, 'error': 'Supplement inventory not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        collection = get_supplement_inventory_collection()
        collection.delete_one({'_id': ObjectId(pk)})
        return Response({'success': True, 'message': 'Supplement inventory deleted.'})


# ─── Sports Inventory Views ──────────────────────────────────────────

class SportsInventoryListCreateView(APIView):
    """List all sports inventory or create a new one."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        collection = get_sports_inventory_collection()

        search = request.query_params.get('search', '')
        query = {}
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'size': {'$regex': search, '$options': 'i'}},
                {'distributor': {'$regex': search, '$options': 'i'}},
            ]

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        skip = (page - 1) * page_size

        total = collection.count_documents(query)
        sports = list(
            collection.find(query)
            .sort('created_at', -1)
            .skip(skip)
            .limit(page_size)
        )

        # Calculate total value
        pipeline = [
            {'$match': {'pcs': {'$gt': 0}}},
            {'$group': {'_id': None, 'total': {'$sum': {'$multiply': ['$pcs', '$price']}}}}
        ]
        value_result = list(collection.aggregate(pipeline))
        total_value = value_result[0]['total'] if value_result else 0

        return Response({
            'success': True,
            'data': serialize_docs(sports),
            'total_value': float(total_value),
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
            }
        })

    def post(self, request):
        serializer = SportsInventorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        collection = get_sports_inventory_collection()
        data = serializer.validated_data
        data['created_at'] = datetime.now(timezone.utc)
        data['updated_at'] = datetime.now(timezone.utc)

        result = collection.insert_one(data)
        data['_id'] = str(result.inserted_id)

        return Response(
            {'success': True, 'data': serialize_doc(data)},
            status=status.HTTP_201_CREATED
        )


class SportsInventoryDetailView(APIView):
    """Retrieve, update, or delete sports inventory."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get_object(self, pk):
        collection = get_sports_inventory_collection()
        try:
            return collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            return None

    def get(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response(
                {'success': False, 'error': 'Sports inventory not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response({'success': True, 'data': serialize_doc(item)})

    def put(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response(
                {'success': False, 'error': 'Sports inventory not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SportsInventorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'error': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        update_data = serializer.validated_data
        update_data['updated_at'] = datetime.now(timezone.utc)

        collection = get_sports_inventory_collection()
        collection.update_one(
            {'_id': ObjectId(pk)},
            {'$set': update_data}
        )

        updated = self.get_object(pk)
        return Response({'success': True, 'data': serialize_doc(updated)})

    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response(
                {'success': False, 'error': 'Sports inventory not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        collection = get_sports_inventory_collection()
        collection.delete_one({'_id': ObjectId(pk)})
        return Response({'success': True, 'message': 'Sports inventory deleted.'})


# ─── Billing Views ───────────────────────────────────────────────────

class BillListCreateView(APIView):
    """Billing section - view billing history and create bills."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get(self, request):
        bills_col = get_bills_collection()
        bill_items_col = get_bill_items_collection()

        bills = list(bills_col.find().sort('created_at', -1))

        # Get bill items for each bill
        for bill in bills:
            items = list(bill_items_col.find({'bill_id': bill['_id']}))
            bill['items'] = serialize_docs(items)

        return Response({
            'success': True,
            'data': serialize_docs(bills),
        })

    def post(self, request):
        """Create a bill from selected products."""
        items = request.data.get('items', [])
        customer_name = request.data.get('customer_name')
        customer_phone = request.data.get('customer_phone')
        customer_address = request.data.get('customer_address', '')

        if not items:
            return Response(
                {'success': False, 'error': 'No items selected for billing.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        supplement_col = get_supplement_inventory_collection()
        sports_col = get_sports_inventory_collection()
        bills_col = get_bills_collection()
        bill_items_col = get_bill_items_collection()

        if not customer_name or not customer_phone:
            return Response({'success': False, 'error': 'Customer name and phone are required.'}, status=status.HTTP_400_BAD_REQUEST)

        total_amount = 0
        bill_items = []

        # Validate and calculate total
        for item in items:
            product_type = item.get('product_type')
            product_id = item.get('product_id')
            quantity = item.get('quantity', 0)

            if product_type == 'supplement':
                product = supplement_col.find_one({'_id': ObjectId(product_id)})
                if not product:
                    return Response(
                        {'success': False, 'error': f'Supplement product {product_id} not found.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if product['pcs'] < quantity:
                    return Response(
                        {'success': False, 'error': f'Insufficient stock for {product["name"]}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                unit_price = product['price']
                total_price = unit_price * quantity
                total_amount += total_price

                bill_items.append({
                    'bill_id': None,  # Will be set after bill creation
                    'product_type': 'supplement',
                    'product_id': product_id,
                    'name': product['name'], # Changed to 'name' for frontend compatibility
                    'quantity': quantity,
                    'price': float(unit_price), # Changed to 'price' for frontend compatibility
                    'total': float(total_price), # Changed to 'total' for frontend compatibility
                    'pcs_before_sale': product['pcs'], # For inventory reduction later
                    'created_at': datetime.now(timezone.utc),
                })

            elif product_type == 'sports':
                product = sports_col.find_one({'_id': ObjectId(product_id)})
                if not product:
                    return Response(
                        {'success': False, 'error': f'Sports product {product_id} not found.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if product['pcs'] < quantity:
                    return Response(
                        {'success': False, 'error': f'Insufficient stock for {product["name"]}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                unit_price = product['price']
                total_price = unit_price * quantity
                total_amount += total_price

                bill_items.append({
                    'bill_id': None,  # Will be set after bill creation
                    'product_type': 'sports',
                    'product_id': product_id,
                    'name': product['name'], # Changed to 'name' for frontend compatibility
                    'quantity': quantity,
                    'price': float(unit_price), # Changed to 'price' for frontend compatibility
                    'total': float(total_price), # Changed to 'total' for frontend compatibility
                    'pcs_before_sale': product['pcs'], # For inventory reduction later
                    'created_at': datetime.now(timezone.utc),
                })

        # Generate bill number
        bill_count = bills_col.count_documents({})
        bill_number = f"BILL-{bill_count + 1:04d}"

        # Create bill
        bill_data = {
            'bill_number': bill_number, # This is not directly used by the frontend Bill interface
            'customer_name': customer_name, # Added customer info
            'customer_phone': customer_phone, # Added customer info
            'customer_address': customer_address, # Added customer info
            'total_amount': float(total_amount),
            'status': 'completed', # Changed status to completed since inventory is reduced immediately
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        }

        bill_result = bills_col.insert_one(bill_data)
        bill_id = bill_result.inserted_id

        # Create bill items
        for item in bill_items:
            item['bill_id'] = bill_id
            bill_items_col.insert_one(item)
            
            # Immediately reduce inventory
            if item['product_type'] == 'supplement':
                supplement_col.update_one(
                    {'_id': ObjectId(item['product_id'])},
                    {'$inc': {'pcs': -item['quantity']}}
                )
            elif item['product_type'] == 'sports':
                sports_col.update_one(
                    {'_id': ObjectId(item['product_id'])},
                    {'$inc': {'pcs': -item['quantity']}}
                )

        # Update bill with items count and current inventory pcs after sale
        bills_col.update_one(
            {'_id': bill_id},
            {'$set': {
                'items_count': len(bill_items),
                'updated_at': datetime.now(timezone.utc)
                }
            }
        )

        bill_data['_id'] = str(bill_id)
        bill_data['items'] = serialize_docs(bill_items)

        return Response(
            {'success': True, 'data': serialize_doc(bill_data)},
            status=status.HTTP_201_CREATED
        )


class BillDetailView(APIView):
    """View, update, or delete a specific bill."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [AdminJWTAuthentication]

    def get_object(self, pk):
        # This method is used by both GET and PUT/DELETE.
        # For GET, we need to load bill_items as well.
        bill = None
        collection = get_bills_collection()
        try:
            bill = collection.find_one({'_id': ObjectId(pk)})
        except InvalidId:
            return None
        
        if bill:
            # Attach bill items for display
            bill_items_col = get_bill_items_collection()
            items_raw = list(bill_items_col.find({'bill_id': bill['_id']}))
            # Map item keys to frontend expectations if necessary
            bill['items'] = [
                {k if k not in ['product_name', 'unit_price', 'total_price'] else {'product_name': 'name', 'unit_price': 'price', 'total_price': 'total'}[k]: (str(v) if isinstance(v, ObjectId) else v) for k, v in item.items()} for item in items_raw
            ]
        return bill

    def get(self, request, pk):
        bill = self.get_object(pk)
        if not bill:
            return Response(
                {'success': False, 'error': 'Bill not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get bill items
        bill_items_col = get_bill_items_collection()
        items = list(bill_items_col.find({'bill_id': bill['_id']}))
        bill['items'] = serialize_docs(items)

        return Response({'success': True, 'data': serialize_doc(bill)})

    def put(self, request, pk):
        """Mark bill as completed (reduces inventory) or update status."""
        bill = self.get_object(pk)
        if not bill:
            return Response(
                {'success': False, 'error': 'Bill not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get('action')
        if action == 'complete':
            if bill['status'] == 'completed':
                return Response(
                    {'success': False, 'error': 'Bill already completed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Reduce inventory
            bill_items_col = get_bill_items_collection()
            supplement_col = get_supplement_inventory_collection()
            sports_col = get_sports_inventory_collection()

            items = list(bill_items_col.find({'bill_id': bill['_id']}))
            for item in items:
                if item['product_type'] == 'supplement':
                    supplement_col.update_one(
                        {'_id': ObjectId(item['product_id'])},
                        {'$inc': {'pcs': -item['quantity']}}
                    )
                elif item['product_type'] == 'sports':
                    sports_col.update_one(
                        {'_id': ObjectId(item['product_id'])},
                        {'$inc': {'pcs': -item['quantity']}}
                    )

            # Update bill status
            bills_col = get_bills_collection()
            bills_col.update_one(
                {'_id': ObjectId(pk)},
                {'$set': {'status': 'completed', 'updated_at': datetime.now(timezone.utc)}}
            )

            updated_bill = self.get_object(pk)
            return Response({'success': True, 'data': serialize_doc(updated_bill)})

        return Response(
            {'success': False, 'error': 'Invalid action.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        bill = self.get_object(pk)
        if not bill:
            return Response(
                {'success': False, 'error': 'Bill not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if bill['status'] == 'completed':
            return Response(
                {'success': False, 'error': 'Cannot delete completed bill.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        bills_col = get_bills_collection()
        bill_items_col = get_bill_items_collection()

        # Delete bill items first
        bill_items_col.delete_many({'bill_id': bill['_id']})
        # Delete bill
        bills_col.delete_one({'_id': ObjectId(pk)})

        return Response({'success': True, 'message': 'Bill deleted.'})

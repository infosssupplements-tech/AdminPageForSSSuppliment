"""Accounts app URL configuration."""
from django.urls import path

from . import viewsAdmin

urlpatterns = [
    #path("wake-up/", viewsAdmin.wake_up, name="wake_up"),  

    # Auth
    path('auth/login/', viewsAdmin.LoginView.as_view(), name='login'),
    path('auth/me/', viewsAdmin.MeView.as_view(), name='me'),
    path('auth/logout/', viewsAdmin.LogoutView.as_view(), name='logout'),

    # Dashboard
    path('dashboard/', viewsAdmin.DashboardView.as_view(), name='dashboard'),

    # Users
    path('users/', viewsAdmin.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<str:pk>/', viewsAdmin.UserDetailView.as_view(), name='user-detail'),
    path('users/<str:pk>/addresses/', viewsAdmin.UserAddressView.as_view(), name='user-addresses'),

    # Referrals
    path('referrals/', viewsAdmin.ReferralListCreateView.as_view(), name='referral-list-create'),
    path('referrals/<str:pk>/', viewsAdmin.ReferralDetailView.as_view(), name='referral-detail'),

    # Orders
    path('orders/', viewsAdmin.OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/<str:pk>/', viewsAdmin.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<str:pk>/status/', viewsAdmin.OrderStatusView.as_view(), name='order-status'),

    # Products
    path('products/', viewsAdmin.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<str:pk>/', viewsAdmin.ProductDetailView.as_view(), name='product-detail'),

    # Inventory Dashboard
    path('inventory/dashboard/', viewsAdmin.InventoryDashboardView.as_view(), name='inventory-dashboard'),
    path('inventory/total-products/', viewsAdmin.TotalProductsValueView.as_view(), name='total-products-value'),
    path('inventory/near-expiry/', viewsAdmin.NearExpiryProductsView.as_view(), name='near-expiry-products'),

    # Supplement Inventory
    path('inventory/supplements/', viewsAdmin.SupplementInventoryListCreateView.as_view(), name='supplement-inventory-list-create'),
    path('inventory/supplements/<str:pk>/', viewsAdmin.SupplementInventoryDetailView.as_view(), name='supplement-inventory-detail'),

    # Sports Inventory
    path('inventory/sports/', viewsAdmin.SportsInventoryListCreateView.as_view(), name='sports-inventory-list-create'),
    path('inventory/sports/<str:pk>/', viewsAdmin.SportsInventoryDetailView.as_view(), name='sports-inventory-detail'),

    # Billing
    path('inventory/bills/', viewsAdmin.BillListCreateView.as_view(), name='bill-list-create'),
    path('inventory/bills/<str:pk>/', viewsAdmin.BillDetailView.as_view(), name='bill-detail'),
]

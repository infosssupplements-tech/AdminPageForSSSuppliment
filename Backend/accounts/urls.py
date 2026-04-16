"""Accounts app URL configuration."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("wake-up/", views.wake_up, name="wake_up"),
    path("products-public/", views.products_public, name="products_public"),
    path("signup/", views.SignupView.as_view(), name="signup"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("referrals/", views.MyReferralsView.as_view(), name="my_referrals"),
    path("leaderboard/", views.LeaderboardView.as_view(), name="leaderboard"),
    path('profileForOrderPlaced/', views.profile_view, name='profile'),
    path('orders/quote/', views.order_quote, name='order_quote'),
    path('orders/', views.create_order, name='create_order'),
    path('orders/razorpay/create/', views.razorpay_create_order, name='razorpay_create_order'),
    path('orders/razorpay/verify/', views.razorpay_verify_payment, name='razorpay_verify_payment'),

    path('auth/forgot-password/', views.forgot_password, name='forgot_password'),
    path('auth/verify-otp/', views.verify_otp, name='verify_otp'),
    path('auth/reset-password/', views.reset_password, name='reset_password'),

    path('profileForAccount/', views.ProfileForAccountView.as_view(), name='profile-account'),           
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change-password'),            
]

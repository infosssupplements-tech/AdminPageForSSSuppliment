"""
Django Models: NOT USED

This project primarily uses MongoDB for all data storage.
However, Django's authentication system requires a User model to be defined
when AUTH_USER_MODEL is specified in settings.
This User model serves as a "dummy" model to satisfy Django's internal checks
and integrate with DRF, but actual user data persistence and management
are handled by MongoDB collections.

See mongo/collections.py for actual MongoDB collection definitions.
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, phone, email=None, password=None, **extra_fields):
        if not phone:
            raise ValueError('The Phone field must be set')
        email = self.normalize_email(email)
        user = self.model(phone=phone, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(phone, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # These fields are defined to satisfy Django's AUTH_USER_MODEL requirement
    # and for compatibility with DRF serializers that expect a Django User model.
    # Actual user data is stored and managed in MongoDB.
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    name = models.CharField(max_length=150, blank=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    points = models.IntegerField(default=0)
    referral_code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    referred_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals_given')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False) # Required by PermissionsMixin
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['email', 'name']

    def __str__(self):
        return self.phone

    class Meta:
        # This model is not managed by Django's ORM.
        # It exists purely to satisfy AUTH_USER_MODEL.
        managed = False
        db_table = 'dummy_auth_users' # A dummy table name if Django tries to create it.

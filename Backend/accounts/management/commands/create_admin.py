from django.core.management.base import BaseCommand
from accounts.db import get_admins_collection
from utils.password import hash_password
import bcrypt
from datetime import datetime

class Command(BaseCommand):
    help = 'Create default admin user'

    def handle(self, *args, **options):
        admins_col = get_admins_collection()

        # Check if admin already exists
        existing_admin = admins_col.find_one({'email': 'khutiasudip@gmail.com'})
        if existing_admin:
            self.stdout.write(
                self.style.WARNING('Admin user already exists')
            )
            return

        # Create admin user
        admin_data = {
            'email': 'khutiasudip@gmail.com',
            'password': bcrypt.hashpw('9547899170'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            'name': 'Admin',
            'created_at': datetime.utcnow(),
            'is_active': True
        }

        result = admins_col.insert_one(admin_data)
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created admin user with ID: {result.inserted_id}')
        )
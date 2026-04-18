from pymongo import MongoClient
from django.conf import settings

_client = None
_db = None


def get_client():
    global _client
    if _client is None:
        _client = MongoClient(
            settings.MONGO_URI,
            connect=False,
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_db():
    global _db
    if _db is None:
        _db = get_client()[settings.MONGO_DB_NAME]
    return _db

client = get_client()
db = get_db()

users_col = db["users"]
referrals_col = db["referrals"]
otps_col = db["otps"]
orders_col = db["orders"]
user_addresses_col = db['user_address']
products_col = db["products"]

# Inventory collections
supplement_inventory_col = db["supplement_inventory"]
sports_inventory_col = db["sports_inventory"]
bills_col = db["bills"]
bill_items_col = db["bill_items"]
"""Mongo collection helpers used by admin views."""

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


def get_users_collection():
    return get_db()["users"]


def get_referrals_collection():
    return get_db()["referrals"]


def get_orders_collection():
    return get_db()["orders"]


def get_products_collection():
    return get_db()["products"]


def get_admins_collection():
    return get_db()["admins"]


def get_supplement_inventory_collection():
    return get_db()["supplement_inventory"]


def get_sports_inventory_collection():
    return get_db()["sports_inventory"]


def get_bills_collection():
    return get_db()["bills"]


def get_bill_items_collection():
    return get_db()["bill_items"]

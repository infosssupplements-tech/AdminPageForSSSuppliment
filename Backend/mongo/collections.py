from pymongo import MongoClient
from django.conf import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.MONGO_DB_NAME]

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
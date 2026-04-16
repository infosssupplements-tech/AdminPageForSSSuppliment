# accounts/profile_service.py
from mongo.collections import users_col, user_addresses_col
from bson import ObjectId
from datetime import datetime
from typing import Dict, Any
import traceback

def get_user_profile(user_id: str) -> Dict[str, Any]:
    """Fetch complete user profile with address data"""
    try:
        # Get user basic info
        user_data = users_col.find_one({"_id": ObjectId(str(user_id))})
        if not user_data:
            return None
        
        # Get address info
        address_data = user_addresses_col.find_one({"user_id": str(user_id)})
        
        # Clean address data
        if address_data:
            address_dict = dict(address_data)
            if '_id' in address_dict:
                address_dict['id'] = str(address_dict['_id'])
                del address_dict['_id']
        else:
            address_dict = {}
        
        return {
            "id": str(user_id),
            "email": user_data.get('email', '') or '',
            "name": user_data.get('name', '') or '',
            "phone": user_data.get('phone', '') or '',
            "address": address_data.get('full_address', '') if address_data else '',
            "points": user_data.get('points', 0),
            "address_fields": address_dict
        }
    except Exception as e:
        print(f"❌ Profile service ERROR: {str(e)}")
        print(traceback.format_exc())
        return None

def update_user_address(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Update user address with all fields"""
    try:
        address_fields = data.get('address_fields', {})
        full_address = data.get('address', '')
        
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
        
        result = user_addresses_col.update_one(
            {"user_id": str(user_id)},
            {"$set": address_doc},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "address": full_address,
            "address_fields": address_fields
        }
    except Exception as e:
        print(f"❌ Address update ERROR: {str(e)}")
        print(traceback.format_exc())
        return {
            "success": False,
            "error": "Update failed"
        }

from mongo.collections import users_col, referrals_col
from bson import ObjectId
from utils.jwt_helper import decode_token
import traceback

def get_my_referrals(auth_header: str):
    """Get user's referrals - SAFE & COMPLETE"""
    try:
        if not auth_header or not auth_header.startswith("Bearer "):
            return []
        
        token = auth_header.replace("Bearer ", "")
        payload = decode_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            return []
 
        referrals_cursor = referrals_col.find({"referrer_id": user_id})
        referrals = list(referrals_cursor)
        
      
        referral_list = []
        for r in referrals:
            referred_user_id = r.get("referred_user")
            
            referee_data = {}
            if referred_user_id and isinstance(referred_user_id, dict):
                referee_data = {
                    "name": referred_user_id.get("name", "Unknown") or "Unknown",
                    "phone": referred_user_id.get("phone", "") or ""
                }
            elif referred_user_id and isinstance(referred_user_id, ObjectId):
            
                user_doc = users_col.find_one({"_id": referred_user_id})
                if user_doc:
                    referee_data = {
                        "name": user_doc.get("name", "Unknown") or "Unknown",
                        "phone": user_doc.get("phone", "") or ""
                    }
            
            referral_list.append({
                "id": str(r.get("_id", "")),
                "referee_name": referee_data.get("name", "Unknown"),
                "referee_phone": referee_data.get("phone", ""),
                "referrer_points": r.get("referrer_points", 0),
                "referee_points": r.get("referee_points", 0),
                "referrer_points_awarded": r.get("referrer_points", 0),
                "referee_points_awarded": r.get("referee_points", 0),
                "created_at": r.get("created_at", "")
            })
        
        return referral_list
        
    except Exception as e:
        print(f"referralsLogic ERROR: {str(e)}")
        print(traceback.format_exc())
        return []

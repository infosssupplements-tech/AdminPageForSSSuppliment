from rest_framework.response import Response
from mongo.collections import users_col, referrals_col
from utils.password import hash_password, verify_password
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from utils.jwt import generate_tokens_for_user


def _generate_referral_code():
    return f"SS{ObjectId().__str__()[-8:].upper()}"

def signup_logic(data, phone, password, name, email, referral_code):
    """
    FIXED: Always returns tuple (user_id, user, tokens)
    No Response objects inside this function!
    """
    try:
        print('Signup started...', data)
        
        
        if not phone or not password or not name:
            raise ValueError("Phone, password, and name are required")

        
        existing_user = users_col.find_one({"phone": phone})
        if existing_user:
            raise ValueError("Phone number already registered")

         
        user_doc = {
            "phone": phone,
            "email": email or None,  
            "name": name,
            "password": hash_password(password),
            "points": 0,
            "referral_code": None,  
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        

        result = users_col.insert_one(user_doc)
        user_id = str(result.inserted_id)
        print(f"User created: {user_id}")

        # Ensure every user has a permanent referral code
        referral_code_generated = _generate_referral_code()
        users_col.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"referral_code": referral_code_generated}, "$currentDate": {"updated_at": True}},
        )

        if referral_code:
            try:
                referrer = users_col.find_one({"referral_code": referral_code})
                if not referrer:
                    referrer = users_col.find_one({"_id": ObjectId(referral_code)})
                
                if referrer and str(referrer["_id"]) != user_id:
                    print(f"Referral found: {referrer.get('name', 'Unknown')} -> {name}")
                    

                    users_col.update_one(
                        {"_id": referrer["_id"]}, 
                        {"$inc": {"points": 100}, "$currentDate": {"updated_at": True}}
                    )
                    

                    users_col.update_one(
                        {"_id": ObjectId(user_id)}, 
                        {"$inc": {"points": 50}, "$currentDate": {"updated_at": True}}
                    )


                    referrals_col.insert_one({
                        "referrer_id": str(referrer["_id"]),
                        "referred_user": {
                            "id": user_id,
                            "name": name,
                            "phone": phone,
                            "email": email,
                        },
                        "referrer_points": 100,
                        "referee_points": 50,
                        "status": "completed",
                        "created_at": datetime.utcnow(),
                    })
                    print("Referral points awarded!")

            except InvalidId:
                print("Invalid referral code format")



        tokens = generate_tokens_for_user(user_id)
        

        user = users_col.find_one({"_id": ObjectId(user_id)})
        
        print(f"Signup complete: {name}, Points: {user.get('points', 0)}")
        

        return user_id, user, tokens
        
    except ValueError as ve:
        print(f"Signup validation error: {str(ve)}")
        raise ve
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise ValueError("Signup failed. Please try again.")

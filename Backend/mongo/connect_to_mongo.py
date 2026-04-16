from pymongo import MongoClient
import certifi
import os
from dotenv import load_dotenv
load_dotenv()




MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://sssuppliment2025_db_user:hvwSArrVRQFhEsAD@supplimentcluster.q0id4n0.mongodb.net/sssuppliment_db?retryWrites=true&w=majority"
)

try:
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )

    # 🔍 Test connection
    client.admin.command("ping")
    print("MongoDB connected successfully")

    db = client["sssuppliment_db"]

except Exception as e:
    print("MongoDB connection failed:", e)

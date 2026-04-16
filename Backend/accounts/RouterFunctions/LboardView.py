from rest_framework.response import Response
from rest_framework import status
import traceback

def board(users_cursor) :
    try :
        users = list(users_cursor) 
            
        print(f'Found {len(users)} users for leaderboard')
        leaderboard = []
        for u in users:
            leaderboard.append({
                "id": str(u["_id"]),
                "name": u.get("name", "Anonymous") or "Anonymous",
                "points": u.get("points", 0),
            })
            
        print(f'Returning top {len(leaderboard)} users')
        return Response(leaderboard, status=status.HTTP_200_OK)
            
    except Exception as e:
        print(f"Leaderboard ERROR: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": "Failed to load leaderboard"}, 
        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
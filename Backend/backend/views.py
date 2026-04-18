from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "Backend API is running", "status": "ok"})
from accounts.models import CallSession, User
from accounts.serializers import CallSessionSerializer, UserSerializer
from django.contrib.auth import authenticate, login, logout
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token


class UserRegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs): 
        return Response({"message": "Please use POST method to register"}, status=status.HTTP_200_OK)
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data.get('email')
            if User.objects.filter(email=email).exists():
                return Response({"error": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"message": "Please use POST method to login"}, status=status.HTTP_200_OK)

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        try:
            user = User.objects.get(email=email)
            username = user.username
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)

            login(request, user)    
            user.is_online = True
            user.save()
            return Response({"message": "Login successful",
                            "token": token.key,
                            "username": user.username,
                            "email": user.email,
                             }, status=status.HTTP_200_OK)
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    
class UserLogoutView(APIView):
    def post(self, request):
        
        request.user.is_online = False
        request.user.save()
        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user
    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CallSessionView(generics.ListCreateAPIView):
    serializer_class = CallSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CallSession.objects.filter(caller=self.request.user) | CallSession.objects.filter(receiver=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(caller=self.request.user)


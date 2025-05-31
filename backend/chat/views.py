# chat/api/views.py
from rest_framework import generics, permissions
from .models import Message, ChatRoom
from .serializers import MessageSerializer, ChatRoomSerializer, UserSerializer
from rest_framework.authentication import TokenAuthentication
from accounts.models import User
from rest_framework.response import Response
from rest_framework import status






class MessageList(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room = self.kwargs['room']
        return Message.objects.filter(room__name=room)

    def perform_create(self, serializer):
        room = self.kwargs['room']
        room = ChatRoom.objects.get(name=room)
        serializer.save(sender=self.request.user, room=room)






class MyRoomsList(generics.ListAPIView):
    # serializer_class = UserSerializer
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return ChatRoom.objects.filter(participants=user)
        return ChatRoom.objects.none()
    





class CreateNewRoom(generics.CreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    # def perform_create(self, serializer):
    #     serializer.save(participants=[self.request.user])

    def post(self, request, *args, **kwargs):
        user1 = request.user  # Authenticated user from token
        username2 = request.data.get('username2')
        if not username2:
            return Response({'detail': 'username2 is required in request json.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user2 = User.objects.get(username=username2)
        except User.DoesNotExist:
            return Response({'detail': f'User with username:{username2} does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if a chatroom exists with exactly these two users
        chat_rooms = ChatRoom.objects.filter(participants=user1).filter(participants=user2)
        for room in chat_rooms:
            if room.participants.count() == 2:
                serializer = self.get_serializer(room)
                return Response(serializer.data, status=status.HTTP_200_OK)

        # Create a unique room name, e.g., sorted usernames joined by '_'
        room_name = '_'.join(sorted([user1.username, user2.username]))
        chat_room = ChatRoom.objects.create(name=room_name)
        chat_room.participants.add(user1, user2)
        serializer = self.get_serializer(chat_room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

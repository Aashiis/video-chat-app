from django.urls import path
from chat.views import MessageList, MyRoomsList, CreateNewRoom

urlpatterns = [
    path('rooms/<str:room>/messages/', MessageList.as_view(), name='message-list'),
    # Add other chat-related URLs here, such as room creation, etc.
    path('myrooms/', MyRoomsList.as_view(), name='my-rooms'),
    path('myrooms/create', CreateNewRoom.as_view(), name='create-room'),
]

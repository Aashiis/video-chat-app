# chat/consumers.py
import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from .models import ChatRoom, Message  # Import here to avoid circular imports

User = get_user_model() # Use this to get your active User model
USER_CHANNEL_MAPPING = {}

# This is a placeholder for your actual token validation logic.
# It should be an async function if it involves I/O (like database calls).
@database_sync_to_async
def get_user_from_token(token_value):
    """Validates the token and returns a user object or AnonymousUser."""
    if not token_value:
        return AnonymousUser()
    try:
        user = User.objects.get(auth_token=token_value)  # Adjust this line to your token model

        if user:
            return user
        else:
            return AnonymousUser()

    except User.DoesNotExist:
        return AnonymousUser()
    except Exception as e:
        # Log the exception e
        print(f"Error during token validation: {e}")
        return AnonymousUser()
    
@database_sync_to_async
def save_message_to_db(room_name, user, message):
    """Saves the message to the database."""
    try:
        room = ChatRoom.objects.get(name=room_name)
        print(f"Saving message to room: {room.name} from user: {user.username}")
        Message.objects.create(room=room, sender=user, content=message)
    except ChatRoom.DoesNotExist:
        print(f"Chat room '{room_name}' does not exist.")
    except Exception as e:
        print(f"Error saving message: {e}")


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string_bytes = self.scope.get('query_string', b'') # 1. Get the raw query string from the scope
        query_string_str = query_string_bytes.decode('utf-8') # 2. Decode it from bytes to string (UTF-8 is a common encoding)
        query_params = parse_qs(query_string_str) # 3. Parse the query string into a dictionary
        token_list = query_params.get('token', []) # 4. Extract the token value
        token = token_list[0] if token_list else None
        user = await get_user_from_token(token)

        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        
        # Authenticate user
        if isinstance(user, AnonymousUser):
            await self.close()
        else:
            self.user = user

            # Storing user's channel name for direct messaging
            # Important: We need Unique channel name so we are using username
            USER_CHANNEL_MAPPING[self.user.username] = self.channel_name
            print(f"User {self.user.username} (ID: {self.user.id}) connected with channel {self.channel_name}")
            print(f"Current USER_CHANNEL_MAPPING: {USER_CHANNEL_MAPPING}")


            # Join room group
            await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
            )
            await self.accept()  # Accept the WebSocket connection
             





    async def disconnect(self, close_code):

        if hasattr(self, 'user') and self.user.is_authenticated:
            #Remove user's channel name from USER_CHANNEL_MAPPING
            if self.user.username in USER_CHANNEL_MAPPING and USER_CHANNEL_MAPPING[self.user.username] == self.channel_name:
                del USER_CHANNEL_MAPPING[self.user.username]
                print(f"User {self.user.username} (ID: {self.user.id}) disconnected and removed from USER_CHANNEL_MAPPING")
                print(f"Current USER_CHANNEL_MAPPING: {USER_CHANNEL_MAPPING}")

            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )





    async def receive(self, text_data):
        
        text_data_json = json.loads(text_data)#1. Parse the incoming message
        
        message = text_data_json['message']#2. Extract the message and sender information
        
        sender_username = self.user.username#3. Determine the receiver username based on the room name

        names_in_roomname = self.room_name.split('_')#4. this is because room name is user1name_user2name

        if names_in_roomname[0] == sender_username:
            receiver_username = names_in_roomname[1]
        else:
            receiver_username = names_in_roomname[0]


        print(f"Received message: {message} from user: {self.user.username} to {receiver_username}")

        message_type = text_data_json.get('type')# Check the type of message

        # Saving message if chat_message type
        if message_type == 'chat_message':
            await save_message_to_db(self.room_name, self.user, message)
            # Broadcast the message to both users in the room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender': self.user.username
                }
            )
        elif message_type in ['direct_message', 'webrtc_offer', 'webrtc_answer', 'webrtc_ice_candidate', 
                                  'call_request', 'call_accepted', 'call_rejected', 'hang_up']:

            # Send message only to the receiver (not to the sender)
            if receiver_username and receiver_username in USER_CHANNEL_MAPPING:
                receiver_channel = USER_CHANNEL_MAPPING[receiver_username]

                # Preparing payload to send over the channel layer
                # Passing Original text_data_json, but ensuring 'type' and 'sender' are correctly set for the receiver haldler
                channel_layer_payload = {
                    **text_data_json,  # Include all original data
                    'type': message_type,  # Ensure the type is set correctly
                    'sender': sender_username  # Set the sender username
                    # 'message' field is already included in text_data_json
                }

                #sending the payload to the receiver's channel
                print(f"Sending {message_type} to {receiver_username} on channel {receiver_channel}")
                await self.channel_layer.send(
                    receiver_channel,
                    channel_layer_payload
                )
            else:
                print(f"Receiver {receiver_username} not connected.")

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender': event['sender']
        }))

    async def _forward_event_to_websocket(self, event):
        # Send message to WebSocket (only to the receiver)
        # The 'event' dict comes directly from what was sent via channel_layer.send()
        # It already contains the correct 'type', 'message', 'sender', and any other fields
        # from the original text_data_json that were passed through.
        print(f"Forwarding event type '{event['type']}' from '{event['sender']}' to WebSocket.")
        await self.send(text_data=json.dumps(event))

    direct_message = _forward_event_to_websocket
    webrtc_offer = _forward_event_to_websocket
    webrtc_answer = _forward_event_to_websocket
    webrtc_ice_candidate = _forward_event_to_websocket
    call_request = _forward_event_to_websocket
    call_accepted = _forward_event_to_websocket
    call_rejected = _forward_event_to_websocket
    hang_up = _forward_event_to_websocket
        
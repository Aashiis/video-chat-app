from django.contrib import admin

from chat.models import ChatRoom, Message

# Register your models here.

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'id', 'created_at')
    search_fields = ('name',)
    filter_horizontal = ('participants',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('room', 'sender', 'content', 'timestamp')
    search_fields = ('content',)
    list_filter = ('room', 'sender', 'timestamp')
    ordering = ('-timestamp',)
    
    def room(self, obj):
        return obj.room.name if obj.room else None
    room.short_description = 'Chat Room'
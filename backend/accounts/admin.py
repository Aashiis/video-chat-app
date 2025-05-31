from django.contrib import admin

from accounts.models import CallSession, User

# Register your models here.

@admin.register(User)  # Decorator syntax alternative
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_online', 'last_seen')
    list_filter = ('is_online',)
    search_fields = ('username', 'email')


admin.site.register(CallSession)
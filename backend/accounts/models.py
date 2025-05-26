from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    #Extending the default user model to include additional fields
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    def __str__(self):
        return self.username


class CallSession(models.Model):
    caller = models.ForeignKey(User, related_name='caller_sessions', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='receiver_sessions', on_delete=models.CASCADE)

    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('ongoing', 'Ongoing'), ('ended', 'Ended')], default='ongoing')
    
    def __str__(self):
        return f"Call from {self.caller.username} to {self.receiver.username} at {self.start_time}"
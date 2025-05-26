from rest_framework import serializers
from accounts.models import CallSession, User
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password2', 'is_online', 'last_seen', 'avatar']
        extra_kwargs = {
            'password': {'write_only': True},
            'password2': {'write_only': True},
            }
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Here no need of password2 so remove it from validated_data
        validated_data.pop('password2')
        
        # Create user instance
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user
    
class CallSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallSession
        fields = '__all__'
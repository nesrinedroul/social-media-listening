from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role',
                  'status', 'manual_status', 'open_conversations',
                  'is_active', 'created_at')
        read_only_fields = ('id', 'created_at', 'open_conversations')


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Admin can update everything including email and role.
    """
    class Meta:
        model  = User
        fields = ('email', 'first_name', 'last_name', 'role',
                  'status', 'is_active')

    def validate_email(self, value):
        # Make sure email is unique but allow same user to keep their email
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError('This email is already in use')
        return value

    def validate_role(self, value):
        if value not in ['admin', 'supervisor', 'agent']:
            raise serializers.ValidationError('Invalid role')
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class AgentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ('status',)
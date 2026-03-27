from rest_framework import serializers
from .models import WaitlistEntry


class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WaitlistEntry
        fields = ('id', 'email', 'full_name', 'company', 'status', 'registered_at')
        read_only_fields = ('id', 'status', 'registered_at')


class WaitlistAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WaitlistEntry
        fields = '__all__'
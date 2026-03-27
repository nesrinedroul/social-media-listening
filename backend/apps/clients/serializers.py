from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Client
        fields = ('id', 'sender_id', 'source', 'first_name', 'last_name',
                  'phone', 'email', 'created_at', 'updated_at')
        read_only_fields = ('id', 'sender_id', 'source', 'created_at', 'updated_at')
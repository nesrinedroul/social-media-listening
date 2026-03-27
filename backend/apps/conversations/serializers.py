from rest_framework import serializers
from .models import Conversation, Assignment, Channel
from apps.clients.serializers import ClientSerializer
from apps.accounts.serializers import UserSerializer


class ChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Channel
        fields = ('id', 'platform', 'page_id', 'name', 'is_active')


class AssignmentSerializer(serializers.ModelSerializer):
    agent = UserSerializer(read_only=True)

    class Meta:
        model  = Assignment
        fields = ('id', 'agent', 'assigned_by', 'assigned_at')


class ConversationSerializer(serializers.ModelSerializer):
    client      = ClientSerializer(read_only=True)
    agent       = UserSerializer(read_only=True)
    channel     = ChannelSerializer(read_only=True)
    assignments = AssignmentSerializer(many=True, read_only=True)

    class Meta:
        model  = Conversation
        fields = ('id', 'client', 'agent', 'channel', 'status',
                  'mongo_conv_id', 'created_at', 'updated_at', 'assignments')
        read_only_fields = ('id', 'mongo_conv_id', 'created_at', 'updated_at')


class ReassignSerializer(serializers.Serializer):
    agent_id = serializers.UUIDField()
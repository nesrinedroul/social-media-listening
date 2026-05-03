from rest_framework import serializers
from .models import AgentGroup, User
from .serializers import UserSerializer


class AgentGroupSerializer(serializers.ModelSerializer):
    agents      = UserSerializer(many=True, read_only=True)
    agent_ids   = serializers.PrimaryKeyRelatedField(
                      many=True,
                      queryset=User.objects.filter(role='agent'),
                      source='agents',
                      write_only=True,
                  )
    agent_count = serializers.SerializerMethodField()

    class Meta:
        model  = AgentGroup
        fields = ('id', 'name', 'platform', 'is_active',
                  'agents', 'agent_ids', 'agent_count', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_agent_count(self, obj):
        return obj.agents.count()
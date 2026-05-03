from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import AgentGroup, User
from .group_serializers import AgentGroupSerializer
from .permissions import IsAdminOrSupervisor, IsAdmin


class AgentGroupListCreateView(generics.ListCreateAPIView):
    """
    GET  → liste tous les groupes
    POST → crée un nouveau groupe (admin seulement)
    """
    serializer_class   = AgentGroupSerializer
    permission_classes = [IsAdminOrSupervisor]
    queryset           = AgentGroup.objects.prefetch_related('agents').all()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAdminOrSupervisor()]


class AgentGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → détail d'un groupe
    PATCH  → modifier le groupe (admin/supervisor)
    DELETE → supprimer (admin seulement)
    """
    serializer_class   = AgentGroupSerializer
    permission_classes = [IsAdminOrSupervisor]
    queryset           = AgentGroup.objects.prefetch_related('agents').all()


class AddAgentToGroupView(APIView):
    """
    Ajoute un agent à un groupe.
    Accessible par admin et supervisor.
    """
    permission_classes = [IsAdminOrSupervisor]

    def post(self, request, pk):
        try:
            group    = AgentGroup.objects.get(pk=pk)
            agent_id = request.data.get('agent_id')
            agent    = User.objects.get(id=agent_id, role='agent')
            group.agents.add(agent)
            return Response({
                'detail':  f'{agent.full_name()} ajouté au groupe {group.name}',
                'group':   group.name,
                'agent':   agent.email,
            })
        except AgentGroup.DoesNotExist:
            return Response({'detail': 'Groupe introuvable'}, status=404)
        except User.DoesNotExist:
            return Response({'detail': 'Agent introuvable'}, status=404)


class RemoveAgentFromGroupView(APIView):
    """
    Retire un agent d'un groupe.
    Accessible par admin et supervisor.
    """
    permission_classes = [IsAdminOrSupervisor]

    def post(self, request, pk):
        try:
            group    = AgentGroup.objects.get(pk=pk)
            agent_id = request.data.get('agent_id')
            agent    = User.objects.get(id=agent_id, role='agent')
            group.agents.remove(agent)
            return Response({
                'detail': f'{agent.full_name()} retiré du groupe {group.name}',
            })
        except AgentGroup.DoesNotExist:
            return Response({'detail': 'Groupe introuvable'}, status=404)
        except User.DoesNotExist:
            return Response({'detail': 'Agent introuvable'}, status=404)


class AgentGroupsByPlatformView(APIView):
    """
    Retourne le groupe d'agents pour une plateforme donnée.
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request, platform):
        try:
            group   = AgentGroup.objects.prefetch_related('agents').get(
                platform=platform,
                is_active=True,
            )
            return Response(AgentGroupSerializer(group).data)
        except AgentGroup.DoesNotExist:
            return Response({'detail': f'Aucun groupe pour {platform}'}, status=404)
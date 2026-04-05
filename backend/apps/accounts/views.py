from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer, RegisterSerializer, AgentStatusSerializer
from .permissions import IsAdmin, IsAdminOrSupervisor


class RegisterView(generics.CreateAPIView):
    """Admin creates new agent or supervisor accounts"""
    serializer_class   = RegisterSerializer
    permission_classes = [IsAdmin]


class UserListView(generics.ListAPIView):
    """List all users — admin and supervisor only"""
    serializer_class   = UserSerializer
    permission_classes = [IsAdminOrSupervisor]

    def get_queryset(self):
        role = self.request.query_params.get('role')
        qs   = User.objects.filter(is_active=True)
        if role:
            qs = qs.filter(role=role)
        return qs


class UserDetailView(generics.RetrieveUpdateAPIView):
    """Get or update a single user"""
    serializer_class   = UserSerializer
    permission_classes = [IsAdminOrSupervisor]
    queryset           = User.objects.all()


class MeView(APIView):
    """Returns the currently logged-in user's profile"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AgentStatusView(APIView):
    """Agent updates their own status (online/busy/offline)"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        serializer = AgentStatusSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Blacklist the refresh token on logout"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data['refresh'])
            token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out'}, status=status.HTTP_200_OK)

class AgentListView(APIView):
    """
    Returns all agents with their current status.
    Used by supervisor to see who is online/busy/offline.
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta

        agents = User.objects.filter(
            role=User.Role.AGENT,
            is_active=True,
        ).order_by('status', 'open_conversations')

        data = []
        for agent in agents:
            # consider agent inactive if last_seen > 2 minutes ago
            is_recently_active = (
                agent.last_seen and
                agent.last_seen >= timezone.now() - timedelta(minutes=2)
            )

            data.append({
                'id':                str(agent.id),
                'email':             agent.email,
                'full_name':         agent.full_name(),
                'status':            agent.status,
                'open_conversations': agent.open_conversations,
                'last_seen':         agent.last_seen.isoformat() if agent.last_seen else None,
                'is_active':         is_recently_active,
            })

        return Response(data)
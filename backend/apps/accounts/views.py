from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import AdminUserUpdateSerializer, UserSerializer, RegisterSerializer, AgentStatusSerializer
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
    permission_classes = [IsAdminOrSupervisor]
    queryset           = User.objects.all()

    def get_serializer_class(self):
        # Admin updating → use full update serializer
        if self.request.method in ['PUT', 'PATCH'] and self.request.user.role == 'admin':
            return AdminUserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAdmin()]
        return [IsAdminOrSupervisor()]
class AdminResetPasswordView(APIView):
    """Admin resets any user's password"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user         = User.objects.get(pk=pk)
            new_password = request.data.get('password')

            if not new_password or len(new_password) < 6:
                return Response(
                    {'detail': 'Password must be at least 6 characters'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save()
            return Response({'detail': f'Password reset for {user.email}'})

        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)
class MeView(APIView):
    """Returns the currently logged-in user's profile"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AgentStatusView(APIView):
    """Agent manually sets their own status"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        new_status = request.data.get('status')

        if new_status not in ['online', 'busy', 'offline']:
            return Response(
                {'detail': 'status must be online, busy or offline'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save as both current status and manual override
        User.objects.filter(pk=request.user.pk).update(
            status=new_status,
            manual_status=new_status,
        )

        return Response({'status': new_status, 'manual_status': new_status})

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
            is_recently_active = (
                agent.last_seen and
                agent.last_seen >= timezone.now() - timedelta(minutes=2)
            )
            data.append({
                'id':                  str(agent.id),
                'email':               agent.email,
                'full_name':           agent.full_name(),
                'status':              agent.status,
                'manual_status':       agent.manual_status,
                'open_conversations':  agent.open_conversations,
                'last_seen':           agent.last_seen.isoformat() if agent.last_seen else None,
                'is_recently_active':  is_recently_active,
            })

        return Response(data)
class ChangePasswordView(APIView):
    """Agent/supervisor changes their own password"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not request.user.check_password(old_password):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not new_password or len(new_password) < 6:
            return Response(
                {'detail': 'New password must be at least 6 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        request.user.set_password(new_password)
        request.user.save()
        return Response({'detail': 'Password changed successfully'})
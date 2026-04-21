from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Conversation
from .serializers import ConversationSerializer, ReassignSerializer
from .services import ConversationService
from apps.accounts.permissions import IsAgentOrSupervisor, IsAdminOrSupervisor
from apps.messages.repository import MessageRepository

class ConversationListView(generics.ListAPIView):
    serializer_class   = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs   = Conversation.objects.select_related('client', 'agent', 'channel')

        if user.role == 'agent':
            # Agents only see conversations assigned to them
            qs = qs.filter(agent=user)

        elif user.role == 'supervisor':
            # Supervisors see all conversations
            pass

        elif user.role == 'admin':
            # Admin sees all conversations
            pass

        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        # Search by client name
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                client__first_name__icontains=search
            ) | qs.filter(
                client__last_name__icontains=search
            ) | qs.filter(
                client__email__icontains=search
            )

        return qs.order_by('-updated_at')


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class   = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset           = Conversation.objects.select_related('client', 'agent', 'channel')


class ConversationMessagesView(APIView):
    """Returns all messages for a conversation from MongoDB"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            conversation = Conversation.objects.get(pk=pk)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        if not conversation.mongo_conv_id:
            return Response([])

        messages = MessageRepository.get_messages(conversation.mongo_conv_id)

        # Convert ObjectId and datetime to strings for JSON
        result = []
        for m in messages:
            result.append({
                'id':           str(m['_id']),
                'external_id':  m.get('external_id', ''),
                'sender_id':    m.get('sender_id', ''),
                'direction':    m.get('direction', 'inbound'),
                'type':         m.get('type', 'text'),
                'text':         m.get('text', ''),
                'attachments':  m.get('attachments', []),
                'timestamp':    m['timestamp'].isoformat() if m.get('timestamp') else None,
                'read_at':      m['read_at'].isoformat() if m.get('read_at') else None,
            })

        return Response(result)


class ResolveConversationView(APIView):
    """Agent marks a conversation as resolved"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            conversation = Conversation.objects.get(pk=pk, agent=request.user)
            conversation.status = Conversation.Status.RESOLVED
            conversation.save(update_fields=['status', 'updated_at'])
            return Response({'detail': 'Resolved'})
        except Conversation.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class ReassignConversationView(APIView):
    """Supervisor reassigns a conversation to a different agent"""
    permission_classes = [IsAdminOrSupervisor]

    def post(self, request, pk):
        serializer = ReassignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            ConversationService.reassign(
                conversation_id=str(pk),
                new_agent_id=str(serializer.validated_data['agent_id']),
                supervisor=request.user,
            )
            return Response({'detail': 'Reassigned successfully'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

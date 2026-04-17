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
    permission_classes = [IsAgentOrSupervisor]

    def get_queryset(self):
        user = self.request.user
        qs   = Conversation.objects.select_related('client', 'agent', 'channel')

        # Agents only see their own conversations
        if user.role == 'agent':
            qs = qs.filter(agent=user)

        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs.order_by('-updated_at')


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class   = ConversationSerializer
    permission_classes = [IsAgentOrSupervisor]
    queryset           = Conversation.objects.select_related('client', 'agent', 'channel')


class ConversationMessagesView(APIView):
    """Returns all messages for a conversation from MongoDB"""
    permission_classes = [IsAgentOrSupervisor]

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
    permission_classes = [IsAgentOrSupervisor]

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
class SimulateIncomingMessageView(APIView):
    """
    Simulates an incoming message from a client via Meta.
    Use this for testing without connecting Meta API.
    Available to admin and supervisor only.
    """
    permission_classes = [IsAdminOrSupervisor]

    def post(self, request):
        from datetime import datetime

        try:
            # Get values from request or use smart defaults
            sender_id  = request.data.get('sender_id',  f'test_client_{int(datetime.now().timestamp())}')
            source     = request.data.get('source',     'whatsapp')
            page_id    = request.data.get('page_id',    'test_page_001')
            text       = request.data.get('text',       'Hello I need help')
            first_name = request.data.get('first_name', 'Test')
            last_name  = request.data.get('last_name',  'Client')

            # Validate source
            valid_sources = ['facebook', 'instagram', 'whatsapp']
            if source not in valid_sources:
                return Response({
                    'success': False,
                    'error': f'source must be one of {valid_sources}',
                    'message': 'Invalid source parameter'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Build normalized message
            message = {
                'source':       source,
                'external_id':  f'sim_{int(datetime.now().timestamp() * 1000)}',
                'sender_id':    sender_id,
                'page_id':      page_id,
                'text':         text,
                'message_type': 'text',
                'direction':    'inbound',
                'timestamp':    datetime.now(),
                'raw':          {},
            }

            # Run the full flow
            ConversationService.handle_incoming(message)

            # Update client name if provided
            from apps.clients.models import Client
            client = Client.objects.filter(sender_id=sender_id).first()
            if client and (first_name or last_name):
                client.first_name = first_name
                client.last_name  = last_name
                client.save(update_fields=['first_name', 'last_name'])

            # Get the conversation that was just created/updated
            conversation = Conversation.objects.filter(
                client=client
            ).order_by('-updated_at').first()

            # ✅ FIXED: Return response with ALL expected fields
            response_data = {
                'success': True,
                'message': 'Conversation simulated successfully',
                'data': {
                    'conversation_id': str(conversation.id) if conversation else None,
                    'mongo_conv_id': conversation.mongo_conv_id if conversation else None,
                    'client': {
                        'id': str(client.id) if client else None,
                        'name': f'{first_name} {last_name}',
                        'sender_id': sender_id,
                        'source': source,
                    },
                    'assigned_to': conversation.agent.email if conversation and conversation.agent else 'unassigned',
                    'status': conversation.status if conversation else None,
                    'message_text': text,
                    'timestamp': datetime.now().isoformat()
                },
                'conversation': {
                    'id': str(conversation.id) if conversation else None,
                    'mongo_conv_id': conversation.mongo_conv_id if conversation else None,
                    'status': conversation.status if conversation else None,
                    'client_name': f'{first_name} {last_name}',
                    'source': source
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Error in SimulateIncomingMessageView")
            
            return Response({
                'success': False,
                'error': str(e),
                'message': f'Simulation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
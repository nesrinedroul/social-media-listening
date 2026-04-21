from django.db import transaction
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from apps.accounts.models import User
from apps.clients.models import Client
from .models import Channel, Conversation, Assignment
from apps.messages.repository import MessageRepository


class ConversationService:

    @staticmethod
    def handle_incoming(message: dict):
        """
        Called by Celery for every incoming webhook message.
        1. Find or create the client
        2. Find or create the conversation
        3. Save message to MongoDB
        4. Auto-assign to an agent if not already assigned
        5. Push real-time notification via WebSocket
        """
        with transaction.atomic():
            # 1 — find or create client
            client, _ = Client.objects.get_or_create(
                sender_id=message['sender_id'],
                defaults={'source': message['source']},
            )

            # 2 — find or create channel
            channel, _ = Channel.objects.get_or_create(
                page_id=message['page_id'],
                defaults={
                    'platform': message['source'],
                    'name':     message['page_id'],
                },
            )

            # 3 — find open conversation or create new one
            conversation = Conversation.objects.filter(
                client=client,
                channel=channel,
                status__in=[Conversation.Status.OPEN, Conversation.Status.PENDING],
            ).first()

            if not conversation:
                conversation = Conversation.objects.create(
                    client=client,
                    channel=channel,
                    status=Conversation.Status.PENDING,
                )

            # 4 — save message to MongoDB
            if not conversation.mongo_conv_id:
                mongo_id = MessageRepository.get_or_create_conversation(
                    str(conversation.id)
                )
                conversation.mongo_conv_id = mongo_id
                conversation.save(update_fields=['mongo_conv_id'])

            MessageRepository.append_message(conversation.mongo_conv_id, message)

            # 5 — auto-assign if no agent yet
            if not conversation.agent:
                agent = ConversationService._pick_agent()
                if agent:
                    ConversationService._assign(conversation, agent, assigned_by='system')

            # 6 — push real-time notification to the assigned agent
            ConversationService._notify_agent(conversation, message)

    @staticmethod
    def _pick_agent() -> User | None:
        """
        Picks the best available agent:
        - must be online
        - ordered by fewest open conversations first
        - tie-break: longest time since last assignment
        """
        return User.objects.filter(
            role=User.Role.AGENT,
            status=User.Status.ONLINE,
            is_active=True,
        ).order_by('open_conversations', 'last_assigned_at').first()

    @staticmethod
    def _assign(conversation: Conversation, agent: User, assigned_by: str):
        # Update conversation
        conversation.agent  = agent
        conversation.status = Conversation.Status.OPEN
        conversation.save(update_fields=['agent', 'status', 'updated_at'])

        # Log assignment history
        Assignment.objects.create(
            conversation=conversation,
            agent=agent,
            assigned_by=assigned_by,
        )

        # Update agent counters
        User.objects.filter(pk=agent.pk).update(
            open_conversations=agent.open_conversations + 1,
            last_assigned_at=timezone.now(),
        )

    @staticmethod
    def reassign(conversation_id: str, new_agent_id: str, supervisor: User):
        """
        Called by supervisor to manually reassign a conversation.
        """
        with transaction.atomic():
            conversation = Conversation.objects.select_for_update().get(
                id=conversation_id
            )
            new_agent = User.objects.get(id=new_agent_id, role=User.Role.AGENT)

            # Decrement old agent's counter
            if conversation.agent:
                User.objects.filter(pk=conversation.agent.pk).update(
                    open_conversations=max(0, conversation.agent.open_conversations - 1)
                )

            ConversationService._assign(conversation, new_agent, assigned_by='supervisor')
            ConversationService._notify_agent(conversation, {})

    @staticmethod
    def _notify_agent(conversation: Conversation, message: dict):
        if not conversation.agent:
            return

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{conversation.agent.id}',
            {
                'type':            'new_conversation',
                'conversation_id': str(conversation.id),
                'client_name':     conversation.client.full_name(),
                'source':          conversation.channel.platform,
                'preview':         message.get('text', '')[:100],
            }
        )
@staticmethod
def send_reply(conversation_id: str, agent, text: str) -> dict:
    """
    Called when an agent sends a reply.
    1. Verify agent owns this conversation
    2. Save outbound message to MongoDB
    3. Send via correct channel (Meta API or Email)
    4. Broadcast via WebSocket
    """
    try:
        conversation = Conversation.objects.select_related(
            'client', 'channel', 'agent'
        ).get(id=conversation_id)
    except Conversation.DoesNotExist:
        raise ValueError('Conversation not found')

    # Only the assigned agent or a supervisor can reply
    if agent.role == 'agent' and conversation.agent != agent:
        raise PermissionError('You are not assigned to this conversation')

    # Save to MongoDB as outbound message
    message = {
        'external_id':  '',
        'sender_id':    str(agent.id),
        'direction':    'outbound',
        'message_type': 'text',
        'text':         text,
        'attachments':  [],
    }
    MessageRepository.append_message(conversation.mongo_conv_id, message)

    # Send via correct channel
    platform  = conversation.channel.platform
    delivered = False

    if platform == 'email':
        from apps.integrations.email_sender import PostmarkEmailSender
        delivered = PostmarkEmailSender.send_reply(conversation, text)
    else:
        from apps.integrations.messenger import MetaMessenger
        delivered = MetaMessenger.send_reply(conversation, text)

    # Broadcast to WebSocket so UI updates instantly
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{conversation.agent.id}',
            {
                'type':            'new_message',
                'conversation_id': str(conversation.id),
                'message': {
                    'direction': 'outbound',
                    'text':      text,
                    'sender':    agent.full_name(),
                },
            }
        )
    except Exception as e:
        print(f'WebSocket broadcast error: {e}')

    return {
        'saved':     True,
        'delivered': delivered,
    }
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
            try:
                if not conversation.mongo_conv_id:
                    mongo_id = MessageRepository.get_or_create_conversation(
                        str(conversation.id)
                    )
                    conversation.mongo_conv_id = mongo_id
                    conversation.save(update_fields=['mongo_conv_id', 'updated_at'])

                MessageRepository.append_message(conversation.mongo_conv_id, message)

            except Exception as e:
                print(f'MongoDB error: {e}')

            # 5 — auto-assign if no agent yet
            if not conversation.agent:
                agent = ConversationService._pick_agent()
                if agent:
                    ConversationService._assign(conversation, agent, assigned_by='system')

            # 6 — push real-time notification
            ConversationService._notify_agent(conversation, message)

    @staticmethod
    def _pick_agent() -> User | None:
        return User.objects.filter(
            role=User.Role.AGENT,
            status=User.Status.ONLINE,
            is_active=True,
        ).order_by('open_conversations', 'last_assigned_at').first()

    @staticmethod
    def _assign(conversation: Conversation, agent: User, assigned_by: str):
        conversation.agent  = agent
        conversation.status = Conversation.Status.OPEN
        conversation.save(update_fields=['agent', 'status', 'updated_at'])

        Assignment.objects.create(
            conversation=conversation,
            agent=agent,
            assigned_by=assigned_by,
        )

        User.objects.filter(pk=agent.pk).update(
            open_conversations=agent.open_conversations + 1,
            last_assigned_at=timezone.now(),
        )

    @staticmethod
    def reassign(conversation_id: str, new_agent_id: str, supervisor: User):
        with transaction.atomic():
            try:
                conversation = Conversation.objects.select_for_update().get(
                    id=conversation_id
                )
            except Conversation.DoesNotExist:
                raise ValueError(f'Conversation {conversation_id} not found')

            try:
                new_agent = User.objects.get(
                    id=new_agent_id,
                    role=User.Role.AGENT,
                    is_active=True,
                )
            except User.DoesNotExist:
                raise ValueError(f'No active agent found with id {new_agent_id}')

            if conversation.agent:
                User.objects.filter(pk=conversation.agent.pk).update(
                    open_conversations=max(0, conversation.agent.open_conversations - 1)
                )

            ConversationService._assign(conversation, new_agent, assigned_by='supervisor')

            try:
                ConversationService._notify_agent(conversation, {})
            except Exception as e:
                print(f'WebSocket notify error: {e}')

    @staticmethod
    def send_reply(conversation_id: str, agent, text: str) -> dict:
        try:
            conversation = Conversation.objects.select_related(
                'client', 'channel', 'agent'
            ).get(id=conversation_id)
        except Conversation.DoesNotExist:
            raise ValueError('Conversation not found')

        if agent.role == 'agent' and conversation.agent != agent:
            raise PermissionError('You are not assigned to this conversation')

        # Make sure MongoDB doc exists
        if not conversation.mongo_conv_id:
            mongo_id = MessageRepository.get_or_create_conversation(
                str(conversation.id)
            )
            conversation.mongo_conv_id = mongo_id
            conversation.save(update_fields=['mongo_conv_id'])

        # Save outbound message to MongoDB
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

        # Broadcast to WebSocket
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

    @staticmethod
    def _notify_agent(conversation: Conversation, message: dict):
        if not conversation.agent:
            return

        try:
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
        except Exception as e:
            print(f'WebSocket notify error: {e}')
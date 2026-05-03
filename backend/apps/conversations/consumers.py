import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from urllib.parse import parse_qs
import logging

logger = logging.getLogger(__name__)
class ConversationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Agent logs in → set to BUSY automatically
        if self.user.role == 'agent':
            await self._set_busy_on_login()

    async def disconnect(self, close_code):
        if self.user.is_authenticated and self.user.role == 'agent':
            await self._set_offline()
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get('type') == 'heartbeat':
            await self._update_last_seen()

        elif data.get('type') == 'send_reply':
            await self._handle_reply(
                conversation_id=data.get('conversation_id'),
                text=data.get('text', ''),
            )

    @database_sync_to_async
    def _set_offline(self):
        from apps.accounts.models import User
        User.objects.filter(pk=self.user.pk).update(
            status='offline',
            last_seen=timezone.now(),
        )

    @database_sync_to_async
    def _update_last_seen(self):
        from apps.accounts.models import User
        User.objects.filter(pk=self.user.pk).update(
            last_seen=timezone.now(),
        )

    @database_sync_to_async
    def _handle_reply(self, conversation_id: str, text: str):
        from apps.conversations.services import ConversationService
        try:
            ConversationService.send_reply(
                conversation_id=conversation_id,
                agent=self.user,
                text=text,
            )
        except Exception as e:
            print(f'WebSocket reply error: {e}')

    async def new_conversation(self, event):
        await self.send(text_data=json.dumps({
            'type':            'new_conversation',
            'conversation_id': event['conversation_id'],
            'client_name':     event['client_name'],
            'source':          event['source'],
            'preview':         event['preview'],
        }))

    async def new_message(self, event):
        await self.send(text_data=json.dumps({
            'type':            'new_message',
            'conversation_id': event['conversation_id'],
            'message':         event['message'],
        }))
    @database_sync_to_async
    def _get_status(self):
        """Get current user status"""
        from apps.accounts.models import User
        try:
            user = User.objects.get(pk=self.user.pk)
            return user.status
        except Exception as e:
            logger.error(f"Failed to get status: {e}")
            return 'offline'

    @database_sync_to_async
    def _set_status(self, status: str):
        from apps.accounts.models import User
        try:
            User.objects.filter(pk=self.user.pk).update(
                status=status,
                last_seen=timezone.now(),
            )
            logger.info(f"User {self.user.email} status set to {status}")
        except Exception as e:
            logger.error(f"Failed to set status: {e}")

    @database_sync_to_async
    def _update_last_seen(self):
        from apps.accounts.models import User
        try:
            User.objects.filter(pk=self.user.pk).update(
                last_seen=timezone.now(),
            )
        except Exception as e:
            logger.error(f"Failed to update last_seen: {e}")

    @database_sync_to_async
    def _handle_reply(self, conversation_id: str, text: str):
        from apps.conversations.services import ConversationService
        try:
            ConversationService.send_reply(
                conversation_id=conversation_id,
                agent=self.user,
                text=text,
            )
            logger.info(f"Reply sent to conversation {conversation_id} by {self.user.email}")
        except Exception as e:
            logger.error(f"Failed to send reply: {e}")

    async def new_conversation(self, event):
        """Send new conversation notification to agent"""
        await self.send(text_data=json.dumps({
            'type': 'new_conversation',
            'conversation_id': event['conversation_id'],
            'client_name': event.get('client_name', 'Unknown'),
            'source': event.get('source', 'unknown'),
            'preview': event.get('preview', ''),
        }))

    async def new_message(self, event):
        """Send new message notification to agent"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'conversation_id': event['conversation_id'],
            'message': event.get('message', {}),
        }))
    @database_sync_to_async
    def _set_busy_on_login(self):
        from apps.accounts.models import User
        from django.utils import timezone
        User.objects.filter(pk=self.user.pk).update(
            status='busy',
            last_seen=timezone.now(),
        )
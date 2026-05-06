import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


class ConversationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user       = self.scope['user']
        self.group_name = None

        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # On connect — respect manual_status
        if self.user.role == 'agent':
            await self._restore_status_on_connect()

    async def disconnect(self, close_code):
        if not self.group_name:
            return

        if hasattr(self, 'user') and self.user.is_authenticated and self.user.role == 'agent':
            await self._set_offline()

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        if data.get('type') == 'send_reply':
            await self._handle_reply(
                conversation_id=data.get('conversation_id'),
                text=data.get('text', ''),
            )

    @database_sync_to_async
    def _restore_status_on_connect(self):
        """
        On WebSocket connect (login or page refresh):
        - If agent manually chose online → set to busy (they're working)
        - If agent manually chose busy   → keep busy
        - If agent manually chose offline → respect it, don't change
        This means page refresh won't reset a manually set status.
        """
        from apps.accounts.models import User
        user = User.objects.get(pk=self.user.pk)

        manual = user.manual_status or 'offline'

        if manual in ('online', 'busy'):
            User.objects.filter(pk=self.user.pk).update(status='busy')
            logger.info(f'Agent {user.email} reconnected → BUSY (manual={manual})')
        else:
            # manual = offline → don't touch status
            logger.info(f'Agent {user.email} reconnected → kept OFFLINE (manual=offline)')

    @database_sync_to_async
    def _set_offline(self):
        """
        On disconnect — always set status to offline.
        manual_status stays unchanged so we remember what they chose.
        """
        from apps.accounts.models import User
        User.objects.filter(pk=self.user.pk).update(status='offline')
        logger.info(f'Agent {self.user.email} disconnected → OFFLINE')

    @database_sync_to_async
    def _handle_reply(self, conversation_id: str, text: str):
        from apps.conversations.services import ConversationService
        try:
            ConversationService.send_reply(
                conversation_id=conversation_id,
                agent=self.user,
                text=text,
            )
            logger.info(f'Reply sent to {conversation_id} by {self.user.email}')
        except Exception as e:
            logger.error(f'Reply error: {e}')

    async def new_conversation(self, event):
        await self.send(text_data=json.dumps({
            'type':            'new_conversation',
            'conversation_id': event['conversation_id'],
            'client_name':     event.get('client_name', 'Unknown'),
            'source':          event.get('source', 'unknown'),
            'preview':         event.get('preview', ''),
        }))

    async def new_message(self, event):
        await self.send(text_data=json.dumps({
            'type':            'new_message',
            'conversation_id': event['conversation_id'],
            'message':         event.get('message', {}),
        }))
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

logger = logging.getLogger(__name__)


class ConversationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user       = self.scope['user']
        self.group_name = None  # ← always initialize first

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
        # Guard: only clean up if connect() fully completed
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

        if data.get('type') == 'heartbeat':
            await self._update_last_seen()

        elif data.get('type') == 'send_reply':
            await self._handle_reply(
                conversation_id=data.get('conversation_id'),
                text=data.get('text', ''),
            )

    # ── Database methods ────────────────────────────────────────────

    @database_sync_to_async
    def _set_busy_on_login(self):
        from apps.accounts.models import User
        User.objects.filter(pk=self.user.pk).update(
            status='busy',
            last_seen=timezone.now(),
        )
        logger.info(f'Agent {self.user.email} connected → BUSY')

    @database_sync_to_async
    def _set_offline(self):
        from apps.accounts.models import User
        User.objects.filter(pk=self.user.pk).update(
            status='offline',
            last_seen=timezone.now(),
        )
        logger.info(f'Agent {self.user.email} disconnected → OFFLINE')

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
            logger.info(f'Reply sent to {conversation_id} by {self.user.email}')
        except Exception as e:
            logger.error(f'Reply error: {e}')

    # ── Channel layer event handlers ─────────────────────────────────

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
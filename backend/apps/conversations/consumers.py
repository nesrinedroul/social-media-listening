import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ConversationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return

        self.group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # automatically set online when WebSocket connects
        if self.user.role == 'agent':
            await self._set_status('online')

    async def disconnect(self, close_code):
        # automatically set offline when WebSocket disconnects
        if self.user.is_authenticated and self.user.role == 'agent':
            await self._set_status('offline')

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
    def _set_status(self, status: str):
        from apps.accounts.models import User
        User.objects.filter(pk=self.user.pk).update(
            status=status,
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
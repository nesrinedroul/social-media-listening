import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ConversationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return
        self.group_name = f'user_{self.user.id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name,
        )

    # Receive message from WebSocket (from frontend)
    async def receive(self, text_data):
        data = json.loads(text_data)
        # We'll handle agent sending replies here later

    # Receive message from channel layer (from Celery/Django)
    # and forward it to the WebSocket
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
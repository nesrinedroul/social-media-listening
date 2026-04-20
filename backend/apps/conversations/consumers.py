# backend/apps/conversations/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class ConversationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info(f"WebSocket connect attempt: {self.scope['path']}")
        
        # Get user from scope (set by AuthMiddlewareStack)
        self.user = self.scope.get('user')
        
        if not self.user or not self.user.is_authenticated:
            logger.warning(f"WebSocket rejected: user not authenticated")
            await self.close()
            return

        logger.info(f"WebSocket authenticated for user: {self.user.email} (role: {self.user.role})")
        
        self.group_name = f'user_{self.user.id}'
        
        # Add user to their personal channel group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        logger.info(f"WebSocket accepted: {self.channel_name}")
        
        # Set agent status to online if they're an agent
        if self.user.role == 'agent':
            await self._set_status('online')
        
        # Send confirmation to client
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected successfully',
            'user_id': str(self.user.id),
            'role': self.user.role
        }))

    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnected: {close_code}")
        
        if hasattr(self, 'user') and self.user and self.user.is_authenticated:
            if self.user.role == 'agent':
                await self._set_status('offline')
        
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Handle incoming WebSocket messages from client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            logger.info(f"Received WebSocket message: {message_type} from user {self.user.email}")
            
            if message_type == 'heartbeat':
                await self._update_last_seen()
                # Send heartbeat response
                await self.send(text_data=json.dumps({
                    'type': 'heartbeat_ack',
                    'timestamp': timezone.now().isoformat()
                }))
                
            elif message_type == 'send_reply':
                conversation_id = data.get('conversation_id')
                text = data.get('text', '')
                
                if conversation_id and text:
                    await self._handle_reply(conversation_id, text)
                else:
                    logger.warning(f"Missing conversation_id or text in send_reply")
                    
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received: {e}")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")

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
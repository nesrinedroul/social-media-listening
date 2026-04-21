# backend/apps/conversations/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from urllib.parse import parse_qs
import logging

logger = logging.getLogger(__name__)

class ConversationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info(f"WebSocket connect attempt: {self.scope['path']}")
        
        # Extract token from query string
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token_list = query_params.get('token', [])
        token = token_list[0] if token_list else None
        
        if not token:
            logger.warning("No token provided in WebSocket connection")
            await self.close()
            return
        
        # Authenticate user with token
        user = await self.get_user_from_token(token)
        
        if not user or not user.is_authenticated:
            logger.warning(f"WebSocket rejected: invalid token")
            await self.close()
            return
        
        self.user = user
        logger.info(f"WebSocket authenticated for user: {user.email} (role: {user.role})")
        
        self.group_name = f'user_{self.user.id}'
        
        # Add user to their personal channel group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        logger.info(f"WebSocket accepted: {self.channel_name}")
        
        # ✅ FIX: Only set status to online if user is not manually set to busy
        if self.user.role == 'agent':
            current_status = await self._get_status()
            # Don't override if user manually set status to 'busy'
            if current_status != 'busy':
                await self._set_status('online')
            else:
                logger.info(f"User {user.email} status is 'busy', not overriding")
        
        # Send confirmation to client
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected successfully',
            'user_id': str(self.user.id),
            'role': self.user.role,
            'status': await self._get_status()
        }))

    async def disconnect(self, close_code):
        logger.info(f"WebSocket disconnected: {close_code}")
        
        if hasattr(self, 'user') and self.user and self.user.is_authenticated:
            if self.user.role == 'agent':
                # ✅ FIX: Only set offline if not manually set to busy
                current_status = await self._get_status()
                if current_status != 'busy':
                    await self._set_status('offline')
                else:
                    logger.info(f"User {self.user.email} status is 'busy', not auto-setting offline")
        
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
                await self.send(text_data=json.dumps({
                    'type': 'heartbeat_ack',
                    'timestamp': timezone.now().isoformat()
                }))
                
            elif message_type == 'send_reply':
                conversation_id = data.get('conversation_id')
                text = data.get('text', '')
                
                if conversation_id and text:
                    await self._handle_reply(conversation_id, text)
                    
            elif message_type == 'test':
                await self.send(text_data=json.dumps({
                    'type': 'test_response',
                    'message': 'WebSocket is working!'
                }))
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received: {e}")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Validate JWT token and return user"""
        from django.contrib.auth import get_user_model
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        
        User = get_user_model()
        
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
            return user
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            logger.error(f"Token validation error: {e}")
            return None

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
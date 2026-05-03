import hashlib
import hmac
import json

from django.conf import settings
from django.http import HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .tasks import process_webhook_payload_sync


@method_decorator(csrf_exempt, name='dispatch')
class MetaWebhookView(View):

    def get(self, request):
        mode      = request.GET.get('hub.mode')
        token     = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')

        if mode == 'subscribe' and token == settings.META_VERIFY_TOKEN:
            return HttpResponse(challenge, content_type='text/plain', status=200)
        return HttpResponse('Forbidden', status=403)

    def post(self, request):
        signature = request.headers.get('X-Hub-Signature-256', '')
        if not self._valid_signature(request.body, signature):
            print(f'Invalid signature: {signature}')
            return HttpResponse('Invalid signature', status=403)

        try:
            payload = json.loads(request.body)
            print(f'Meta webhook received: {payload}')
            process_webhook_payload_sync(payload)  # ← sync, no .delay()
            return HttpResponse('OK', status=200)
        except Exception as e:
            print(f'Webhook error: {e}')
            import traceback
            traceback.print_exc()
            return HttpResponse('OK', status=200)  # always 200 to Meta

    def _valid_signature(self, body: bytes, signature: str) -> bool:
        if not signature.startswith('sha256='):
            return False
        expected = hmac.new(
            settings.META_APP_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature[7:])


@method_decorator(csrf_exempt, name='dispatch')
class EmailWebhookView(View):

    def post(self, request):
        import json
        from .email_handler import normalize_postmark_payload
        from apps.conversations.services import ConversationService
        from apps.clients.models import Client

        try:
            payload = json.loads(request.body)
            message = normalize_postmark_payload(payload)
            ConversationService.handle_incoming(message)

            client = Client.objects.filter(sender_id=message['sender_id']).first()
            if client:
                if message.get('first_name') and not client.first_name:
                    client.first_name = message['first_name']
                if message.get('last_name') and not client.last_name:
                    client.last_name = message['last_name']
                if message.get('sender_email') and not client.email:
                    client.email = message['sender_email']
                client.save()

            return HttpResponse('OK', status=200)
        except Exception as e:
            print(f'Email webhook error: {e}')
            return HttpResponse('Error', status=500)
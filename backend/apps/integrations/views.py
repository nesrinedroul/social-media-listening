import hashlib
import hmac
import json

from django.conf import settings
from django.http import HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .tasks import process_webhook_payload


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
            return HttpResponse('Invalid signature', status=403)

        payload = json.loads(request.body)
        process_webhook_payload.delay(payload)
        return HttpResponse('OK', status=200)

    def _valid_signature(self, body: bytes, signature: str) -> bool:
        if not signature.startswith('sha256='):
            return False
        expected = hmac.new(
            settings.META_APP_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature[7:])
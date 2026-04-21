import json
from urllib import error, request
from django.conf import settings


class PostmarkEmailSender:

    API_URL = 'https://api.postmarkapp.com/email'

    @staticmethod
    def send_reply(conversation, text: str) -> bool:
        token      = getattr(settings, 'POSTMARK_SERVER_TOKEN', None)
        client     = conversation.client
        agent      = conversation.agent
        to_email   = client.email
        from_email = getattr(settings, 'POSTMARK_FROM_EMAIL', '')

        if not token:
            print('POSTMARK_SERVER_TOKEN not set')
            return False

        if not to_email:
            print(f'Client {client.id} has no email — cannot send reply')
            return False

        if not from_email:
            print('POSTMARK_FROM_EMAIL not set')
            return False

        payload = {
            'From':          f'{agent.full_name()} <{from_email}>',
            'To':            to_email,
            'Subject':       'Re: Your message',
            'TextBody':      text,
            'MessageStream': 'outbound',
        }

        req = request.Request(
            PostmarkEmailSender.API_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Accept':                  'application/json',
                'Content-Type':            'application/json',
                'X-Postmark-Server-Token': token,
            },
            method='POST',
        )

        try:
            with request.urlopen(req, timeout=15) as resp:
                status_code = resp.getcode()
                response_text = resp.read().decode('utf-8')
        except error.HTTPError as exc:
            status_code = exc.code
            response_text = exc.read().decode('utf-8', errors='replace')
        except error.URLError as exc:
            print(f'Postmark request failed: {exc}')
            return False

        print(f'Postmark reply: {status_code} — {response_text}')
        return status_code == 200
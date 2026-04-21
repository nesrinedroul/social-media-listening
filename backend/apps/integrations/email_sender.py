import json
from urllib import request, error

from django.conf import settings


class PostmarkEmailSender:

    API_URL = 'https://api.postmarkapp.com/email'

    @staticmethod
    def send_reply(conversation, text: str) -> bool:
        """
        Sends an email reply to the client.
        """
        token = getattr(settings, 'POSTMARK_SERVER_TOKEN', None)
        if not token:
            print('POSTMARK_SERVER_TOKEN not set')
            return False

        client     = conversation.client
        agent      = conversation.agent
        to_email   = client.email
        from_email = getattr(settings, 'POSTMARK_FROM_EMAIL', 'support@yourdomain.com')

        if not to_email:
            print(f'Client {client.id} has no email address')
            return False

        payload = {
            'From':     f'{agent.full_name()} <{from_email}>',
            'To':       to_email,
            'Subject':  f'Re: Your message',
            'TextBody': text,
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
            with request.urlopen(req) as resp:
                status_code = resp.getcode()
                resp_text = resp.read().decode('utf-8')
        except error.HTTPError as e:
            status_code = e.code
            resp_text = e.read().decode('utf-8')
        except error.URLError as e:
            print(f'Postmark send failed: {e}')
            return False

        print(f'Postmark send: {status_code} {resp_text}')
        return status_code == 200
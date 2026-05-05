import requests


class MetaMessenger:
    GRAPH_URL = 'https://graph.facebook.com/v19.0'

    @staticmethod
    def send_reply(conversation, text: str) -> bool:
        platform  = conversation.channel.platform
        sender_id = conversation.client.sender_id
        page_id   = conversation.channel.page_id
        token     = MetaMessenger._get_token(page_id)

        if not token:
            print(f'No token found for page {page_id}')
            return False

        print(f'Sending reply via {platform} to {sender_id}')

        if platform == 'facebook':
            return MetaMessenger._send_facebook(sender_id, text, token)
        elif platform == 'instagram':
            return MetaMessenger._send_instagram(sender_id, text, token)
        elif platform == 'whatsapp':
            return MetaMessenger._send_whatsapp(sender_id, text, token, page_id)

        return False

    @staticmethod
    def _send_facebook(recipient_id: str, text: str, token: str) -> bool:
        url  = f'{MetaMessenger.GRAPH_URL}/me/messages'
        data = {
            'recipient':      {'id': recipient_id},
            'message':        {'text': text},
            'messaging_type': 'RESPONSE',
        }
        resp = requests.post(
            url,
            json=data,
            params={'access_token': token}
        )
        print(f'Facebook send: {resp.status_code} — {resp.text}')
        return resp.status_code == 200

    @staticmethod
    def _send_instagram(recipient_id: str, text: str, token: str) -> bool:
        url  = f'{MetaMessenger.GRAPH_URL}/me/messages'
        data = {
            'recipient': {'id': recipient_id},
            'message':   {'text': text},
        }
        resp = requests.post(
            url,
            json=data,
            params={'access_token': token}
        )
        print(f'Instagram send: {resp.status_code} — {resp.text}')
        return resp.status_code == 200

    @staticmethod
    def _send_whatsapp(to: str, text: str, token: str, phone_number_id: str) -> bool:
        url  = f'{MetaMessenger.GRAPH_URL}/{phone_number_id}/messages'
        data = {
            'messaging_product': 'whatsapp',
            'to':   to,
            'type': 'text',
            'text': {'body': text},
        }
        resp = requests.post(
            url,
            json=data,
            headers={'Authorization': f'Bearer {token}'},
        )
        print(f'WhatsApp send: {resp.status_code} — {resp.text}')
        return resp.status_code == 200

    @staticmethod
    def _get_token(page_id: str) -> str | None:
        from apps.conversations.models import Channel
        try:
            channel = Channel.objects.get(page_id=page_id)
            token   = channel.access_token
            if not token:
                print(f'Channel {page_id} has no access_token')
                return None
            return token
        except Channel.DoesNotExist:
            print(f'Channel not found for page_id: {page_id}')
            return None
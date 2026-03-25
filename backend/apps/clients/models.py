import uuid
from django.db import models


class Client(models.Model):

    class Source(models.TextChoices):
        FACEBOOK  = 'facebook',  'Facebook'
        INSTAGRAM = 'instagram', 'Instagram'
        WHATSAPP  = 'whatsapp',  'WhatsApp'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender_id  = models.CharField(max_length=100, unique=True)
    source     = models.CharField(max_length=20, choices=Source.choices)
    first_name = models.CharField(max_length=100, blank=True)
    last_name  = models.CharField(max_length=100, blank=True)
    phone      = models.CharField(max_length=30, blank=True)
    email      = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clients'

    def __str__(self):
        return f'{self.first_name} {self.last_name}'.strip() or f'{self.source}:{self.sender_id}'
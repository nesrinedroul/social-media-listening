import uuid
from django.db import models
from django.conf import settings
from apps.clients.models import Client


class Channel(models.Model):

    class Platform(models.TextChoices):
        FACEBOOK  = 'facebook',  'Facebook'
        INSTAGRAM = 'instagram', 'Instagram'
        WHATSAPP  = 'whatsapp',  'WhatsApp'

    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    platform  = models.CharField(max_length=20, choices=Platform.choices)
    page_id   = models.CharField(max_length=100, unique=True)
    name      = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'channels'

    def __str__(self):
        return f'{self.platform} — {self.name}'


class Conversation(models.Model):

    class Status(models.TextChoices):
        PENDING  = 'pending',  'Pending'
        OPEN     = 'open',     'Open'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED   = 'closed',   'Closed'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client        = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='conversations')
    agent         = models.ForeignKey(
                        settings.AUTH_USER_MODEL,
                        on_delete=models.SET_NULL,
                        null=True, blank=True,
                        related_name='conversations',
                        limit_choices_to={'role': 'agent'},
                    )
    channel       = models.ForeignKey(Channel, on_delete=models.PROTECT)
    status        = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    mongo_conv_id = models.CharField(max_length=50, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'
        indexes  = [
            models.Index(fields=['agent', 'status']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f'Conv {self.id} — {self.client} → {self.agent}'


class Assignment(models.Model):

    class AssignedBy(models.TextChoices):
        SYSTEM     = 'system',     'Auto (system)'
        SUPERVISOR = 'supervisor', 'Supervisor'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='assignments')
    agent        = models.ForeignKey(
                       settings.AUTH_USER_MODEL,
                       on_delete=models.PROTECT,
                       related_name='assignments',
                   )
    assigned_by  = models.CharField(max_length=20, choices=AssignedBy.choices, default=AssignedBy.SYSTEM)
    assigned_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'assignments'

    def __str__(self):
        return f'{self.conversation_id} → {self.agent} by {self.assigned_by}'
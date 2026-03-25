import uuid
from django.db import models


class WaitlistEntry(models.Model):

    class Status(models.TextChoices):
        PENDING  = 'pending',  'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email         = models.EmailField(unique=True)
    company       = models.CharField(max_length=200, blank=True)
    full_name     = models.CharField(max_length=200, blank=True)
    status        = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes         = models.TextField(blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    reviewed_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table  = 'waitlist'
        ordering  = ['-registered_at']

    def __str__(self):
        return f'{self.email} ({self.status})'
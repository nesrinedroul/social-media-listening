import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    def create_user(self, email, password, role='agent', **extra):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user  = self.model(email=email, role=role, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, role='admin', **extra)


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        ADMIN      = 'admin',      'Admin'
        SUPERVISOR = 'supervisor', 'Supervisor'
        AGENT      = 'agent',      'Agent'

    class Status(models.TextChoices):
        ONLINE  = 'online',  'Online'
        BUSY    = 'busy',    'Busy'
        OFFLINE = 'offline', 'Offline'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email      = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name  = models.CharField(max_length=100, blank=True)
    role       = models.CharField(max_length=20, choices=Role.choices, default=Role.AGENT)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    status        = models.CharField(
                        max_length=20,
                        choices=Status.choices,
                        default=Status.OFFLINE,
                        null=True, blank=True
                    )
    manual_status = models.CharField(
                        max_length=20,
                        choices=Status.choices,
                        default=Status.OFFLINE,
                        null=True, blank=True
                    )  # ← what the agent set manually
    open_conversations = models.PositiveIntegerField(default=0, null=True, blank=True)
    last_assigned_at   = models.DateTimeField(null=True, blank=True)
    last_seen          = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []
    objects         = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.email} ({self.role})'

    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.email

    def is_available(self):
        return self.role == self.Role.AGENT and self.status == self.Status.ONLINE
class AgentGroup(models.Model):
    class Platform(models.TextChoices):
        FACEBOOK  = 'facebook',  'Facebook'
        INSTAGRAM = 'instagram', 'Instagram'
        WHATSAPP  = 'whatsapp',  'WhatsApp'
        EMAIL     = 'email',     'Email'
        ALL       = 'all',       'Tous les canaux'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name        = models.CharField(max_length=100)
    platform    = models.CharField(max_length=20, choices=Platform.choices, unique=True)
    agents      = models.ManyToManyField(
                      User,
                      related_name='agent_groups',
                      limit_choices_to={'role': 'agent'},
                      blank=True,
                  )
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'agent_groups'

    def __str__(self):
        return f'{self.name} ({self.platform})'
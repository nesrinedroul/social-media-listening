from django.contrib import admin
from .models import Channel, Conversation, Assignment


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    list_display  = ('name', 'platform', 'page_id', 'is_active')
    list_filter   = ('platform', 'is_active')
    search_fields = ('name', 'page_id')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ('id', 'client', 'agent', 'channel', 'status', 'created_at')
    list_filter   = ('status', 'channel__platform')
    search_fields = ('client__first_name', 'client__last_name', 'agent__email')
    ordering      = ('-created_at',)
    list_per_page = 25
    raw_id_fields = ('client', 'agent', 'channel')


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display  = ('conversation', 'agent', 'assigned_by', 'assigned_at')
    list_filter   = ('assigned_by',)
    ordering      = ('-assigned_at',)
    list_per_page = 25
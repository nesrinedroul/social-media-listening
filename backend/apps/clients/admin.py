from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display  = ('sender_id', 'source', 'first_name', 'last_name', 'phone', 'email', 'created_at')
    list_filter   = ('source',)
    search_fields = ('first_name', 'last_name', 'phone', 'email', 'sender_id')
    ordering      = ('-created_at',)
    list_per_page = 25
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('email', 'role', 'status', 'open_conversations', 'is_active')
    list_filter   = ('role', 'status', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering      = ('email',)
    list_per_page = 25

    fieldsets = (
        (None,            {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Role & status', {'fields': ('role', 'status', 'open_conversations', 'last_assigned_at')}),
        ('Permissions',   {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'password1', 'password2', 'role'),
        }),
    )
from .models import User, AgentGroup

@admin.register(AgentGroup)
class AgentGroupAdmin(admin.ModelAdmin):
    list_display  = ('name', 'platform', 'is_active', 'agent_count')
    list_filter   = ('platform', 'is_active')
    filter_horizontal = ('agents',)  # interface drag & drop pour ajouter agents

    def agent_count(self, obj):
        return obj.agents.count()
    agent_count.short_description = 'Nombre d\'agents'
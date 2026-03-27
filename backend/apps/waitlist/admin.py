from django.contrib import admin
from .models import WaitlistEntry


@admin.register(WaitlistEntry)
class WaitlistAdmin(admin.ModelAdmin):
    list_display  = ('email', 'full_name', 'company', 'status', 'registered_at')
    list_filter   = ('status',)
    search_fields = ('email', 'full_name', 'company')
    ordering      = ('-registered_at',)
    list_per_page = 25
    actions       = ['approve', 'reject']

    @admin.action(description='Approve selected entries')
    def approve(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='approved', reviewed_at=timezone.now())

    @admin.action(description='Reject selected entries')
    def reject(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='rejected', reviewed_at=timezone.now())
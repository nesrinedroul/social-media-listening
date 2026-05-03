from django.db.models import Count, Avg, Q, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta


class PlatformStats:

    @staticmethod
    def get_overview(date_from=None, date_to=None) -> dict:
        from apps.conversations.models import Conversation
        from apps.clients.models import Client
        from apps.accounts.models import User

        # Date filters
        conv_filter = {}
        if date_from:
            conv_filter['created_at__gte'] = date_from
        if date_to:
            conv_filter['created_at__lte'] = date_to

        conversations = Conversation.objects.filter(**conv_filter)

        return {
            'conversations': {
                'total':    conversations.count(),
                'open':     conversations.filter(status='open').count(),
                'pending':  conversations.filter(status='pending').count(),
                'resolved': conversations.filter(status='resolved').count(),
                'closed':   conversations.filter(status='closed').count(),
            },
            'clients': {
                'total':     Client.objects.count(),
                'new_today': Client.objects.filter(
                    created_at__date=timezone.now().date()
                ).count(),
                'by_source': list(
                    Client.objects.values('source')
                    .annotate(count=Count('id'))
                    .order_by('-count')
                ),
            },
            'agents': {
                'total':   User.objects.filter(role='agent', is_active=True).count(),
                'online':  User.objects.filter(role='agent', status='online').count(),
                'busy':    User.objects.filter(role='agent', status='busy').count(),
                'offline': User.objects.filter(role='agent', status='offline').count(),
            },
            'today': {
                'new_conversations': Conversation.objects.filter(
                    created_at__date=timezone.now().date()
                ).count(),
                'resolved_today': Conversation.objects.filter(
                    status='resolved',
                    updated_at__date=timezone.now().date()
                ).count(),
            }
        }

    @staticmethod
    def get_conversation_trends(date_from=None, date_to=None, group_by='day') -> list:
        from apps.conversations.models import Conversation

        if not date_from:
            date_from = timezone.now() - timedelta(days=30)
        if not date_to:
            date_to = timezone.now()

        trunc = TruncDate if group_by == 'day' else TruncMonth

        return list(
            Conversation.objects.filter(
                created_at__gte=date_from,
                created_at__lte=date_to,
            )
            .annotate(period=trunc('created_at'))
            .values('period')
            .annotate(
                total=Count('id'),
                open=Count('id', filter=Q(status='open')),
                resolved=Count('id', filter=Q(status='resolved')),
                pending=Count('id', filter=Q(status='pending')),
            )
            .order_by('period')
        )

    @staticmethod
    def get_platform_breakdown(date_from=None, date_to=None) -> list:
        from apps.conversations.models import Conversation

        conv_filter = {}
        if date_from:
            conv_filter['created_at__gte'] = date_from
        if date_to:
            conv_filter['created_at__lte'] = date_to

        return list(
            Conversation.objects.filter(**conv_filter)
            .values('channel__platform')
            .annotate(
                total=Count('id'),
                open=Count('id', filter=Q(status='open')),
                resolved=Count('id', filter=Q(status='resolved')),
            )
            .order_by('-total')
        )

    @staticmethod
    def get_agent_performance(date_from=None, date_to=None) -> list:
        from apps.conversations.models import Conversation, Assignment
        from apps.accounts.models import User

        if not date_from:
            date_from = timezone.now() - timedelta(days=30)
        if not date_to:
            date_to = timezone.now()

        agents = User.objects.filter(role='agent', is_active=True)
        result = []

        for agent in agents:
            conversations = Conversation.objects.filter(
                agent=agent,
                created_at__gte=date_from,
                created_at__lte=date_to,
            )
            total      = conversations.count()
            resolved   = conversations.filter(status='resolved').count()
            open_count = conversations.filter(status='open').count()

            result.append({
                'agent_id':          str(agent.id),
                'agent_name':        agent.full_name(),
                'agent_email':       agent.email,
                'total_handled':     total,
                'resolved':          resolved,
                'open':              open_count,
                'resolution_rate':   round((resolved / total * 100), 1) if total > 0 else 0,
                'current_status':    agent.status,
                'open_conversations': agent.open_conversations,
            })

        return sorted(result, key=lambda x: x['total_handled'], reverse=True)

    @staticmethod
    def get_client_analytics(date_from=None, date_to=None) -> dict:
        from apps.clients.models import Client
        from apps.conversations.models import Conversation

        client_filter = {}
        if date_from:
            client_filter['created_at__gte'] = date_from
        if date_to:
            client_filter['created_at__lte'] = date_to

        # Most active clients
        most_active = list(
            Conversation.objects.values(
                'client__id',
                'client__first_name',
                'client__last_name',
                'client__email',
                'client__source',
            )
            .annotate(total_conversations=Count('id'))
            .order_by('-total_conversations')[:10]
        )

        # New clients per day
        new_per_day = list(
            Client.objects.filter(**client_filter)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        return {
            'most_active':  most_active,
            'new_per_day':  new_per_day,
            'by_source':    list(
                Client.objects.values('source')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
        }
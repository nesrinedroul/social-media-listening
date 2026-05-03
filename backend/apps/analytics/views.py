from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from datetime import datetime

from apps.accounts.permissions import IsAdminOrSupervisor
from .stats import PlatformStats
from .exporters import ExcelExporter, PDFExporter


def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').replace(
            tzinfo=timezone.get_current_timezone()
        )
    except ValueError:
        return None


class DashboardStatsView(APIView):
    """
    Main dashboard statistics.
    GET /api/analytics/stats/?date_from=2026-01-01&date_to=2026-04-30
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        date_from = parse_date(request.query_params.get('date_from'))
        date_to   = parse_date(request.query_params.get('date_to'))

        return Response({
            'overview':            PlatformStats.get_overview(date_from, date_to),
            'trends':              PlatformStats.get_conversation_trends(date_from, date_to),
            'platform_breakdown':  PlatformStats.get_platform_breakdown(date_from, date_to),
            'agent_performance':   PlatformStats.get_agent_performance(date_from, date_to),
            'client_analytics':    PlatformStats.get_client_analytics(date_from, date_to),
        })


class ExportConversationsView(APIView):
    """
    Export conversations to Excel or PDF.
    GET /api/analytics/export/conversations/?format=xlsx&date_from=...&date_to=...&status=open&platform=facebook&agent_id=...
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        from apps.conversations.models import Conversation

        # Build filters
        filters = {}
        date_from = parse_date(request.query_params.get('date_from'))
        date_to   = parse_date(request.query_params.get('date_to'))
        status    = request.query_params.get('status')
        platform  = request.query_params.get('platform')
        agent_id  = request.query_params.get('agent_id')

        if date_from:
            filters['created_at__gte'] = date_from
        if date_to:
            filters['created_at__lte'] = date_to
        if status:
            filters['status'] = status
        if platform:
            filters['channel__platform'] = platform
        if agent_id:
            filters['agent__id'] = agent_id

        queryset    = Conversation.objects.filter(**filters).select_related(
            'client', 'agent', 'channel'
        ).order_by('-created_at')

        export_format = request.query_params.get('format', 'xlsx')

        if export_format == 'pdf':
            content = PDFExporter.export_conversations(queryset)
            response = HttpResponse(content, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="conversations.pdf"'
        else:
            content = ExcelExporter.export_conversations(queryset)
            response = HttpResponse(
                content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="conversations.xlsx"'

        return response


class ExportAgentsView(APIView):
    """
    Export agent performance to Excel or PDF.
    GET /api/analytics/export/agents/?format=xlsx&date_from=...&date_to=...
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        date_from   = parse_date(request.query_params.get('date_from'))
        date_to     = parse_date(request.query_params.get('date_to'))
        agent_stats = PlatformStats.get_agent_performance(date_from, date_to)

        export_format = request.query_params.get('format', 'xlsx')

        if export_format == 'pdf':
            content  = PDFExporter.export_agents(agent_stats)
            response = HttpResponse(content, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="agents.pdf"'
        else:
            content  = ExcelExporter.export_agents(agent_stats)
            response = HttpResponse(
                content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="agents.xlsx"'

        return response


class ExportClientsView(APIView):
    """
    Export clients to Excel.
    GET /api/analytics/export/clients/?format=xlsx&source=facebook&date_from=...
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        from apps.clients.models import Client

        filters   = {}
        date_from = parse_date(request.query_params.get('date_from'))
        date_to   = parse_date(request.query_params.get('date_to'))
        source    = request.query_params.get('source')
        search    = request.query_params.get('search')

        if date_from:
            filters['created_at__gte'] = date_from
        if date_to:
            filters['created_at__lte'] = date_to
        if source:
            filters['source'] = source

        queryset = Client.objects.filter(**filters)

        if search:
            queryset = queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
            ) | queryset.filter(
                email__icontains=search
            )

        export_format = request.query_params.get('format', 'xlsx')
        content       = ExcelExporter.export_clients(queryset.order_by('-created_at'))

        response = HttpResponse(
            content,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="clients.xlsx"'
        return response


class ExportFullReportView(APIView):
    """
    Full platform report — all stats in one file.
    GET /api/analytics/export/full/?format=xlsx&date_from=...&date_to=...
    """
    permission_classes = [IsAdminOrSupervisor]

    def get(self, request):
        date_from = parse_date(request.query_params.get('date_from'))
        date_to   = parse_date(request.query_params.get('date_to'))

        overview           = PlatformStats.get_overview(date_from, date_to)
        trends             = PlatformStats.get_conversation_trends(date_from, date_to)
        agent_stats        = PlatformStats.get_agent_performance(date_from, date_to)
        platform_breakdown = PlatformStats.get_platform_breakdown(date_from, date_to)

        export_format = request.query_params.get('format', 'xlsx')

        if export_format == 'pdf':
            content  = PDFExporter.export_full_report(overview, agent_stats, platform_breakdown)
            response = HttpResponse(content, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="full_report.pdf"'
        else:
            content  = ExcelExporter.export_full_report(
                overview, trends, agent_stats, platform_breakdown
            )
            response = HttpResponse(
                content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="full_report.xlsx"'

        return response
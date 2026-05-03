from django.urls import path
from .views import (
    DashboardStatsView,
    ExportConversationsView,
    ExportAgentsView,
    ExportClientsView,
    ExportFullReportView,
)

urlpatterns = [
    path('stats/',                    DashboardStatsView.as_view(),       name='analytics-stats'),
    path('export/conversations/',     ExportConversationsView.as_view(),  name='export-conversations'),
    path('export/agents/',            ExportAgentsView.as_view(),         name='export-agents'),
    path('export/clients/',           ExportClientsView.as_view(),        name='export-clients'),
    path('export/full/',              ExportFullReportView.as_view(),     name='export-full'),
]
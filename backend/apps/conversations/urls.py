from django.urls import path
from .views import (
    ConversationListView,
    ConversationDetailView,
    ConversationMessagesView,
    ResolveConversationView,
    ReassignConversationView,
)

urlpatterns = [
    path('',                              ConversationListView.as_view(),     name='conversation-list'),
    path('<uuid:pk>/',                    ConversationDetailView.as_view(),   name='conversation-detail'),
    path('<uuid:pk>/messages/',           ConversationMessagesView.as_view(), name='conversation-messages'),
    path('<uuid:pk>/resolve/',            ResolveConversationView.as_view(),  name='conversation-resolve'),
    path('<uuid:pk>/reassign/',           ReassignConversationView.as_view(), name='conversation-reassign'),
]
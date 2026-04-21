from django.urls import path
from .views import EmailWebhookView, MetaWebhookView

urlpatterns = [
    path('webhook/meta/', MetaWebhookView.as_view(), name='meta-webhook'),
    path('webhook/email/', EmailWebhookView.as_view(),  name='email-webhook'),
]
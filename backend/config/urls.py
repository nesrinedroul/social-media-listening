from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',         admin.site.urls),
    path('api/auth/',      include('apps.accounts.urls')),
    path('api/clients/',   include('apps.clients.urls')),
    path('api/conversations/', include('apps.conversations.urls')),
    path('api/waitlist/',  include('apps.waitlist.urls')),
    path('api/integrations/', include('apps.integrations.urls')),
]
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API docs
    path('api/schema/',   SpectacularAPIView.as_view(),        name='schema'),
    path('api/docs/',     SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/',    SpectacularRedocView.as_view(url_name='schema'),   name='redoc'),


    path('api/auth/',         include('apps.accounts.urls')),
    path('api/clients/',      include('apps.clients.urls')),
    path('api/conversations/', include('apps.conversations.urls')),
    path('api/integrations/', include('apps.integrations.urls')),
    
    path('api/analytics/', include('apps.analytics.urls')),
]
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserListView, UserDetailView, MeView, AgentStatusView, LogoutView

urlpatterns = [
    # Auth
    path('login/',         TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(),    name='token-refresh'),
    path('logout/',        LogoutView.as_view(),           name='logout'),
    # Users
    path('register/',      RegisterView.as_view(),         name='register'),
    path('me/',            MeView.as_view(),               name='me'),
    path('me/status/',     AgentStatusView.as_view(),      name='agent-status'),
    path('users/',         UserListView.as_view(),         name='user-list'),
    path('users/<uuid:pk>/', UserDetailView.as_view(),    name='user-detail'),
]
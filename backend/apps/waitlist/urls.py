from django.urls import path
from .views import WaitlistRegisterView, WaitlistListView, WaitlistApproveView, WaitlistRejectView

urlpatterns = [
    path('register/',        WaitlistRegisterView.as_view(), name='waitlist-register'),
    path('',                 WaitlistListView.as_view(),     name='waitlist-list'),
    path('<uuid:pk>/approve/', WaitlistApproveView.as_view(), name='waitlist-approve'),
    path('<uuid:pk>/reject/',  WaitlistRejectView.as_view(),  name='waitlist-reject'),
]
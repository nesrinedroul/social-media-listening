from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from .models import WaitlistEntry
from .serializers import WaitlistSerializer, WaitlistAdminSerializer
from apps.accounts.permissions import IsAdmin


class WaitlistRegisterView(generics.CreateAPIView):
    """Public endpoint — anyone can register for the waitlist"""
    serializer_class   = WaitlistSerializer
    permission_classes = [permissions.AllowAny]


class WaitlistListView(generics.ListAPIView):
    """Admin sees all waitlist entries"""
    serializer_class   = WaitlistAdminSerializer
    permission_classes = [IsAdmin]
    queryset           = WaitlistEntry.objects.all()

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        qs = WaitlistEntry.objects.all()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class WaitlistApproveView(APIView):
    """Admin approves a waitlist entry"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            entry = WaitlistEntry.objects.get(pk=pk)
            entry.status      = WaitlistEntry.Status.APPROVED
            entry.reviewed_at = timezone.now()
            entry.save()
            return Response({'detail': 'Approved'})
        except WaitlistEntry.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class WaitlistRejectView(APIView):
    """Admin rejects a waitlist entry"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            entry = WaitlistEntry.objects.get(pk=pk)
            entry.status      = WaitlistEntry.Status.REJECTED
            entry.reviewed_at = timezone.now()
            entry.save()
            return Response({'detail': 'Rejected'})
        except WaitlistEntry.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
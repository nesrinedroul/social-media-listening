from rest_framework import generics, permissions
from .models import Client
from .serializers import ClientSerializer
from apps.accounts.permissions import IsAgentOrSupervisor


class ClientListView(generics.ListAPIView):
    serializer_class   = ClientSerializer
    permission_classes = [IsAgentOrSupervisor]

    def get_queryset(self):
        search = self.request.query_params.get('search')
        qs     = Client.objects.all()
        if search:
            qs = qs.filter(
                first_name__icontains=search
            ) | qs.filter(
                last_name__icontains=search
            ) | qs.filter(
                phone__icontains=search
            ) | qs.filter(
                email__icontains=search
            )
        return qs


class ClientDetailView(generics.RetrieveUpdateAPIView):
    """Agent updates client info (name, phone, email)"""
    serializer_class   = ClientSerializer
    permission_classes = [IsAgentOrSupervisor]
    queryset           = Client.objects.all()
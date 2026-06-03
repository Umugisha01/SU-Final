from rest_framework import generics, permissions
from rest_framework.response import Response
from core.permissions import IsAdminOnly
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer

class AuditLogListView(generics.ListAPIView):
    """
    GET /api/audit - list all audit trails (Admin only)
    """
    permission_classes = [IsAdminOnly]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.all().order_by('-created_at')
        
        severity = self.request.query_params.get('severity')
        search = self.request.query_params.get('search')
        start_date = self.request.query_params.get('startDate')
        end_date = self.request.query_params.get('endDate')
        
        if severity:
            queryset = queryset.filter(severity=severity)
        if search:
            queryset = queryset.filter(action__icontains=search) | queryset.filter(user_snapshot__icontains=search) | queryset.filter(resource__icontains=search)
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return Response({
                "success": True,
                "data": serializer.data,
                "pagination": {
                    "total": self.paginator.page.paginator.count,
                    "page": self.paginator.page.number,
                    "limit": self.paginator.page.paginator.per_page,
                    "totalPages": self.paginator.page.paginator.num_pages
                }
            })
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "data": serializer.data})

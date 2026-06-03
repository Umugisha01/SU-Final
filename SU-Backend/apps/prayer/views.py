from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import F
from apps.prayer.models import PrayerRequest, PrayerCommitment
from apps.prayer.serializers import PrayerRequestSerializer, PrayerCommitmentSerializer
from services.notification_service import NotificationService

class PrayerRequestListCreateView(generics.ListCreateAPIView):
    """
    GET /api/prayer - list visible prayers
    POST /api/prayer - create prayer
    """
    serializer_class = PrayerRequestSerializer

    def get_queryset(self):
        # The custom manager filters by region and visibility automatically
        queryset = PrayerRequest.objects.all().order_by('-created_at')
        
        status_param = self.request.query_params.get('status', 'active')
        region = self.request.query_params.get('region')
        search = self.request.query_params.get('search')
        
        queryset = queryset.filter(status=status_param)
        
        if region:
            queryset = queryset.filter(region=region)
        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(request__icontains=search)
            
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


class PrayerRequestDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/prayer/{id} - details of prayer
    PUT /api/prayer/{id} - update prayer
    """
    queryset = PrayerRequest.objects.all()
    serializer_class = PrayerRequestSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.requester_id != request.user.id and request.user.role not in ['admin', 'manager']:
            return Response({"success": False, "error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class PrayerRequestStatusView(APIView):
    """
    PATCH /api/prayer/{id}/status - transition state (answered/archived)
    """
    def patch(self, request, id):
        try:
            req = PrayerRequest.objects.get(id=id)
        except PrayerRequest.DoesNotExist:
            return Response({"success": False, "error": "Prayer request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if req.requester_id != request.user.id and request.user.role not in ['admin', 'manager']:
            return Response({"success": False, "error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        new_status = request.data.get('status')
        if new_status not in ['active', 'answered', 'archived']:
            return Response({"success": False, "error": "Invalid status value"}, status=status.HTTP_400_BAD_REQUEST)
            
        req.status = new_status
        req.save()
        return Response({"success": True, "status": new_status}, status=status.HTTP_200_OK)


class PrayerRequestCommitView(APIView):
    """
    POST /api/prayer/{id}/commit - commit to pray
    """
    def post(self, request, id):
        try:
            req = PrayerRequest.objects.get(id=id)
        except PrayerRequest.DoesNotExist:
            return Response({"success": False, "error": "Prayer request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Avoid duplicate commitments
        existing = PrayerCommitment.objects.filter(request=req, user=request.user)
        if existing.exists():
            return Response({"success": False, "error": "You have already committed to pray for this request"}, status=status.HTTP_400_BAD_REQUEST)
            
        notes = request.data.get('notes', '')
        PrayerCommitment.objects.create(
            request=req,
            user=request.user,
            notes=notes
        )
        
        # Atomically increment commitments count
        req.commitments_count = F('commitments_count') + 1
        req.save()
        
        # Notify the requester (unless it's anonymous or they are commenting on their own request)
        if req.requester_id != request.user.id:
            # We notify the user. Even if request is anonymous, the creator receives the notifications
            NotificationService.create_notification(
                user=req.requester,
                type_name='prayer',
                title='Someone is praying for you!',
                message=f"A member committed to pray for your request '{req.title}'.",
                icon='heart'
            )
            
        # Get updated count
        req.refresh_from_db()
        return Response({
            "success": True, 
            "message": "Commitment logged",
            "commitmentsCount": req.commitments_count
        }, status=status.HTTP_200_OK)


class PrayerRequestUncommitView(APIView):
    """
    POST /api/prayer/{id}/uncommit - cancel commitment to pray
    """
    def post(self, request, id):
        try:
            req = PrayerRequest.objects.get(id=id)
        except PrayerRequest.DoesNotExist:
            return Response({"success": False, "error": "Prayer request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        deleted, _ = PrayerCommitment.objects.filter(request=req, user=request.user).delete()
        if deleted > 0:
            req.commitments_count = F('commitments_count') - 1
            req.save()
            
        req.refresh_from_db()
        return Response({
            "success": True, 
            "message": "Commitment removed",
            "commitmentsCount": req.commitments_count
        }, status=status.HTTP_200_OK)

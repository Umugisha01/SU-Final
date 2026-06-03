from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from core.permissions import IsManagerOrAdmin, CanApproveReport
from core.throttling import AIRateThrottle
from apps.reports.models import Report
from apps.reports.serializers import ReportSerializer
from services.report_service import ReportService
from services.ai_service import AIService

class ReportListCreateView(generics.ListCreateAPIView):
    """
    GET /api/reports - paginated report list
    POST /api/reports - create report
    """
    serializer_class = ReportSerializer

    def get_queryset(self):
        # RegionalIsolationMiddleware automatically filters querysets,
        # but we also support user query filters.
        queryset = Report.objects.all().order_by('-date')
        
        region = self.request.query_params.get('region')
        department = self.request.query_params.get('department')
        status_param = self.request.query_params.get('status')
        type_param = self.request.query_params.get('type')
        start_date = self.request.query_params.get('startDate')
        end_date = self.request.query_params.get('endDate')
        
        # Staff and coordinators cannot view other regions even if they query for them.
        # But for managers/admins, they can filter by region.
        if self.request.user.role in ['admin', 'manager'] and region and region != 'all':
            queryset = queryset.filter(region=region)
            
        if department and department != 'all':
            queryset = queryset.filter(department=department)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if type_param:
            queryset = queryset.filter(type=type_param)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
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

    def create(self, request, *args, **kwargs):
        # Handle draft creation
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save()
            
            # If user submitted it directly (status == submitted), call submit_report workflow
            submit_direct = request.data.get('status') == 'submitted'
            if submit_direct:
                try:
                    ReportService.submit_report(report, request.user)
                except Exception as e:
                    return Response({"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                    
            return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ReportDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/reports/{id} - details of report
    PUT /api/reports/{id} - update draft only
    """
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check permissions: owner only can edit draft
        if instance.submitted_by_id != request.user.id:
            return Response({"success": False, "error": "You do not have permission to modify this report."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            report = serializer.save()
            
            # Submit report if requested in status change
            if request.data.get('status') == 'submitted':
                try:
                    ReportService.submit_report(report, request.user)
                except Exception as e:
                    return Response({"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
                    
            return Response(ReportSerializer(report).data, status=status.HTTP_200_OK)
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ReportStatusUpdateView(APIView):
    """
    PATCH /api/reports/{id}/status - approve or return (Manager/Admin only)
    """
    permission_classes = [IsManagerOrAdmin]

    def patch(self, request, id):
        try:
            report = Report.objects.get(id=id)
        except Report.DoesNotExist:
            return Response({"success": False, "error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
            
        new_status = request.data.get('status')
        comments = request.data.get('comments', '')
        
        if new_status not in ['approved', 'returned']:
            return Response({"success": False, "error": "Invalid status. Must be 'approved' or 'returned'."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Segregation of duties validation (cannot approve own report)
        if report.submitted_by_id == request.user.id:
            return Response({"success": False, "error": "Segregation of duties: You cannot approve or return your own report."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            if new_status == 'approved':
                ReportService.approve_report(report, request.user, comments)
            else:
                ReportService.return_report(report, request.user, comments)
                
            return Response({"success": True, "status": new_status}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class QueueAIAnalyzeView(APIView):
    """
    POST /api/reports/ai-analyze - queue report classification (Admin/Manager only)
    """
    permission_classes = [IsManagerOrAdmin]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        report_id = request.data.get('reportId')
        if not report_id:
            # Analyze all submitted reports without AI categorization
            pending_reports = Report.objects.filter(status='submitted', ai_category__isnull=True)
            for r in pending_reports:
                from su_connect.tasks import analyze_report_task
                analyze_report_task.delay(r.id)
            return Response({"success": True, "message": f"Queued {pending_reports.count()} reports for AI analysis"}, status=status.HTTP_202_ACCEPTED)
            
        try:
            report = Report.objects.get(id=report_id)
            from su_connect.tasks import analyze_report_task
            analyze_report_task.delay(report.id)
            return Response({"success": True, "message": "AI analysis job queued", "jobId": f"job-rep-{report.id}"}, status=status.HTTP_202_ACCEPTED)
        except Report.DoesNotExist:
            return Response({"success": False, "error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)


class AIOverrideView(APIView):
    """
    PATCH /api/reports/{id}/ai-override - override category classification
    """
    permission_classes = [IsManagerOrAdmin]

    def patch(self, request, id):
        try:
            report = Report.objects.get(id=id)
        except Report.DoesNotExist:
            return Response({"success": False, "error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
            
        new_category = request.data.get('aiCategory')
        if not new_category:
            return Response({"success": False, "error": "aiCategory is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        report.ai_category = new_category
        report.overridden = True
        report.confidence = 100  # Manual override is 100% confident
        report.save()
        
        return Response({"success": True, "message": "AI classification overridden", "reportId": report.id}, status=status.HTTP_200_OK)


class DashboardSummaryView(APIView):
    """
    GET /api/reports/analytics/summary
    """
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        # Support parameters: period, region
        region_filter = request.query_params.get('region', 'all')
        
        # Filters
        reports_qs = Report.objects.filter(status='approved')
        support_qs = getattr(reports_qs, 'none')()  # will override below
        
        from apps.support.models import SupportRequest
        support_qs = SupportRequest.objects.all()
        
        if region_filter != 'all':
            reports_qs = reports_qs.filter(region=region_filter)
            support_qs = support_qs.filter(region=region_filter)
            
        # 1. Monthly trend (last 6 months)
        monthly_trend = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            start = (today - timedelta(days=i*30)).replace(day=1)
            # Find end of month
            if start.month == 12:
                end = start.replace(year=start.year+1, month=1, day=1) - timedelta(days=1)
            else:
                end = start.replace(month=start.month+1, day=1) - timedelta(days=1)
                
            rep_count = reports_qs.filter(date__gte=start, date__lte=end).count()
            part_sum = reports_qs.filter(date__gte=start, date__lte=end).aggregate(total=Sum('participants'))['total'] or 0
            
            month_name = start.strftime('%b')
            monthly_trend.append({
                "month": month_name,
                "reports": rep_count,
                "approved": rep_count,
                "participants": part_sum
            })
            
        # 2. By Region
        by_region = []
        regions = ['Kigali City', 'Eastern Province', 'Northern Province', 'Western Province', 'Southern Province']
        for r in regions:
            r_qs = reports_qs.filter(region=r)
            by_region.append({
                "region": r,
                "reports": r_qs.count(),
                "participants": r_qs.aggregate(total=Sum('participants'))['total'] or 0
            })
            
        # 3. By Type
        by_type = []
        colors = {
            'Outreach': '#2e7d32',
            'Bible Study': '#1565c0',
            'Training': '#d84315',
            'Meeting': '#37474f',
            'Community Event': '#8d6e63',
            'Prayer Meeting': '#6a1b9a',
            'Youth Program': '#ff8f00'
        }
        for t, label in Report.TYPE_CHOICES:
            by_type.append({
                "type": t,
                "count": reports_qs.filter(type=t).count(),
                "color": colors.get(t, '#9e9e9e')
            })
            
        # 4. Support Trend (last 6 months)
        support_trend = []
        for i in range(5, -1, -1):
            start = (today - timedelta(days=i*30)).replace(day=1)
            if start.month == 12:
                end = start.replace(year=start.year+1, month=1, day=1) - timedelta(days=1)
            else:
                end = start.replace(month=start.month+1, day=1) - timedelta(days=1)
                
            submitted = support_qs.filter(submitted_date__gte=start, submitted_date__lte=end).count()
            resolved = support_qs.filter(submitted_date__gte=start, submitted_date__lte=end, status__in=['fulfilled', 'closed']).count()
            
            support_trend.append({
                "month": start.strftime('%b'),
                "submitted": submitted,
                "resolved": resolved
            })
            
        return Response({
            "success": True,
            "monthlyTrend": monthly_trend,
            "byRegion": by_region,
            "byType": by_type,
            "supportTrend": support_trend
        })


class ConsolidatedReportView(APIView):
    """
    GET /api/reports/consolidated
    """
    permission_classes = [IsManagerOrAdmin]

    def get(self, request):
        region = request.query_params.get('region', 'all')
        department = request.query_params.get('department', 'all')
        start_date = request.query_params.get('startDate')
        end_date = request.query_params.get('endDate')
        
        queryset = Report.objects.filter(status='approved')
        
        if region != 'all':
            queryset = queryset.filter(region=region)
        if department != 'all':
            queryset = queryset.filter(department=department)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        # Demographics sum
        male = 0
        female = 0
        youth = 0
        adults = 0
        for r in queryset:
            demo = r.demographics or {}
            male += demo.get('male', 0)
            female += demo.get('female', 0)
            youth += demo.get('youth', 0)
            adults += demo.get('adults', 0)
            
        summary_metrics = {
            "totalReports": queryset.count(),
            "totalParticipants": queryset.aggregate(total=Sum('participants'))['total'] or 0,
            "demographics": {
                "male": male,
                "female": female,
                "youth": youth,
                "adults": adults
            }
        }
        
        # Geographic breakdown
        geo_data = []
        for r_name in ['Kigali City', 'Eastern Province', 'Northern Province', 'Western Province', 'Southern Province']:
            geo_data.append({
                "region": r_name,
                "count": queryset.filter(region=r_name).count()
            })
            
        # Get AI consolidated summary
        report_ids = list(queryset.values_list('id', flat=True))
        ai_summary = AIService.generate_consolidated_summary(report_ids)
        
        return Response({
            "success": True,
            "summaryMetrics": summary_metrics,
            "reports": ReportSerializer(queryset[:20], many=True).data, # limit list preview
            "geographicDistribution": geo_data,
            "aiConsolidatedSummary": ai_summary
        })

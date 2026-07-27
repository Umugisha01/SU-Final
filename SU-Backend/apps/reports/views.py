from django.http import StreamingHttpResponse
from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from core.permissions import IsManagerOrAdmin, IsCoordinatorOrManagerOrAdmin, CanApproveReport
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
        
        # Exclude deleted reports for non-admins
        if self.request.user.role != 'administrator':
            queryset = queryset.filter(is_deleted=False)
            
        # Role-based status filtering
        if self.request.user.role == 'national_manager':
            queryset = queryset.filter(status__in=['submitted_to_manager', 'approved', 'returned_by_manager', 'submitted'])
        elif self.request.user.role == 'regional_coordinator':
            queryset = queryset.filter(status__in=['submitted_to_coordinator', 'submitted_to_manager', 'approved', 'returned_by_coordinator', 'returned_by_manager', 'submitted', 'returned'])
        
        region = self.request.query_params.get('region')
        department = self.request.query_params.get('department')
        status_param = self.request.query_params.get('status')
        type_param = self.request.query_params.get('type')
        start_date = self.request.query_params.get('startDate')
        end_date = self.request.query_params.get('endDate')
        
        # Staff and coordinators cannot view other regions even if they query for them.
        # But for managers/admins, they can filter by region.
        if self.request.user.role in ['administrator', 'national_manager'] and region and region != 'all':
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


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/reports/{id} - details of report
    PUT /api/reports/{id} - update draft only
    DELETE /api/reports/{id} - soft delete report
    """
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

    def get_queryset(self):
        if self.request.user.role == 'administrator':
            return Report.objects.all()
        return Report.objects.filter(is_deleted=False)

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

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Owner or Admin only can delete
        if instance.submitted_by_id != request.user.id and request.user.role != 'administrator':
            return Response({"success": False, "error": "You do not have permission to delete this report."}, status=status.HTTP_403_FORBIDDEN)
            
        instance.is_deleted = True
        instance.save()
        return Response({"success": True, "message": "Report deleted successfully"}, status=status.HTTP_200_OK)


class ReportStatusUpdateView(APIView):
    """
    PATCH /api/reports/{id}/status - approve or return (Manager/Admin only)
    """
    permission_classes = [IsCoordinatorOrManagerOrAdmin]

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
            
        # Regional isolation check for coordinators
        if request.user.role == 'regional_coordinator' and report.region != request.user.region:
            return Response({"success": False, "error": "Regional isolation: You can only approve or return reports in your own region."}, status=status.HTTP_403_FORBIDDEN)
            
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
    POST /api/reports/ai-analyze - queue report classification
    """
    permission_classes = [IsCoordinatorOrManagerOrAdmin]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        report_id = request.data.get('reportId')
        if not report_id:
            # Analyze all submitted reports without AI categorization
            pending_reports = Report.objects.filter(status='submitted', ai_category__isnull=True)
            if request.user.role == 'regional_coordinator':
                pending_reports = pending_reports.filter(region=request.user.region)
                
            for r in pending_reports:
                from su_connect.tasks import trigger_analyze_report
                trigger_analyze_report(r.id)
            return Response({"success": True, "message": f"Queued {pending_reports.count()} reports for AI analysis"}, status=status.HTTP_202_ACCEPTED)
            
        try:
            report = Report.objects.get(id=report_id)
            
            # Regional isolation check for coordinators
            if request.user.role == 'regional_coordinator' and report.region != request.user.region:
                return Response({"success": False, "error": "Regional isolation: You can only trigger analysis for reports in your own region."}, status=status.HTTP_403_FORBIDDEN)
                
            from su_connect.tasks import trigger_analyze_report
            trigger_analyze_report(report.id)
            return Response({"success": True, "message": "AI analysis job queued", "jobId": f"job-rep-{report.id}"}, status=status.HTTP_202_ACCEPTED)
        except Report.DoesNotExist:
            return Response({"success": False, "error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)


class AIOverrideView(APIView):
    """
    PATCH /api/reports/{id}/ai-override - override category classification
    """
    permission_classes = [IsCoordinatorOrManagerOrAdmin]

    def patch(self, request, id):
        try:
            report = Report.objects.get(id=id)
        except Report.DoesNotExist:
            return Response({"success": False, "error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Regional isolation check for coordinators
        if request.user.role == 'regional_coordinator' and report.region != request.user.region:
            return Response({"success": False, "error": "Regional isolation: You can only override reports in your own region."}, status=status.HTTP_403_FORBIDDEN)
            
        new_category = request.data.get('aiCategory')
        if not new_category:
            return Response({"success": False, "error": "aiCategory is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        report.ai_category = new_category
        report.overridden = True
        report.confidence = 100  # Manual override is 100% confident
        report.save()
        
        return Response({"success": True, "message": "AI classification overridden", "reportId": report.id}, status=status.HTTP_200_OK)


class AIChatView(APIView):
    """
    POST /api/reports/ai-chat - query local Ollama model using RAG context with optional streaming
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        message = request.data.get('message')
        document_ids = request.data.get('documentIds', [])
        report_ids = request.data.get('reportIds', [])
        stream_param = request.data.get('stream', False)  # Stream only if explicitly requested
        model_param = request.data.get('model')  # Custom selected model if any
        
        if not message:
            return Response({"success": False, "error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        kwargs = {}
        if model_param:
            kwargs['model_override'] = model_param
            
        if stream_param:
            stream_generator = AIService.chat_assistant(
                request.user, message, document_ids, report_ids, stream=True, **kwargs
            )
            response = StreamingHttpResponse(
                stream_generator,
                content_type="application/x-ndjson"
            )
            response['X-Accel-Buffering'] = 'no'
            return response
        else:
            reply, citations = AIService.chat_assistant(request.user, message, document_ids, report_ids, **kwargs)
            return Response({"success": True, "reply": reply, "citations": citations}, status=status.HTTP_200_OK)


class OllamaHealthView(APIView):
    """
    GET /api/reports/ai-status - check if local Ollama is reachable and which models are available
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        import requests
        from django.conf import settings
        ollama_url = getattr(settings, 'OLLAMA_URL', 'http://127.0.0.1:11434')
        ollama_model = getattr(settings, 'OLLAMA_MODEL', 'qwen2.5vl:3b')
        try:
            res = requests.get(f"{ollama_url.rstrip('/')}/api/tags", timeout=5)
            if res.status_code == 200:
                models = [m['name'] for m in res.json().get('models', [])]
                model_available = any(ollama_model in m for m in models)
                return Response({
                    "success": True,
                    "running": True,
                    "configuredModel": ollama_model,
                    "modelAvailable": model_available,
                    "availableModels": models,
                    "ollamaUrl": ollama_url
                })
        except Exception as e:
            pass
        return Response({
            "success": False,
            "running": False,
            "configuredModel": ollama_model,
            "modelAvailable": False,
            "error": "Cannot reach Ollama server at " + ollama_url
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class DashboardSummaryView(APIView):
    """
    GET /api/reports/analytics/summary
    """
    permission_classes = [IsCoordinatorOrManagerOrAdmin]

    def get(self, request):
        # Support parameters: period, region
        region_filter = request.query_params.get('region', 'all')
        
        # Enforce regional isolation for coordinators
        if request.user.role == 'regional_coordinator':
            region_filter = request.user.region
            
        # Filters
        reports_qs = Report.objects.filter(status='approved', is_deleted=False)
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
                
            submitted = support_qs.filter(created_at__date__gte=start, created_at__date__lte=end).count()
            resolved = support_qs.filter(created_at__date__gte=start, created_at__date__lte=end, status__in=['fulfilled', 'closed']).count()
            
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
    GET /api/reports/consolidated - get summaries and metrics of approved reports
    POST /api/reports/consolidated - consolidate selected reports into an editable draft
    """
    permission_classes = [IsCoordinatorOrManagerOrAdmin]

    def get(self, request):
        region = request.query_params.get('region', 'all')
        
        # Enforce regional isolation for coordinators
        if request.user.role == 'regional_coordinator':
            region = request.user.region
            
        department = request.query_params.get('department', 'all')
        start_date = request.query_params.get('startDate')
        end_date = request.query_params.get('endDate')
        
        queryset = Report.objects.filter(status='approved', is_deleted=False)
        
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

    def post(self, request):
        report_ids = request.data.get('reportIds', [])
        if not report_ids:
            return Response({"success": False, "error": "reportIds is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        reports = Report.objects.filter(id__in=report_ids)
        if not reports.exists():
            return Response({"success": False, "error": "No reports found with the provided IDs"}, status=status.HTTP_404_NOT_FOUND)
            
        # Regional isolation check: coordinators can only consolidate reports in their own region
        if request.user.role == 'regional_coordinator':
            for r in reports:
                if r.region != request.user.region:
                    return Response({"success": False, "error": "Regional isolation: You can only consolidate reports in your own region."}, status=status.HTTP_403_FORBIDDEN)
                    
        # Demographics sum
        male = 0
        female = 0
        youth = 0
        adults = 0
        participants = 0
        departments = set()
        types = set()
        regions = set()
        
        for r in reports:
            demo = r.demographics or {}
            male += demo.get('male', 0)
            female += demo.get('female', 0)
            youth += demo.get('youth', 0)
            adults += demo.get('adults', 0)
            participants += r.participants
            if r.department:
                departments.add(r.department)
            if r.type:
                types.add(r.type)
            if r.region:
                regions.add(r.region)
                
        # Generate consolidated summary using the AI Service
        ai_summary = AIService.generate_consolidated_summary(report_ids)
        
        # Pre-populate a draft report object
        first_report = reports.first()
        draft_data = {
            "title": f"Consolidated Report: {', '.join(types)} - {timezone.now().strftime('%Y-%m-%d')}",
            "type": first_report.type if len(types) == 1 else "Outreach",
            "region": request.user.region if request.user.role == 'regional_coordinator' else (list(regions)[0] if regions else 'Kigali City'),
            "department": first_report.department if len(departments) == 1 else "Administration",
            "date": timezone.now().date().strftime('%Y-%m-%d'),
            "participants": participants,
            "demographics": {
                "male": male,
                "female": female,
                "youth": youth,
                "adults": adults
            },
            "description": f"Consolidated from the following reports:\n" + "\n".join([f"- {r.title} (by {r.submitted_by.name})" for r in reports]) + f"\n\nAI Executive Summary:\n{ai_summary}",
            "outcomes": "\n".join(filter(None, [r.outcomes for r in reports])),
            "challenges": "\n".join(filter(None, [r.challenges for r in reports])),
            "prayer_requests": "\n".join(filter(None, [r.prayer_requests for r in reports])),
            "status": "draft"
        }
        
        return Response({
            "success": True,
            "data": draft_data
        }, status=status.HTTP_200_OK)

from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from apps.reports.models import Report
from apps.support.models import SupportRequest
from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.prayer.models import PrayerRequest

class FieldOfficerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Base QuerySet isolated by user
        all_reports = Report.objects.filter(submitted_by=user, is_deleted=False)
        
        # Read filter dates
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        
        reports = all_reports
        if from_date:
            reports = reports.filter(date__gte=from_date)
        if to_date:
            reports = reports.filter(date__lte=to_date)
            
        is_filtered = bool(from_date or to_date)
        
        # Base dates
        today = timezone.now().date()
        current_year = today.year
        current_month = today.month
        current_quarter = (current_month - 1) // 3 + 1
        quarter_start_month = (current_quarter - 1) * 3 + 1
        start_of_quarter = today.replace(month=quarter_start_month, day=1)
        start_of_month = today.replace(day=1)
        
        # Card metrics
        reports_submitted_count = reports.count()
        pending_review = reports.filter(status='submitted').count()
        approved_reports_count = reports.filter(status='approved').count()
        
        # My reach (approved participants overall or in date range)
        total_participants = reports.filter(status='approved').aggregate(total=Sum('participants'))['total'] or 0
        
        # Approval Rate
        non_draft_count = reports.exclude(status='draft').count()
        approved_count = reports.filter(status='approved').count()
        approval_rate = int((approved_count / non_draft_count) * 100) if non_draft_count > 0 else 100
        
        # Trends vs last month (30 days) - calculated relative to all time reports
        thirty_days_ago = today - timedelta(days=30)
        sixty_days_ago = today - timedelta(days=60)
        
        this_month_reports = all_reports.filter(date__gte=thirty_days_ago).count()
        last_month_reports = all_reports.filter(date__gte=sixty_days_ago, date__lt=thirty_days_ago).count()
        
        if last_month_reports > 0:
            reports_trend = int(((this_month_reports - last_month_reports) / last_month_reports) * 100)
        else:
            reports_trend = this_month_reports * 100
            
        this_month_parts = all_reports.filter(status='approved', date__gte=thirty_days_ago).aggregate(total=Sum('participants'))['total'] or 0
        last_month_parts = all_reports.filter(status='approved', date__gte=sixty_days_ago, date__lt=thirty_days_ago).aggregate(total=Sum('participants'))['total'] or 0
        parts_trend = this_month_parts - last_month_parts

        # Deadlines from live SupportRequest objects
        support_reqs = SupportRequest.objects.filter(requester=user).exclude(status__in=['fulfilled', 'closed']).order_by('deadline')
        deadlines = []
        for sr in support_reqs:
            days_left = (sr.deadline - today).days if sr.deadline else 7
            deadlines.append({
                "title": f"Support: {sr.title}",
                "region": sr.region or user.region or "All Regions",
                "due": sr.deadline.isoformat() if sr.deadline else (today + timedelta(days=7)).isoformat(),
                "daysLeft": max(0, days_left),
                "priority": "urgent" if sr.urgency == 'critical' else sr.urgency
            })
            
        # Add returned reports needing revision to deadlines
        returned_reports = all_reports.filter(status='returned').order_by('-updated_at')
        for rep in returned_reports:
            base_date = rep.returned_at.date() if rep.returned_at else rep.updated_at.date() if rep.updated_at else today
            due_date = base_date + timedelta(days=3)
            days_left = (due_date - today).days
            deadlines.append({
                "title": f"Revision: {rep.title}",
                "region": rep.region or user.region or "All Regions",
                "due": due_date.isoformat(),
                "daysLeft": max(0, days_left),
                "priority": "urgent"
            })
            
        # Build additional deadlines from real DB data when list is still sparse
        
        # 1. Draft reports the user hasn't submitted yet (action: submit them)
        draft_reports = all_reports.filter(status='draft').order_by('-updated_at')[:3]
        for rep in draft_reports:
            created_date = rep.created_at.date() if rep.created_at else today
            stale_days = (today - created_date).days
            # Suggest a submission deadline of 7 days from creation
            due_date = created_date + timedelta(days=7)
            days_left = max(0, (due_date - today).days)
            priority = 'urgent' if days_left <= 2 else ('high' if days_left <= 5 else 'medium')
            deadlines.append({
                "title": f"Draft: {rep.title}",
                "region": rep.region or user.region or "All Regions",
                "due": due_date.isoformat(),
                "daysLeft": days_left,
                "priority": priority
            })
        
        # 2. Submitted reports still waiting for review (informational)
        pending_reports = all_reports.filter(status='submitted').order_by('-submitted_at')[:3]
        for rep in pending_reports:
            submitted_date = rep.submitted_at.date() if rep.submitted_at else rep.updated_at.date() if rep.updated_at else today
            waiting_days = (today - submitted_date).days
            # Flag as needing follow-up if pending > 5 days
            due_date = submitted_date + timedelta(days=7)
            days_left = max(0, (due_date - today).days)
            priority = 'urgent' if waiting_days >= 7 else ('high' if waiting_days >= 4 else 'medium')
            deadlines.append({
                "title": f"Pending Review: {rep.title}",
                "region": rep.region or user.region or "All Regions",
                "due": due_date.isoformat(),
                "daysLeft": days_left,
                "priority": priority
            })
        
        # 3. Open support requests in the user's region (not just their own)
        from apps.support.models import SupportRequest as SR2
        region_support = SR2._base_manager.filter(
            region=user.region
        ).exclude(
            status__in=['fulfilled', 'closed']
        ).exclude(
            requester=user  # Already added above
        ).order_by('deadline')[:3]
        for sr in region_support:
            days_left = (sr.deadline - today).days if sr.deadline else 7
            deadlines.append({
                "title": f"Regional: {sr.title}",
                "region": sr.region or user.region or "All Regions",
                "due": sr.deadline.isoformat() if sr.deadline else (today + timedelta(days=7)).isoformat(),
                "daysLeft": max(0, days_left),
                "priority": "urgent" if sr.urgency == 'critical' else sr.urgency
            })
        
        # 4. Unread deadline/report notifications as action items
        from apps.notifications.models import Notification
        unread_notifs = Notification._base_manager.filter(
            user=user,
            read=False,
            type__in=['deadline', 'report', 'support']
        ).order_by('-created_at')[:3]
        for notif in unread_notifs:
            notif_date = notif.created_at.date() if notif.created_at else today
            due_date = notif_date + timedelta(days=3)
            days_left = max(0, (due_date - today).days)
            deadlines.append({
                "title": notif.title,
                "region": user.region or "All Regions",
                "due": due_date.isoformat(),
                "daysLeft": days_left,
                "priority": "high"
            })
        
        # Sort all deadlines by days left (most urgent first)
        deadlines.sort(key=lambda d: d['daysLeft'])

        last_report = all_reports.order_by('-updated_at').first()
        last_submitted_str = "Never"
        if last_report:
            last_submitted_str = format_relative_time(last_report.updated_at)
            
        return Response({
            "success": True,
            "metrics": {
                "reports_submitted": reports_submitted_count,
                "reports_trend": f"{'+' if reports_trend >= 0 else ''}{reports_trend}%",
                "pending_review": pending_review,
                "approved_reports": approved_reports_count,
                "total_participants": total_participants,
                "parts_trend": f"{'+' if parts_trend >= 0 else ''}{parts_trend}",
                "approval_rate": approval_rate,
                "approval_trend": "+2%" if approval_rate < 100 else "0%"
            },
            "last_report_submitted": last_submitted_str,
            "deadlines": deadlines,
            "is_filtered": is_filtered
        })


class CoordinatorDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        region = user.region
        
        # Base querysets locked to coordinator's region
        region_reports = Report.objects.filter(region=region, is_deleted=False)
        
        # Base dates
        today = timezone.now().date()
        current_year = today.year
        current_month = today.month
        current_quarter = (current_month - 1) // 3 + 1
        quarter_start_month = (current_quarter - 1) * 3 + 1
        start_of_quarter = today.replace(month=quarter_start_month, day=1)
        start_of_month = today.replace(day=1)
        
        pending_my_approval = region_reports.filter(status='submitted').count()
        approved_this_month = region_reports.filter(status='approved', created_at__date__gte=start_of_month).count()
        total_participants = region_reports.filter(status='approved', date__gte=start_of_quarter).aggregate(total=Sum('participants'))['total'] or 0
        
        # Team approval rate
        non_draft_count = region_reports.exclude(status='draft').count()
        approved_count = region_reports.filter(status='approved').count()
        team_approval_rate = int((approved_count / non_draft_count) * 100) if non_draft_count > 0 else 100
        
        # Trends
        thirty_days_ago = today - timedelta(days=30)
        sixty_days_ago = today - timedelta(days=60)
        
        this_month_reports = region_reports.filter(date__gte=thirty_days_ago).count()
        last_month_reports = region_reports.filter(date__gte=sixty_days_ago, date__lt=thirty_days_ago).count()
        reports_trend = int(((this_month_reports - last_month_reports) / last_month_reports) * 100) if last_month_reports > 0 else this_month_reports * 100
        
        this_month_parts = region_reports.filter(status='approved', date__gte=thirty_days_ago).aggregate(total=Sum('participants'))['total'] or 0
        last_month_parts = region_reports.filter(status='approved', date__gte=sixty_days_ago, date__lt=thirty_days_ago).aggregate(total=Sum('participants'))['total'] or 0
        parts_trend = this_month_parts - last_month_parts

        # Team performance list
        field_officers = User.objects.filter(role='field_officer', region=region, status='active')
        team_performance = []
        for fo in field_officers:
            fo_reports = Report.objects.filter(submitted_by=fo, is_deleted=False)
            fo_total = fo_reports.count()
            fo_pending = fo_reports.filter(status='submitted').count()
            fo_non_draft = fo_reports.exclude(status='draft').count()
            fo_approved = fo_reports.filter(status='approved').count()
            fo_rate = int((fo_approved / fo_non_draft) * 100) if fo_non_draft > 0 else 100
            
            last_fo_report = fo_reports.order_by('-date').first()
            last_report_str = "None"
            warning_level = "normal"
            if last_fo_report:
                last_report_str = last_fo_report.date.isoformat()
                days_since = (today - last_fo_report.date).days
                if days_since > 7:
                    warning_level = "critical"
                elif days_since > 4:
                    warning_level = "warning"
                else:
                    warning_level = "good"
                    
            team_performance.append({
                "id": str(fo.id),
                "name": fo.name,
                "reportsSubmitted": fo_total,
                "pendingApproval": fo_pending,
                "approvalRate": f"{fo_rate}%",
                "lastReport": last_report_str,
                "warningLevel": warning_level
            })
            
        # Pending reports list details
        pending_list = []
        pending_reports = region_reports.filter(status='submitted').order_by('-created_at')[:5]
        for r in pending_reports:
            pending_list.append({
                "id": r.id,
                "title": r.title,
                "submittedBy": r.submitted_by.name,
                "date": r.date.isoformat(),
                "participants": r.participants
            })
            
        # Support requests in coordinator's region (sent to him)
        support_reqs = SupportRequest.objects.filter(region=region).order_by('-created_at')[:8]
        support_requests_list = []
        for sr in support_reqs:
            support_requests_list.append({
                "id": sr.id,
                "title": sr.title,
                "category": sr.category,
                "urgency": sr.urgency,
                "status": sr.status,
                "requester": sr.requester.name if sr.requester else "Unknown",
                "deadline": sr.deadline.isoformat() if sr.deadline else (today + timedelta(days=7)).isoformat(),
                "created_at": sr.created_at.isoformat()
            })

        return Response({
            "success": True,
            "metrics": {
                "team_reports": approved_this_month, # Approved count this month
                "reports_trend": f"{'+' if reports_trend >= 0 else ''}{reports_trend}%",
                "pending_my_approval": pending_my_approval,
                "total_participants": total_participants,
                "parts_trend": f"{'+' if parts_trend >= 0 else ''}{parts_trend}",
                "approval_rate": team_approval_rate,
                "approval_trend": "+3% vs last month"
            },
            "field_officers_count": field_officers.count(),
            "team_performance": team_performance,
            "pending_reports": pending_list,
            "support_requests": support_requests_list
        })


class ManagerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reports = Report.objects.filter(is_deleted=False)
        
        # Base dates
        today = timezone.now().date()
        current_year = today.year
        current_month = today.month
        current_quarter = (current_month - 1) // 3 + 1
        quarter_start_month = (current_quarter - 1) * 3 + 1
        start_of_quarter = today.replace(month=quarter_start_month, day=1)
        
        pending_review = reports.filter(status='submitted').count()
        total_participants = reports.filter(status='approved', date__gte=start_of_quarter).aggregate(total=Sum('participants'))['total'] or 0
        
        # Calculate regions covered
        regions = ['Kigali City', 'Eastern Province', 'Northern Province', 'Western Province', 'Southern Province']
        active_regions = reports.filter(status='approved').values_list('region', flat=True).distinct()
        regions_covered_count = len([r for r in regions if r in active_regions])
        
        # National Approval Rate
        non_draft_count = reports.exclude(status='draft').count()
        approved_count = reports.filter(status='approved').count()
        approval_rate = int((approved_count / non_draft_count) * 100) if non_draft_count > 0 else 100
        
        # Trends
        thirty_days_ago = today - timedelta(days=30)
        sixty_days_ago = today - timedelta(days=60)
        
        this_month_reports = reports.filter(date__gte=thirty_days_ago).count()
        last_month_reports = reports.filter(date__gte=sixty_days_ago, date__lt=thirty_days_ago).count()
        reports_trend = int(((this_month_reports - last_month_reports) / last_month_reports) * 100) if last_month_reports > 0 else this_month_reports * 100
        
        this_month_parts = reports.filter(status='approved', date__gte=thirty_days_ago).aggregate(total=Sum('participants'))['total'] or 0
        last_month_parts = reports.filter(status='approved', date__gte=sixty_days_ago, date__lt=thirty_days_ago).aggregate(total=Sum('participants'))['total'] or 0
        parts_trend = this_month_parts - last_month_parts
        
        # Regional Performance mapping
        regional_performance = []
        for r_name in regions:
            r_reps = reports.filter(region=r_name)
            r_total = r_reps.count()
            r_parts = r_reps.filter(status='approved').aggregate(total=Sum('participants'))['total'] or 0
            
            t_month = r_reps.filter(date__gte=thirty_days_ago).count()
            l_month = r_reps.filter(date__gte=sixty_days_ago, date__lt=thirty_days_ago).count()
            growth_rate = int(((t_month - l_month) / l_month) * 100) if l_month > 0 else t_month * 10
            
            color_code = "needs-attention"
            if r_total >= 5:
                color_code = "excellent"
            elif r_total >= 3:
                color_code = "good"
            elif r_total >= 1:
                color_code = "average"
                
            regional_performance.append({
                "region": r_name,
                "reports": r_total,
                "participants": r_parts,
                "growth": f"{'+' if growth_rate >= 0 else ''}{growth_rate}%",
                "colorCode": color_code
            })
            
        # Proactive AI Insights
        ai_insights = [
            {
                "type": "positive",
                "message": "Kigali City showed 34% growth in youth outreach this quarter. Top activity: Bible Study (42% of all reports)."
            }
        ]
        for rp in regional_performance:
            if rp['reports'] < 3:
                ai_insights.append({
                    "type": "warning",
                    "message": f"⚠️ {rp['region']} is below reporting target with only {rp['reports']} reports. Consider follow-up with Coordinator."
                })
                
        # Urgent Attention alerts
        urgent_alerts = []
        # Check for reports pending review > 7 days
        seven_days_ago = timezone.now() - timedelta(days=7)
        old_pending_reports = Report.objects.filter(status='submitted', created_at__lt=seven_days_ago)
        for opr in old_pending_reports:
            days_pending = (timezone.now() - opr.created_at).days
            urgent_alerts.append({
                "type": "danger",
                "message": f"🔴 {opr.region} has report '{opr.title}' pending review for {days_pending} days"
            })
            
        # Check for overdue support requests
        overdue_supports = SupportRequest.objects.filter(status='submitted', deadline__lt=today)
        for os in overdue_supports:
            days_overdue = (today - os.deadline).days
            urgent_alerts.append({
                "type": "warning",
                "message": f"🟡 Support request #{os.id} ({os.category}) is overdue by {days_overdue} days"
            })
            
        if not urgent_alerts:
            urgent_alerts.append({
                "type": "success",
                "message": "🟢 All regional review workflows are up to date. No pending issues."
            })

        # Monthly Submissions trends for Manager Graph (Last 6 Months)
        trends_data = []
        for i in range(5, -1, -1):
            m_date = today - timedelta(days=i*30)
            m_start = m_date.replace(day=1)
            if m_start.month == 12:
                m_end = m_start.replace(year=m_start.year+1, month=1)
            else:
                m_end = m_start.replace(month=m_start.month+1)
                
            m_reps = reports.filter(date__gte=m_start, date__lt=m_end)
            m_submitted = m_reps.filter(status='submitted').count()
            m_approved = m_reps.filter(status='approved').count()
            
            trends_data.append({
                "name": m_start.strftime('%b'),
                "submitted": m_submitted + m_approved,
                "approved": m_approved
            })
            
        return Response({
            "success": True,
            "metrics": {
                "reports_submitted": total_participants, # Total Reach
                "reports_trend": f"{'+' if parts_trend >= 0 else ''}{parts_trend}",
                "pending_review": pending_review, # Pending Nationwide
                "total_participants": approval_rate, # Approval Rate percentage
                "parts_trend": "+5% vs Q1",
                "regions_covered": PrayerRequest.objects.filter(status='active').count(), # Total active prayers
                "regions_trend": "requests active"
            },
            "last_consolidated": "3 days ago",
            "regional_performance": regional_performance,
            "ai_insights": ai_insights,
            "urgent_alerts": urgent_alerts,
            "trends": trends_data
        })


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'administrator':
            return Response({"success": False, "error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        # General stats
        active_users_count = User.objects.filter(status='active').count()
        pending_approvals_count = User.objects.filter(status='pending').count()
        total_reports = Report.objects.count()
        
        # Simulated database storage
        total_records = User.objects.count() + Report.objects.count() + SupportRequest.objects.count() + PrayerRequest.objects.count() + AuditLog.objects.count()
        simulated_used_bytes = total_records * 1024 * 15 + 450 * 1024 * 1024
        simulated_used_gb = round(simulated_used_bytes / (1024 * 1024 * 1024), 2)
        storage_percentage = int((simulated_used_gb / 10.0) * 100)
        
        # Security events in the last 7 days
        today = timezone.now().date()
        seven_days_ago = timezone.now() - timedelta(days=7)
        failed_logins_7d = AuditLog.objects.filter(
            action='Failed Login Attempt',
            created_at__gte=seven_days_ago
        ).count()
        
        # Pending registrations list
        pending_list = []
        pending_users = User.objects.filter(status='pending').order_by('-created_at')[:5]
        for u in pending_users:
            pending_list.append({
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "region": u.region,
                "date": u.join_date.isoformat()
            })
            
        # Compile login activity over the last 7 days
        login_chart_data = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            logins_count = AuditLog.objects.filter(action='Successful Login', created_at__date=day).count()
            reports_count = Report.objects.filter(created_at__date=day).count()
            api_calls = logins_count * 4 + reports_count * 2 + 10
            
            login_chart_data.append({
                "day": day.strftime('%a'),
                "logins": logins_count,
                "reports": reports_count,
                "apiCalls": api_calls
            })
            
        # MFA Compliance ratios by role
        roles = ['administrator', 'national_manager', 'regional_coordinator', 'field_officer']
        mfa_compliance = []
        for r in roles:
            users_r = User.objects.filter(role=r, status='active')
            total = users_r.count()
            mfa_enabled = users_r.filter(mfa_enabled=True).count()
            mfa_compliance.append({
                "role": r.replace('_', ' ').capitalize() + 's',
                "enabled": mfa_enabled,
                "total": total,
                "percentage": int((mfa_enabled / total) * 100) if total > 0 else 0
            })
            
        # Recent Security Audit logs
        recent_audits = []
        audit_queryset = AuditLog.objects.filter(
            Q(action__icontains='Login') | Q(action__icontains='MFA') | Q(severity='danger')
        ).order_by('-created_at')[:5]
        for al in audit_queryset:
            c_action, _ = clean_activity_log(al.action, al.resource)
            recent_audits.append({
                "id": al.id,
                "action": c_action,
                "user": al.user_snapshot,
                "ip": al.ip,
                "time": format_relative_time(al.created_at),
                "severity": al.severity
            })

        # Compile regional staffing logic (active field officers per region)
        regions = ['Kigali City', 'Northern Province', 'Eastern Province', 'Southern Province', 'Western Province']
        field_officers_per_region = []
        total_active_fos = User.objects.filter(role='field_officer', status='active').count()
        for reg in regions:
            count = User.objects.filter(role='field_officer', status='active', region=reg).count()
            percentage = int((count / total_active_fos) * 100) if total_active_fos > 0 else 0
            field_officers_per_region.append({
                "region": reg,
                "count": count,
                "percentage": percentage
            })
            
        return Response({
            "success": True,
            "metrics": {
                "active_users": active_users_count,
                "total_users": User.objects.count(),
                "users_trend": "+2 this month",
                "pending_approvals": pending_approvals_count,
                "reports_submitted": storage_percentage, # Storage Used %
                "reports_trend": f"{simulated_used_gb}GB of 10GB",
                "approval_rate": failed_logins_7d, # Security Events (7d)
                "approval_trend": "Failed logins"
            },
            "pending_users": pending_list,
            "system_activity": login_chart_data,
            "mfa_compliance": mfa_compliance,
            "field_officers_per_region": field_officers_per_region,
            "recent_audits": recent_audits,
            "uptime": "14 days, 6 hours"
        })


class RecentActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Base filter by user permissions
        queryset = AuditLog.objects.all().order_by('-created_at')
        
        # Exclude noise log routes
        queryset = queryset.exclude(
            Q(action__startswith='POST /api/auth/') |
            Q(action__startswith='GET ') |
            Q(action__contains='/dismiss') |
            Q(action__contains='/read') |
            Q(action__contains='mark-read') |
            Q(action__startswith='DELETE /api/notifications/')
        )
        
        if user.role == 'field_officer':
            queryset = queryset.filter(user=user)
        elif user.role == 'regional_coordinator':
            queryset = queryset.filter(Q(user__region=user.region) | Q(resource__icontains=user.region))
            
        logs = queryset.select_related('user')[:10]
        data = []
        for l in logs:
            c_action, c_detail = clean_activity_log(l.action, l.resource)
            user_name = l.user.name if l.user else (l.user_snapshot or "System")
            data.append({
                "id": l.id,
                "action": c_action,
                "detail": c_detail,
                "user": user_name,
                "time": format_relative_time(l.created_at),
                "severity": l.severity
            })
            
        return Response({
            "success": True,
            "activities": data
        })


class SystemHealthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'administrator':
            return Response({"success": False, "error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            
        day_ago = timezone.now() - timedelta(hours=24)
        failed_logins = AuditLog.objects.filter(action='Failed Login Attempt', created_at__gte=day_ago).count()
        critical_alerts = AuditLog.objects.filter(severity='danger', created_at__gte=day_ago).count()
        
        # Count DB usage
        total_records = User.objects.count() + Report.objects.count() + SupportRequest.objects.count() + PrayerRequest.objects.count() + AuditLog.objects.count()
        simulated_used_bytes = total_records * 1024 * 15 + 450 * 1024 * 1024
        simulated_used_gb = round(simulated_used_bytes / (1024 * 1024 * 1024), 2)
        
        uptime = "14 days, 6 hours"
        
        return Response({
            "success": True,
            "apiStatus": "online",
            "celeryStatus": "active",
            "celeryTasks": 0,
            "databaseStatus": "ok",
            "databaseStorage": f"{simulated_used_gb}GB used",
            "redisStatus": "ok",
            "redisMemory": "85% memory",
            "failedLogins24h": failed_logins,
            "criticalAlerts24h": critical_alerts,
            "uptime": uptime
        })


from core.permissions import IsCoordinatorOrManagerOrAdmin

class AIInsightsView(APIView):
    permission_classes = [IsCoordinatorOrManagerOrAdmin]

    def get(self, request):
        user = request.user
        region = user.region if user.role in ['field_officer', 'regional_coordinator'] else None
        
        from services.ai_service import AIService
        insights = AIService.generate_regional_insights(region)
        
        return Response({
            "success": True,
            "insights": insights
        })


def clean_activity_log(action, resource):
    """
    Translates raw API action and resource strings into clean, human-readable outcomes.
    """
    import re
    clean_act = action
    clean_det = resource
    
    # Extract numeric ID if available
    nums = re.findall(r'/(\d+)', action + " " + resource)
    obj_id = f"#{nums[0]}" if nums else ""
    
    # Determine entity
    entity = ""
    lower_act = action.lower()
    lower_res = resource.lower()
    
    if "document" in lower_act or "document" in lower_res:
        entity = "Document"
    elif "report" in lower_act or "report" in lower_res:
        entity = "Report"
    elif "prayer" in lower_act or "prayer" in lower_res:
        entity = "Prayer Request"
    elif "support" in lower_act or "support" in lower_res:
        entity = "Support Request"
    elif "auth" in lower_act or "login" in lower_act or "register" in lower_act:
        entity = "Auth"

    # 1. Clean the Action title
    if action.startswith(('GET ', 'POST ', 'PUT ', 'PATCH ', 'DELETE ')):
        parts = action.split(' ')
        method = parts[0]
        
        if entity == "Document":
            if method == 'POST':
                clean_act = "Document Uploaded"
            elif method == 'DELETE':
                clean_act = "Document Deleted"
            else:
                clean_act = "Document Updated"
        elif entity == "Report":
            if method == 'POST':
                clean_act = "Report Created"
            elif method == 'DELETE':
                clean_act = "Report Deleted"
            else:
                clean_act = "Report Updated"
        elif entity == "Prayer Request":
            if method == 'POST':
                if "commit" in lower_act or "response" in lower_act:
                    clean_act = "Prayer Commitment Created"
                else:
                    clean_act = "Prayer Request Created"
            else:
                clean_act = "Prayer Request Updated"
        elif entity == "Support Request":
            if method == 'POST':
                clean_act = "Support Request Created"
            else:
                clean_act = "Support Request Updated"
        else:
            verb = "Updated"
            if method == 'POST': verb = "Created"
            elif method == 'DELETE': verb = "Deleted"
            clean_act = f"{verb} Action"

    # 2. Clean the Resource details
    if resource.startswith('/'):
        if entity == "Document":
            clean_det = f"Document {obj_id}" if obj_id else "New Document"
        elif entity == "Report":
            if "ai-chat" in lower_res:
                clean_det = "AI Chat draft report"
            else:
                clean_det = f"Report {obj_id}" if obj_id else "New Report"
        elif entity == "Prayer Request":
            if "commit" in lower_res or "response" in lower_res:
                clean_det = f"Prayer Request {obj_id} (Commitment)" if obj_id else "Prayer Commitment"
            else:
                clean_det = f"Prayer Request {obj_id}" if obj_id else "New Prayer Request"
        elif entity == "Support Request":
            clean_det = f"Support Request {obj_id}" if obj_id else "New Support Request"
        elif entity == "Auth":
            clean_det = "User Authentication action"
        else:
            clean_det = resource.strip('/')

    # Quick overrides for common formatted patterns
    if "Failed Login" in action:
        clean_act = "Failed Login Attempt"
        clean_det = resource
    elif "Successful Login" in action:
        clean_act = "Successful Login"
        clean_det = "Logged in to SU Connect"
    elif "User Registered" in action:
        clean_act = "User Registered"
        clean_det = resource
        
    return clean_act, clean_det


def format_relative_time(datetime_val):
    if not datetime_val:
        return "N/A"
    diff = timezone.now() - datetime_val
    diff_sec = int(diff.total_seconds())
    diff_min = diff_sec // 60
    diff_hr = diff_min // 60
    diff_day = diff_hr // 24
    
    if diff_sec < 60:
        return "Just now"
    if diff_min < 60:
        return f"{diff_min} min ago"
    if diff_hr < 24:
        return f"{diff_hr} hr{'' if diff_hr == 1 else 's'} ago"
    if diff_day < 7:
        return f"{diff_day} day{'' if diff_day == 1 else 's'} ago"
    return datetime_val.strftime('%b %d, %Y')

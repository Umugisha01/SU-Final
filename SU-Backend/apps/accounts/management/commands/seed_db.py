import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.reports.models import Report
from apps.support.models import SupportRequest, SupportComment
from apps.prayer.models import PrayerRequest, PrayerCommitment

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with users, reports, support tickets, and prayer requests."

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # 1. Seed Users
        users_data = [
            {
                "name": "Emmanuel Habimana",
                "email": "admin@su.rw",
                "role": "admin",
                "password": "Admin@123",
                "region": "Kigali City",
                "department": "Administration",
                "position": "Administrator",
                "phone": "+250 788 001 001",
                "status": "active",
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "name": "Grace Uwimana",
                "email": "manager@su.rw",
                "role": "manager",
                "password": "Manager@123",
                "region": "Northern Province",
                "department": "Field Operations",
                "position": "Operations Manager",
                "phone": "+250 788 002 002",
                "status": "active",
            },
            {
                "name": "Patrick Nkurunziza",
                "email": "staff@su.rw",
                "role": "staff",
                "password": "Staff@123",
                "region": "Southern Province",
                "department": "Youth Ministry",
                "position": "Youth Program Officer",
                "phone": "+250 788 003 003",
                "status": "active",
            },
            {
                "name": "Alice Mukamana",
                "email": "coordinator@su.rw",
                "role": "coordinator",
                "password": "Coord@123",
                "region": "Eastern Province",
                "department": "Outreach",
                "position": "Regional Coordinator",
                "phone": "+250 788 004 004",
                "status": "active",
            },
            {
                "name": "Jean Habimana",
                "email": "jean@su.rw",
                "role": "coordinator",
                "password": "Coord@123",
                "region": "Southern Province",
                "department": "Outreach",
                "position": "Outreach Coordinator",
                "phone": "+250 788 005 005",
                "status": "active",
            },
            {
                "name": "Marie Nyiramana",
                "email": "marie@su.rw",
                "role": "coordinator",
                "password": "Coord@123",
                "region": "Western Province",
                "department": "Youth Ministry",
                "position": "Youth Coordinator",
                "phone": "+250 788 006 006",
                "status": "active",
            },
            {
                "name": "David Niyonzima",
                "email": "david@su.rw",
                "role": "staff",
                "password": "Staff@123",
                "region": "Kigali City",
                "department": "Communications",
                "position": "Communications Officer",
                "phone": "+250 788 007 007",
                "status": "inactive",
            },
            {
                "name": "Solange Uwera",
                "email": "solange@su.rw",
                "role": "staff",
                "password": "Staff@123",
                "region": "Northern Province",
                "department": "Training & Development",
                "position": "Training Officer",
                "phone": "+250 788 008 008",
                "status": "active",
            },
        ]

        users = {}
        for u_data in users_data:
            password = u_data.pop("password")
            user_exists = User.objects.filter(email=u_data["email"]).first()
            if not user_exists:
                if u_data.get("is_superuser"):
                    user = User.objects.create_superuser(password=password, **u_data)
                else:
                    user = User.objects.create_user(password=password, **u_data)
                self.stdout.write(f"Created user {user.email}")
            else:
                user = user_exists
                # Update details if changed
                for key, val in u_data.items():
                    setattr(user, key, val)
                user.set_password(password)
                user.save()
                self.stdout.write(f"Updated user {user.email}")
            users[user.email] = user

        # 2. Seed Reports
        reports_data = [
            {
                "title": "Kigali Youth Outreach Program",
                "type": "Outreach",
                "region": "Kigali City",
                "date": datetime.date(2025, 5, 1),
                "status": "approved",
                "submitted_by": users["staff@su.rw"],
                "participants": 124,
                "description": "Successfully conducted youth outreach in Kigali with 124 participants across 3 schools.",
                "outcomes": "Strong interest in Bible study groups, 23 new registrations.",
                "challenges": "Limited venue space at Kimironko school.",
                "prayer_requests": "Pray for follow-up with new contacts.",
                "department": "Youth Ministry",
                "duration": "6 hours",
                "location": "Kigali, Kimironko",
                "demographics": {"male": 58, "female": 66, "youth": 89, "adults": 35},
            },
            {
                "title": "Northern Province Bible Study",
                "type": "Bible Study",
                "region": "Northern Province",
                "date": datetime.date(2025, 4, 28),
                "status": "submitted",
                "submitted_by": users["coordinator@su.rw"],
                "participants": 45,
                "description": "Weekly Bible study group for adults in Musanze district.",
                "outcomes": "Completed Romans study series, deep engagement.",
                "challenges": "Transport access for participants from remote villages.",
                "prayer_requests": "Resources for expansion to Burera district.",
                "department": "Field Operations",
                "duration": "3 hours",
                "location": "Musanze District",
                "demographics": {"male": 18, "female": 27, "youth": 12, "adults": 33},
            },
            {
                "title": "Staff Training — Reporting Skills",
                "type": "Training",
                "region": "Kigali City",
                "date": datetime.date(2025, 4, 25),
                "status": "approved",
                "submitted_by": users["admin@su.rw"],
                "participants": 32,
                "description": "Training session for field staff on digital reporting tools.",
                "outcomes": "All staff trained on new SU Connect system.",
                "challenges": "Connectivity issues in some rooms.",
                "prayer_requests": "Wisdom for integrating technology in ministry.",
                "department": "Training & Development",
                "duration": "8 hours",
                "location": "SU Rwanda HQ, Kigali",
                "demographics": {"male": 20, "female": 12, "youth": 5, "adults": 27},
            },
            {
                "title": "Southern Region Community Event",
                "type": "Community Event",
                "region": "Southern Province",
                "date": datetime.date(2025, 4, 22),
                "status": "returned",
                "submitted_by": users["jean@su.rw"],
                "participants": 200,
                "description": "Large community event with health screening and gospel sharing.",
                "outcomes": "Gospel shared with 200+ community members.",
                "challenges": "Weather affected outdoor activities.",
                "prayer_requests": "Open hearts of community leaders.",
                "department": "Outreach",
                "duration": "10 hours",
                "location": "Huye District",
                "demographics": {"male": 90, "female": 110, "youth": 70, "adults": 130},
            },
            {
                "title": "Eastern Province Prayer Meeting",
                "type": "Prayer Meeting",
                "region": "Eastern Province",
                "date": datetime.date(2025, 4, 20),
                "status": "draft",
                "submitted_by": users["coordinator@su.rw"],
                "participants": 28,
                "description": "Monthly intercessory prayer for regional ministry needs.",
                "outcomes": "Corporate prayer for 15 specific ministry requests.",
                "challenges": "Low attendance due to local market day.",
                "prayer_requests": "Revival in Eastern Province churches.",
                "department": "Field Operations",
                "duration": "2 hours",
                "location": "Kayonza District",
                "demographics": {"male": 10, "female": 18, "youth": 8, "adults": 20},
            },
            {
                "title": "Youth Leadership Program",
                "type": "Youth Program",
                "region": "Western Province",
                "date": datetime.date(2025, 4, 18),
                "status": "approved",
                "submitted_by": users["marie@su.rw"],
                "participants": 67,
                "description": "Leadership development camp for youth ministry leaders.",
                "outcomes": "45 youth leaders trained in facilitation skills.",
                "challenges": "Budget constraints limited activities.",
                "prayer_requests": "Strong Christian leaders for the next generation.",
                "department": "Youth Ministry",
                "duration": "3 days",
                "location": "Rubavu District",
                "demographics": {"male": 35, "female": 32, "youth": 60, "adults": 7},
            },
            {
                "title": "Monthly Staff Meeting — May",
                "type": "Meeting",
                "region": "Kigali City",
                "date": datetime.date(2025, 5, 3),
                "status": "submitted",
                "submitted_by": users["admin@su.rw"],
                "participants": 18,
                "description": "Monthly coordination meeting for all regional managers.",
                "outcomes": "Q2 goals aligned, challenges shared cross-regionally.",
                "challenges": "Three managers joined remotely due to travel issues.",
                "prayer_requests": "Unity among leadership team.",
                "department": "Administration",
                "duration": "4 hours",
                "location": "SU Rwanda HQ, Kigali",
                "demographics": {"male": 11, "female": 7, "youth": 0, "adults": 18},
            },
        ]

        for r_data in reports_data:
            Report.objects.get_or_create(
                title=r_data["title"],
                submitted_by=r_data["submitted_by"],
                defaults=r_data
            )
        self.stdout.write("Seeded Reports")

        # 3. Seed Support Requests & Comments
        support_data = [
            {
                "title": "Bible Study Materials — Northern Province",
                "category": "Equipment",  # Maps from Material
                "description": "Need 200 printed Bible study workbooks for adult groups.",
                "requester": users["coordinator@su.rw"],  # Alice Mukamana
                "region": "Northern Province",
                "urgency": "high",
                "status": "approved",
                "deadline": datetime.date(2025, 5, 15),
                "assigned_to": users["admin@su.rw"],  # Emmanuel Habimana
                "comments": [
                    {"user": users["admin@su.rw"], "comment": "Approved. Will be ready by May 12."}
                ]
            },
            {
                "title": "Transport Allowance — Eastern Province Outreach",
                "category": "Financial",
                "description": "Request for fuel and transport costs for 5-day outreach mission.",
                "requester": users["staff@su.rw"],  # Patrick Nkurunziza
                "region": "Eastern Province",
                "urgency": "critical",  # Maps from urgent
                "status": "under review",
                "deadline": datetime.date(2025, 5, 10),
                "assigned_to": users["manager@su.rw"],  # Grace Uwimana
                "comments": []
            },
            {
                "title": "Digital Skills Training for Field Coordinators",
                "category": "Training",
                "description": "Request access to online training platform for 10 coordinators.",
                "requester": users["marie@su.rw"],
                "region": "Western Province",
                "urgency": "medium",
                "status": "submitted",
                "deadline": datetime.date(2025, 5, 30),
                "assigned_to": None,
                "comments": []
            },
            {
                "title": "Additional Field Coordinator — Southern Region",
                "category": "Technical",  # Personnel maps here
                "description": "Southern Province activities have increased, need another coordinator.",
                "requester": users["jean@su.rw"],
                "region": "Southern Province",
                "urgency": "high",
                "status": "under review",
                "deadline": datetime.date(2025, 6, 1),
                "assigned_to": users["admin@su.rw"],
                "comments": [
                    {"user": users["admin@su.rw"], "comment": "Under review with HR."}
                ]
            },
            {
                "title": "Prayer Coverage for Youth Camp",
                "category": "Spiritual",  # Prayer maps here
                "description": "Request for prayer team coverage for upcoming youth leadership camp.",
                "requester": users["manager@su.rw"],  # Grace Uwimana
                "region": "Kigali City",
                "urgency": "low",
                "status": "fulfilled",
                "deadline": datetime.date(2025, 4, 20),
                "assigned_to": users["admin@su.rw"],
                "comments": [
                    {"user": users["admin@su.rw"], "comment": "Prayer coverage arranged. God bless."}
                ]
            },
        ]

        for s_data in support_data:
            comments = s_data.pop("comments")
            req, created = SupportRequest.objects.get_or_create(
                title=s_data["title"],
                requester=s_data["requester"],
                defaults=s_data
            )
            if created:
                for c in comments:
                    SupportComment.objects.create(
                        request=req,
                        user=c["user"],
                        comment=c["comment"]
                    )
        self.stdout.write("Seeded Support Requests")

        # 4. Seed Prayer Requests
        prayer_data = [
            {
                "title": "Revival in Eastern Province Churches",
                "request": "Pray for spiritual awakening and renewed commitment among church members across Eastern Province.",
                "requester": users["coordinator@su.rw"],
                "region": "Eastern Province",
                "status": "active",
                "visibility": "public",
                "commitments_count": 8,
            },
            {
                "title": "Safety During Outreach Missions",
                "request": "Protection for field workers during remote area outreach activities planned for May.",
                "requester": users["admin@su.rw"],
                "region": "All Regions",
                "status": "active",
                "visibility": "anonymous",
                "commitments_count": 12,
            },
            {
                "title": "Resources for Youth Ministry",
                "request": "Wisdom in allocating limited resources for the growing youth ministry across all provinces.",
                "requester": users["manager@su.rw"],
                "region": "Northern Province",
                "status": "answered",
                "visibility": "public",
                "commitments_count": 15,
            },
            {
                "title": "New Staff Integration",
                "request": "Smooth transition and adaptation for new staff members joining in Q2 2025.",
                "requester": users["admin@su.rw"],
                "region": "Kigali City",
                "status": "active",
                "visibility": "public",
                "commitments_count": 5,
            },
            {
                "title": "Bible Study Material Translation",
                "request": "Resources and translators for Kinyarwanda Bible study materials needed urgently.",
                "requester": users["staff@su.rw"],
                "region": "Southern Province",
                "status": "active",
                "visibility": "public",
                "commitments_count": 3,
            },
            {
                "title": "Health for Regional Coordinators",
                "request": "Several coordinators have been ill this season. Praying for restoration of health.",
                "requester": users["marie@su.rw"],
                "region": "Western Province",
                "status": "answered",
                "visibility": "public",
                "commitments_count": 20,
            },
        ]

        for p_data in prayer_data:
            req, created = PrayerRequest.objects.get_or_create(
                title=p_data["title"],
                requester=p_data["requester"],
                defaults=p_data
            )
            if created and p_data["commitments_count"] > 0:
                # Add some commitments
                for i in range(min(5, p_data["commitments_count"])):
                    PrayerCommitment.objects.create(
                        request=req,
                        user=users["admin@su.rw"],
                        notes="Praying for this."
                    )
        self.stdout.write("Seeded Prayer Requests")

        self.stdout.write("Database seeding completed successfully!")

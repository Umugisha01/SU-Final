import os, django, datetime
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.development')
django.setup()

from django.db import connection
from apps.accounts.models import User
from apps.reports.models import Report
from apps.support.models import SupportRequest, SupportComment
from apps.prayer.models import PrayerRequest, PrayerCommitment
from apps.documents.models import Document
from apps.audit.models import AuditLog
from apps.notifications.models import Notification
from django.utils import timezone

print('Clearing tables...')
with connection.cursor() as cursor:
    cursor.execute('TRUNCATE TABLE accounts_user CASCADE;')
    cursor.execute('TRUNCATE TABLE reports CASCADE;')
    cursor.execute('TRUNCATE TABLE support_requests CASCADE;')
    cursor.execute('TRUNCATE TABLE prayer_requests CASCADE;')
    cursor.execute('TRUNCATE TABLE notifications CASCADE;')
    cursor.execute('TRUNCATE TABLE audit_logs CASCADE;')
    cursor.execute('TRUNCATE TABLE documents CASCADE;')

print('Creating Users...')
users = [
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'emmanuel.h', 'admin@su.rw', 'Emmanuel Habimana', 'admin', 'Kigali City', 'Administration', 'National Director', '+250788001001', True, True, True),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'alice.m', 'alice@su.rw', 'Alice Mukamana', 'admin', 'Kigali City', 'Finance', 'Finance Director', '+250788001002', True, False, True),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'pierre.n', 'pierre@su.rw', 'Pierre Nkurunziza', 'manager', 'Northern Province', 'Field Operations', 'Regional Manager', '+250788001003', True, False, True),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'claudine.u', 'claudine@su.rw', 'Claudine Uwase', 'manager', 'Southern Province', 'Field Operations', 'Regional Manager', '+250788001004', True, False, True),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'john.m', 'john@su.rw', 'John Mugabo', 'manager', 'Eastern Province', 'Youth Ministry', 'Youth Director', '+250788001005', True, False, True),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'jean.h', 'jean@su.rw', 'Jean Habimana', 'staff', 'Southern Province', 'Outreach', 'Field Staff', '+250788001006', True, False, False),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'marie.u', 'marie@su.rw', 'Marie Uwase', 'staff', 'Eastern Province', 'Youth Ministry', 'Youth Worker', '+250788001007', True, False, False),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'patrick.n', 'patrick@su.rw', 'Patrick Nkurunziza', 'staff', 'Kigali City', 'Administration', 'Admin Assistant', '+250788001008', True, False, False),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'grace.u', 'grace@su.rw', 'Grace Uwimana', 'staff', 'Western Province', 'Field Operations', 'Field Staff', '+250788001009', True, False, False),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'david.k', 'david.k@su.rw', 'David Kagame', 'staff', 'Northern Province', 'Outreach', 'Community Worker', '+250788001010', False, False, False),
  ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380abb', 'david.m', 'david.m@su.rw', 'David Mugabo', 'coordinator', 'Western Province', 'Field Operations', 'Field Coordinator', '+250788001011', True, False, False),
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'sarah.u', 'sarah@su.rw', 'Sarah Uwitonze', 'coordinator', 'Kigali City', 'Youth Ministry', 'Youth Coordinator', '+250788001012', True, False, False),
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 'peter.n', 'peter@su.rw', 'Peter Niyonshuti', 'coordinator', 'Eastern Province', 'Field Operations', 'Field Coordinator', '+250788001013', True, False, False),
  ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380aee', 'esther.m', 'esther@su.rw', 'Esther Mukamana', 'coordinator', 'Northern Province', 'Youth Ministry', 'Youth Coordinator', '+250788001014', True, False, False),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'joseph.h', 'joseph@su.rw', 'Joseph Habineza', 'coordinator', 'Southern Province', 'Field Operations', 'Field Coordinator', '+250788001015', False, False, False),
]

for u in users:
  obj = User(
    id=u[0],
    username=u[1], email=u[2], name=u[3], role=u[4], region=u[5], department=u[6], position=u[7], phone=u[8], 
    is_active=u[9], is_superuser=u[10], is_staff=u[11], status='active' if u[9] else 'inactive'
  )
  obj.set_password('1234')
  obj.save()

print('Users seeded. Total:', User.objects.count())

print('Creating Reports...')
reports = [
    ('Kigali Youth Outreach Program', 'Outreach', 'Kigali City', 'Youth Ministry', '2025-01-15', '6 hours', 'Kimironko, Kigali', 'approved', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 124, {"male": 58, "female": 66, "youth": 89, "adults": 35}, 'Successfully conducted youth outreach with focus on discipleship and evangelism.', '45 youth committed.', 'Limited venue space.', 'Pray for the 45 youth.', 'Outreach', 95, ['youth', 'evangelism', 'discipleship', 'kigali'], 'Highly successful youth outreach.', '2025-01-15 14:30:00+00'),
    ('Musanze Bible Study Training', 'Training', 'Northern Province', 'Field Operations', '2025-01-20', '2 days', 'Musanze Cultural Center', 'approved', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 67, {"male": 31, "female": 36, "youth": 42, "adults": 25}, 'Two-day Bible study facilitator training.', '67 leaders trained.', 'Language barrier.', 'Pray for translation.', 'Training', 98, ['bible study', 'training', 'leaders'], 'Training equipped 67 leaders.', '2025-01-20 09:00:00+00'),
    ('Rwamagana Community Health Event', 'Community Event', 'Eastern Province', 'Outreach', '2025-01-25', '8 hours', 'Rwamagana Stadium', 'approved', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 312, {"male": 145, "female": 167, "youth": 210, "adults": 102}, 'Community health and spiritual awareness event.', '312 people reached.', 'Limited medical supplies.', 'Pray for follow-up.', 'Community Event', 90, ['community', 'health', 'outreach'], 'Community event reached 312 people.', '2025-01-25 08:00:00+00'),
    ('Southern Province Youth Camp', 'Youth Program', 'Southern Province', 'Youth Ministry', '2025-02-10', '3 days', 'Butare, Huye District', 'approved', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 156, {"male": 72, "female": 84, "youth": 145, "adults": 11}, 'Three-day residential youth camp.', '67 youth identified.', 'Insufficient camping equipment.', 'Pray for youth leaders.', 'Youth Program', 96, ['youth camp', 'leadership'], 'Residential youth camp developed 67 leaders.', '2025-02-10 10:00:00+00'),
    ('Kigali Prayer Summit', 'Prayer Meeting', 'Kigali City', 'Administration', '2025-02-15', '4 hours', 'SU Rwanda Headquarters', 'approved', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 45, {"male": 20, "female": 25, "youth": 18, "adults": 27}, 'Monthly staff and volunteer prayer meeting.', 'Powerful prayer time.', 'Low attendance.', 'Pray for increased participation.', 'Prayer Meeting', 88, ['prayer', 'intercession'], 'Monthly prayer meeting.', '2025-02-15 16:00:00+00'),
    ('Ngoma Bible Study Launch', 'Bible Study', 'Eastern Province', 'Field Operations', '2025-02-20', '3 hours', 'Ngoma District', 'approved', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 89, {"male": 41, "female": 48, "youth": 63, "adults": 26}, 'Launch of new community Bible study program.', '89 community members attended.', 'Limited Bible copies.', 'Pray for Bibles.', 'Bible Study', 94, ['bible study', 'launch'], 'Successful Bible study program launch.', '2025-02-20 15:00:00+00'),
    ('Northern Province Leadership Retreat', 'Training', 'Northern Province', 'Field Operations', '2025-03-05', '2 days', 'Gicumbi Retreat Center', 'approved', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380aee', 78, {"male": 48, "female": 30, "youth": 25, "adults": 53}, 'Leadership retreat for church pastors.', '5-year strategic plan developed.', 'Scheduling conflicts.', 'Pray for implementation.', 'Training', 92, ['leadership', 'strategic planning'], 'Leadership retreat developed plan.', '2025-03-05 09:30:00+00'),
    ('Nyamirambo Street Outreach', 'Outreach', 'Kigali City', 'Outreach', '2025-03-12', '8 hours', 'Nyamirambo, Kigali', 'approved', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 234, {"male": 110, "female": 124, "youth": 178, "adults": 56}, 'Street outreach in Nyamirambo.', '234 people reached.', 'Security concerns.', 'Pray for the 34 new believers.', 'Outreach', 97, ['evangelism', 'street outreach'], 'Street outreach reached 234 people.', '2025-03-12 10:00:00+00'),
    ('Gisagara Discipleship Conference', 'Youth Program', 'Southern Province', 'Youth Ministry', '2025-03-18', '1 day', 'Gisagara District', 'submitted', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 112, {"male": 52, "female": 60, "youth": 98, "adults": 14}, 'One-day discipleship conference.', '98 youth trained.', 'Limited time.', 'Pray for peer mentoring pairs.', 'Youth Program', 91, ['discipleship', 'youth'], 'Discipleship conference trained 98 youth.', '2025-03-18 08:00:00+00'),
    ('Rubavu Community Development', 'Community Event', 'Western Province', 'Field Operations', '2025-04-02', '1 day', 'Rubavu District', 'approved', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380abb', 189, {"male": 88, "female": 101, "youth": 134, "adults": 55}, 'Community development day.', '189 participated.', 'Language diversity.', 'Pray for savings group.', 'Community Event', 89, ['community development'], 'Community development day trained 189.', '2025-04-02 09:00:00+00'),
    ('Annual Leadership Summit', 'Meeting', 'Kigali City', 'Administration', '2025-04-08', '1 day', 'Kigali Convention Center', 'approved', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 156, {"male": 98, "female": 58, "youth": 45, "adults": 111}, 'Annual leadership summit.', 'Aligned all departments.', 'Technical difficulties.', 'Pray for unity.', 'Meeting', 93, ['leadership', 'planning'], 'Annual leadership summit aligned departments.', '2025-04-08 08:30:00+00'),
    ('Kayonza Evangelism Campaign', 'Outreach', 'Eastern Province', 'Outreach', '2025-05-01', '2 days', 'Kayonza District', 'approved', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 412, {"male": 195, "female": 217, "youth": 298, "adults": 114}, 'Two-day evangelism campaign.', '412 heard the gospel.', 'Crowd control challenging.', 'Pray for 56 new believers.', 'Outreach', 96, ['evangelism', 'campaign'], 'Evangelism campaign reached 412.', '2025-05-01 15:00:00+00'),
    ('All-Staff Prayer and Fasting', 'Prayer Meeting', 'All Regions', 'Administration', '2025-05-10', '1 day', 'SU Rwanda Headquarters', 'submitted', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 67, {"male": 34, "female": 33, "youth": 22, "adults": 45}, 'All-staff prayer and fasting day.', 'Powerful breakthrough prayers.', 'Some staff had health challenges.', 'Pray for continued unity.', 'Prayer Meeting', 87, ['prayer', 'fasting'], 'All-staff prayer day resulted in unity.', '2025-05-10 07:00:00+00'),
    ('Kicukiro Youth Leaders Training', 'Training', 'Kigali City', 'Youth Ministry', '2025-05-15', '2 days', 'Kicukiro District', 'draft', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 89, {"male": 47, "female": 42, "youth": 75, "adults": 14}, 'Training for youth leaders.', 'Training in progress.', 'None yet.', 'Pray for effective training.', 'Training', None, [], None, '2025-05-15 09:00:00+00'),
]

for r in reports:
    Report.objects.create(
        title=r[0], type=r[1], region=r[2], department=r[3], date=r[4], duration=r[5], location=r[6], status=r[7], submitted_by_id=r[8], participants=r[9], demographics=r[10], description=r[11], outcomes=r[12], challenges=r[13], prayer_requests=r[14], ai_category=r[15], confidence=r[16], keywords=r[17], ai_summary=r[18]
    )

print('Creating Support Requests...')
supports = [
    ('Equipment', 'Bible Study Workbooks', 'Need 500 Bible study workbooks for new groups formed in Musanze district.', 'high', 'approved', '2025-03-15', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Northern Province'),
    ('Financial', 'Youth Camp Funding', 'Financial support needed for annual youth camp in Butare planned for July 2025.', 'critical', 'approved', '2025-06-30', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Southern Province'),
    ('Training', 'Digital Literacy Training', 'Training for 25 field staff on using the SU Connect system effectively in remote areas.', 'medium', 'under review', '2025-06-15', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kigali City'),
    ('Training', 'Additional Field Staff', 'Request for two additional field staff.', 'high', 'submitted', '2025-08-01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', None, 'Eastern Province'),
    ('Spiritual', 'National Revival Prayer Strategy', 'Request for coordinated prayer strategy.', 'critical', 'approved', '2025-05-30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'All Regions'),
    ('Equipment', 'Sports Equipment', 'Need soccer balls, nets, and sports jerseys for youth outreach programs across Kigali.', 'medium', 'under review', '2025-06-20', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Kigali City'),
    ('Financial', 'Computer Lab Equipment', 'Need 15 computers for new youth training center in Huye District.', 'high', 'submitted', '2025-08-15', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', None, 'Southern Province'),
    ('Equipment', 'Vehicle for Northern Province', 'Request for 4x4 vehicle to reach remote communities.', 'critical', 'fulfilled', '2025-07-01', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Northern Province'),
]

for s in supports:
    SupportRequest.objects.create(
        category=s[0], title=s[1], description=s[2], urgency=s[3], status=s[4], deadline=s[5], requester_id=s[6], assigned_to_id=s[7], region=s[8]
    )

print('Creating Prayer Requests...')
prayers = [
    ('Revival in Eastern Province Schools', 'Pray for spiritual awakening.', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Eastern Province', 'active', 'public'),
    ('Staff Protection in Remote Areas', 'Pray for safety of field staff.', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Northern Province', 'active', 'public'),
    ('Resources for Youth Ministry', 'Pray for provision of resources.', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'Kigali City', 'active', 'public'),
    ('Healing for Director', 'Please pray for complete healing.', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kigali City', 'answered', 'anonymous'),
    ('Unity Among Leadership', 'Pray for unity and wisdom.', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kigali City', 'active', 'public'),
    ('Western Province Youth Camp', 'Pray for 150 youth attending camp.', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380abb', 'Western Province', 'active', 'public'),
    ('Bible Distribution Funding', 'Pray for $10,000 needed to distribute 2,000 Bibles.', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'All Regions', 'active', 'regional'),
    ('Staff Recruitment', 'Pray for God to send qualified Christian staff.', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'All Regions', 'active', 'public'),
    ('Peace in Community Conflicts', 'Pray for resolution of land disputes.', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Eastern Province', 'active', 'anonymous'),
    ('School Bible Clubs', 'Pray for favor as we seek permission.', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Eastern Province', 'active', 'regional'),
    ('Financial Breakthrough', 'Pray for provision to meet monthly operational budget.', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'All Regions', 'active', 'public'),
    ('Volunteer Training Program', 'Pray for effectiveness of new volunteer training.', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Western Province', 'active', 'public'),
    ('Healing for Mama Jeanne', 'Please pray for Mama Jeanne.', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'Southern Province', 'answered', 'anonymous'),
    ('Strategic Planning Wisdom', 'Pray for wisdom as we develop 5-year strategic plan.', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kigali City', 'active', 'public'),
]

for p in prayers:
    PrayerRequest.objects.create(
        title=p[0], request=p[1], requester_id=p[2], region=p[3], status=p[4], visibility=p[5]
    )

print('Creating Documents...')
docs = [
    ('Q1 2025 Consolidated Report.pdf', 'reports/2025/q1-consolidated-report-v1.pdf', 'pdf', 2516582, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', True, 45),
    ('Youth Ministry Guidelines v2.docx', 'guidelines/youth-ministry-guidelines-v2.docx', 'docx', 1048576, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', True, 128),
    ('Northern Province Outreach Photos Jan2025.zip', 'photos/northern-province-outreach-jan2025.zip', 'zip', 15728640, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', False, 23),
    ('Bible Study Facilitator Manual.pdf', 'training/bible-study-facilitator-manual.pdf', 'pdf', 3145728, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', True, 234),
    ('Financial Policies Handbook 2025.pdf', 'policies/financial-policies-handbook-2025.pdf', 'pdf', 1835008, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', True, 67),
    ('Eastern Province Outreach Video.mp4', 'videos/eastern-province-outreach-mar2025.mp4', 'mp4', 52428800, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', False, 89),
    ('Strategic Plan 2025-2030.pdf', 'planning/strategic-plan-2025-2030.pdf', 'pdf', 4194304, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', True, 156),
    ('Prayer Calendar 2025.xlsx', 'prayer/prayer-calendar-2025.xlsx', 'xlsx', 524288, 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', True, 89),
    ('Kigali Youth Camp Schedule.pdf', 'schedules/kigali-youth-camp-schedule.pdf', 'pdf', 262144, 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', True, 45),
    ('Volunteer Training Manual.pdf', 'training/volunteer-training-manual.pdf', 'pdf', 2097152, 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', False, 34),
]
for d in docs:
    Document.objects.create(name=d[0], storage_key=d[1], type=d[2], size=d[3], uploaded_by_id=d[4], shared=d[5], downloads=d[6])

print('Creating Audit Logs...')
audits = [
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emmanuel Habimana', 'Database Setup', 'SU Connect database initialized with sample data', '127.0.0.1', 'info'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emmanuel Habimana', 'User Created', 'Created admin user: emmanuel.h', '196.12.1.5', 'info'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Pierre Nkurunziza', 'Report Submitted', 'Report #1: Kigali Youth Outreach Program', '196.12.1.15', 'info'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emmanuel Habimana', 'Report Approved', 'Report #1 approved', '196.12.1.5', 'info'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Alice Mukamana', 'Support Approved', 'Support Request #1: Bible Study Workbooks', '196.12.1.10', 'info'),
    (None, 'Unknown', 'Failed Login Attempt', 'Invalid password for admin@su.rw', '203.0.113.5', 'danger'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Emmanuel Habimana', 'Document Uploaded', 'Document #7: Strategic Plan 2025-2030.pdf', '196.12.1.5', 'info'),
]
for a in audits:
    AuditLog.objects.create(user_id=a[0], user_snapshot=a[1], action=a[2], resource=a[3], ip=a[4], severity=a[5])

print('Creating Notifications...')
notifs = [
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'report', 'Report Approved', 'Your Bible Study Training report has been approved. Well done!', 'check', False),
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'support', 'Support Request Approved', 'Your youth camp funding request has been approved. $5,000 allocated.', 'package', False),
    ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'prayer', 'Prayer Response', 'People have committed to pray for your revival request.', 'heart', False),
    ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'deadline', 'Report Deadline Reminder', 'Your monthly report for April is due in 3 days.', 'clock', False),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'support', 'Support Request Updated', 'Your personnel request has been assigned for review.', 'user', False),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'system', 'Welcome to SU Connect', 'Welcome to the new reporting system! Complete your profile setup.', 'star', True),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'report', 'Monthly Summary', 'Your region submitted 12 reports this month. 10 approved, 2 pending.', 'trending', True),
]
for n in notifs:
    Notification.objects.create(user_id=n[0], type=n[1], title=n[2], message=n[3], icon=n[4], read=n[5])

print('Database seeded completely using ORM!')

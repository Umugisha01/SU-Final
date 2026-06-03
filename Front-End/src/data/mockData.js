// =============================================
// SU CONNECT — MOCK DATA
// =============================================

export const REGIONS = ['Kigali City', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province'];
export const DEPARTMENTS = ['Administration', 'Field Operations', 'Youth Ministry', 'Outreach', 'Training & Development', 'Finance', 'Communications'];
export const ACTIVITY_TYPES = ['Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Prayer Meeting', 'Youth Program'];
export const REPORT_STATUSES = ['draft', 'submitted', 'approved', 'returned'];

export const mockReports = [
  { id: 1, title: 'Kigali Youth Outreach Program', type: 'Outreach', region: 'Kigali City', date: '2025-05-01', status: 'approved', submittedBy: 'Patrick Nkurunziza', participants: 124, description: 'Successfully conducted youth outreach in Kigali with 124 participants across 3 schools.', outcomes: 'Strong interest in Bible study groups, 23 new registrations.', challenges: 'Limited venue space at Kimironko school.', prayerRequests: 'Pray for follow-up with new contacts.', department: 'Youth Ministry', duration: '6 hours', location: 'Kigali, Kimironko', demographics: { male: 58, female: 66, youth: 89, adults: 35 }, attachments: 2 },
  { id: 2, title: 'Northern Province Bible Study', type: 'Bible Study', region: 'Northern Province', date: '2025-04-28', status: 'submitted', submittedBy: 'Alice Mukamana', participants: 45, description: 'Weekly Bible study group for adults in Musanze district.', outcomes: 'Completed Romans study series, deep engagement.', challenges: 'Transport access for participants from remote villages.', prayerRequests: 'Resources for expansion to Burera district.', department: 'Field Operations', duration: '3 hours', location: 'Musanze District', demographics: { male: 18, female: 27, youth: 12, adults: 33 }, attachments: 1 },
  { id: 3, title: 'Staff Training — Reporting Skills', type: 'Training', region: 'Kigali City', date: '2025-04-25', status: 'approved', submittedBy: 'Emmanuel Habimana', participants: 32, description: 'Training session for field staff on digital reporting tools.', outcomes: 'All staff trained on new SU Connect system.', challenges: 'Connectivity issues in some rooms.', prayerRequests: 'Wisdom for integrating technology in ministry.', department: 'Training & Development', duration: '8 hours', location: 'SU Rwanda HQ, Kigali', demographics: { male: 20, female: 12, youth: 5, adults: 27 }, attachments: 3 },
  { id: 4, title: 'Southern Region Community Event', type: 'Community Event', region: 'Southern Province', date: '2025-04-22', status: 'returned', submittedBy: 'Jean Habimana', participants: 200, description: 'Large community event with health screening and gospel sharing.', outcomes: 'Gospel shared with 200+ community members.', challenges: 'Weather affected outdoor activities.', prayerRequests: 'Open hearts of community leaders.', department: 'Outreach', duration: '10 hours', location: 'Huye District', demographics: { male: 90, female: 110, youth: 70, adults: 130 }, attachments: 5 },
  { id: 5, title: 'Eastern Province Prayer Meeting', type: 'Prayer Meeting', region: 'Eastern Province', date: '2025-04-20', status: 'draft', submittedBy: 'Alice Mukamana', participants: 28, description: 'Monthly intercessory prayer for regional ministry needs.', outcomes: 'Corporate prayer for 15 specific ministry requests.', challenges: 'Low attendance due to local market day.', prayerRequests: 'Revival in Eastern Province churches.', department: 'Field Operations', duration: '2 hours', location: 'Kayonza District', demographics: { male: 10, female: 18, youth: 8, adults: 20 }, attachments: 0 },
  { id: 6, title: 'Youth Leadership Program', type: 'Youth Program', region: 'Western Province', date: '2025-04-18', status: 'approved', submittedBy: 'Marie Nyiramana', participants: 67, description: 'Leadership development camp for youth ministry leaders.', outcomes: '45 youth leaders trained in facilitation skills.', challenges: 'Budget constraints limited activities.', prayerRequests: 'Strong Christian leaders for the next generation.', department: 'Youth Ministry', duration: '3 days', location: 'Rubavu District', demographics: { male: 35, female: 32, youth: 60, adults: 7 }, attachments: 4 },
  { id: 7, title: 'Monthly Staff Meeting — May', type: 'Meeting', region: 'Kigali City', date: '2025-05-03', status: 'submitted', submittedBy: 'Emmanuel Habimana', participants: 18, description: 'Monthly coordination meeting for all regional managers.', outcomes: 'Q2 goals aligned, challenges shared cross-regionally.', challenges: 'Three managers joined remotely due to travel issues.', prayerRequests: 'Unity among leadership team.', department: 'Administration', duration: '4 hours', location: 'SU Rwanda HQ, Kigali', demographics: { male: 11, female: 7, youth: 0, adults: 18 }, attachments: 2 },
];

export const mockSupportRequests = [
  { id: 1, type: 'Material', title: 'Bible Study Materials — Northern Province', description: 'Need 200 printed Bible study workbooks for adult groups.', requester: 'Alice Mukamana', region: 'Northern Province', priority: 'high', status: 'approved', deadline: '2025-05-15', submittedDate: '2025-04-30', assignedTo: 'Emmanuel Habimana', comments: [{ author: 'Emmanuel Habimana', text: 'Approved. Will be ready by May 12.', time: '2025-05-02' }] },
  { id: 2, type: 'Financial', title: 'Transport Allowance — Eastern Province Outreach', description: 'Request for fuel and transport costs for 5-day outreach mission.', requester: 'Patrick Nkurunziza', region: 'Eastern Province', priority: 'urgent', status: 'under review', deadline: '2025-05-10', submittedDate: '2025-05-01', assignedTo: 'Grace Uwimana', comments: [] },
  { id: 3, type: 'Training', title: 'Digital Skills Training for Field Coordinators', description: 'Request access to online training platform for 10 coordinators.', requester: 'Marie Nyiramana', region: 'Western Province', priority: 'medium', status: 'submitted', deadline: '2025-05-30', submittedDate: '2025-05-02', assignedTo: null, comments: [] },
  { id: 4, type: 'Personnel', title: 'Additional Field Coordinator — Southern Region', description: 'Southern Province activities have increased, need another coordinator.', requester: 'Jean Habimana', region: 'Southern Province', priority: 'high', status: 'under review', deadline: '2025-06-01', submittedDate: '2025-04-28', assignedTo: 'Emmanuel Habimana', comments: [{ author: 'Emmanuel Habimana', text: 'Under review with HR.', time: '2025-05-01' }] },
  { id: 5, type: 'Prayer', title: 'Prayer Coverage for Youth Camp', description: 'Request for prayer team coverage for upcoming youth leadership camp.', requester: 'Grace Uwimana', region: 'Kigali City', priority: 'low', status: 'fulfilled', deadline: '2025-04-20', submittedDate: '2025-04-15', assignedTo: 'Prayer Team', comments: [{ author: 'Prayer Team', text: 'Prayer coverage arranged. God bless.', time: '2025-04-17' }] },
  { id: 6, type: 'Material', title: 'Projector for Training Sessions', description: 'Need portable projector for field training sessions.', requester: 'Patrick Nkurunziza', region: 'Kigali City', priority: 'medium', status: 'closed', deadline: '2025-04-10', submittedDate: '2025-03-28', assignedTo: 'Admin Team', comments: [{ author: 'Admin Team', text: 'Projector available for loan. Collect from HQ.', time: '2025-04-05' }] },
];

export const mockUsers = [
  { id: 1, name: 'Emmanuel Habimana', email: 'admin@su.rw', role: 'admin', region: 'Kigali City', department: 'Administration', status: 'active', lastLogin: '2025-05-06 09:00', joinDate: '2023-01-15', phone: '+250 788 001 001', avatar: 'EH' },
  { id: 2, name: 'Grace Uwimana', email: 'manager@su.rw', role: 'manager', region: 'Northern Province', department: 'Field Operations', status: 'active', lastLogin: '2025-05-06 08:30', joinDate: '2023-03-20', phone: '+250 788 002 002', avatar: 'GU' },
  { id: 3, name: 'Patrick Nkurunziza', email: 'staff@su.rw', role: 'staff', region: 'Southern Province', department: 'Youth Ministry', status: 'active', lastLogin: '2025-05-05 16:45', joinDate: '2023-06-10', phone: '+250 788 003 003', avatar: 'PN' },
  { id: 4, name: 'Alice Mukamana', email: 'coordinator@su.rw', role: 'coordinator', region: 'Eastern Province', department: 'Outreach', status: 'active', lastLogin: '2025-05-05 14:20', joinDate: '2023-09-01', phone: '+250 788 004 004', avatar: 'AM' },
  { id: 5, name: 'Jean Habimana', email: 'jean@su.rw', role: 'coordinator', region: 'Southern Province', department: 'Outreach', status: 'active', lastLogin: '2025-05-04 11:00', joinDate: '2024-01-08', phone: '+250 788 005 005', avatar: 'JH' },
  { id: 6, name: 'Marie Nyiramana', email: 'marie@su.rw', role: 'coordinator', region: 'Western Province', department: 'Youth Ministry', status: 'active', lastLogin: '2025-05-03 09:30', joinDate: '2024-02-14', phone: '+250 788 006 006', avatar: 'MN' },
  { id: 7, name: 'David Niyonzima', email: 'david@su.rw', role: 'staff', region: 'Kigali City', department: 'Communications', status: 'inactive', lastLogin: '2025-04-20 15:00', joinDate: '2023-11-01', phone: '+250 788 007 007', avatar: 'DN' },
  { id: 8, name: 'Solange Uwera', email: 'solange@su.rw', role: 'staff', region: 'Northern Province', department: 'Training & Development', status: 'active', lastLogin: '2025-05-05 10:15', joinDate: '2024-04-01', phone: '+250 788 008 008', avatar: 'SU' },
];

export const mockPrayerRequests = [
  { id: 1, title: 'Revival in Eastern Province Churches', description: 'Pray for spiritual awakening and renewed commitment among church members across Eastern Province.', submittedBy: 'Alice Mukamana', region: 'Eastern Province', type: 'Revival', priority: 'high', status: 'prayed', anonymous: false, date: '2025-05-01', responses: 8, themes: ['Revival', 'Church Growth'] },
  { id: 2, title: 'Safety During Outreach Missions', description: 'Protection for field workers during remote area outreach activities planned for May.', submittedBy: 'Anonymous', region: 'All Regions', type: 'Protection', priority: 'urgent', status: 'pending', anonymous: true, date: '2025-05-03', responses: 12, themes: ['Safety', 'Outreach'] },
  { id: 3, title: 'Resources for Youth Ministry', description: 'Wisdom in allocating limited resources for the growing youth ministry across all provinces.', submittedBy: 'Grace Uwimana', region: 'Northern Province', type: 'Resources', priority: 'medium', status: 'answered', anonymous: false, date: '2025-04-20', responses: 15, themes: ['Provision', 'Youth'] },
  { id: 4, title: 'New Staff Integration', description: 'Smooth transition and adaptation for new staff members joining in Q2 2025.', submittedBy: 'Emmanuel Habimana', region: 'Kigali City', type: 'Staff', priority: 'low', status: 'prayed', anonymous: false, date: '2025-04-25', responses: 5, themes: ['Unity', 'Staff'] },
  { id: 5, title: 'Bible Study Material Translation', description: 'Resources and translators for Kinyarwanda Bible study materials needed urgently.', submittedBy: 'Patrick Nkurunziza', region: 'Southern Province', type: 'Resources', priority: 'high', status: 'pending', anonymous: false, date: '2025-05-02', responses: 3, themes: ['Resources', 'Translation'] },
  { id: 6, title: 'Health for Regional Coordinators', description: 'Several coordinators have been ill this season. Praying for restoration of health.', submittedBy: 'Marie Nyiramana', region: 'Western Province', type: 'Health', priority: 'medium', status: 'answered', anonymous: false, date: '2025-04-15', responses: 20, themes: ['Health', 'Staff'] },
];

export const mockDocuments = [
  { id: 1, name: 'Q1 2025 Consolidated Report.pdf', type: 'pdf', size: '2.4 MB', region: 'All Regions', category: 'Consolidated Reports', date: '2025-04-05', uploadedBy: 'Emmanuel Habimana', tags: ['Q1', '2025', 'Consolidated'], version: '1.2', shared: true, downloads: 34 },
  { id: 2, name: 'Northern Province Outreach Plan.docx', type: 'docx', size: '0.8 MB', region: 'Northern Province', category: 'Planning Documents', date: '2025-04-10', uploadedBy: 'Grace Uwimana', tags: ['Outreach', 'Planning', 'Northern'], version: '1.0', shared: false, downloads: 8 },
  { id: 3, name: 'Youth Ministry Guidelines 2025.pdf', type: 'pdf', size: '1.2 MB', region: 'All Regions', category: 'Policies & Guidelines', date: '2025-03-15', uploadedBy: 'Emmanuel Habimana', tags: ['Youth', 'Guidelines', '2025'], version: '2.1', shared: true, downloads: 56 },
  { id: 4, name: 'Kigali Outreach Photos — May.zip', type: 'zip', size: '45 MB', region: 'Kigali City', category: 'Activity Photos', date: '2025-05-02', uploadedBy: 'Patrick Nkurunziza', tags: ['Photos', 'Outreach', 'May'], version: '1.0', shared: false, downloads: 12 },
  { id: 5, name: 'Staff Training Manual v3.pdf', type: 'pdf', size: '3.8 MB', region: 'All Regions', category: 'Training Materials', date: '2025-02-20', uploadedBy: 'Emmanuel Habimana', tags: ['Training', 'Manual', 'Staff'], version: '3.0', shared: true, downloads: 89 },
  { id: 6, name: 'April Prayer Request Compilation.docx', type: 'docx', size: '0.3 MB', region: 'All Regions', category: 'Prayer Documents', date: '2025-05-01', uploadedBy: 'Grace Uwimana', tags: ['Prayer', 'April', 'Compilation'], version: '1.0', shared: true, downloads: 22 },
  { id: 7, name: 'Eastern Region Bible Study Schedule.xlsx', type: 'xlsx', size: '0.1 MB', region: 'Eastern Province', category: 'Schedules', date: '2025-04-28', uploadedBy: 'Alice Mukamana', tags: ['Bible Study', 'Schedule', 'Eastern'], version: '1.1', shared: false, downloads: 7 },
];

export const mockAuditLogs = [
  { id: 1, user: 'Emmanuel Habimana', action: 'User Created', resource: 'User: Solange Uwera', time: '2025-05-06 09:15', ip: '196.12.1.1', severity: 'info' },
  { id: 2, user: 'Grace Uwimana', action: 'Report Approved', resource: 'Report #1: Kigali Youth Outreach', time: '2025-05-05 16:30', ip: '196.12.1.2', severity: 'info' },
  { id: 3, user: 'Patrick Nkurunziza', action: 'Report Submitted', resource: 'Report #7: Monthly Staff Meeting', time: '2025-05-04 14:00', ip: '196.12.1.3', severity: 'info' },
  { id: 4, user: 'Unknown', action: 'Failed Login Attempt', resource: 'admin@su.rw', time: '2025-05-04 03:22', ip: '185.220.101.45', severity: 'warning' },
  { id: 5, user: 'Emmanuel Habimana', action: 'Role Changed', resource: 'User: David Niyonzima → inactive', time: '2025-05-03 11:00', ip: '196.12.1.1', severity: 'warning' },
  { id: 6, user: 'Alice Mukamana', action: 'Document Downloaded', resource: 'Staff Training Manual v3.pdf', time: '2025-05-03 09:45', ip: '196.12.1.4', severity: 'info' },
  { id: 7, user: 'System', action: 'Backup Completed', resource: 'Full system backup', time: '2025-05-03 02:00', ip: 'localhost', severity: 'info' },
  { id: 8, user: 'Unknown', action: 'Failed Login Attempt', resource: 'manager@su.rw', time: '2025-05-02 22:10', ip: '185.220.101.46', severity: 'danger' },
];

export const mockAnalytics = {
  monthlyTrend: [
    { month: 'Jan', reports: 28, approved: 22, participants: 890 },
    { month: 'Feb', reports: 34, approved: 29, participants: 1120 },
    { month: 'Mar', reports: 31, approved: 27, participants: 980 },
    { month: 'Apr', reports: 42, approved: 36, participants: 1450 },
    { month: 'May', reports: 18, approved: 12, participants: 620 },
  ],
  byRegion: [
    { region: 'Kigali City', reports: 38, participants: 1240 },
    { region: 'Northern', reports: 24, participants: 780 },
    { region: 'Southern', reports: 22, participants: 910 },
    { region: 'Eastern', reports: 19, participants: 620 },
    { region: 'Western', reports: 16, participants: 510 },
  ],
  byType: [
    { type: 'Outreach', count: 38, color: '#2e7d32' },
    { type: 'Bible Study', count: 29, color: '#1565c0' },
    { type: 'Training', count: 18, color: '#f9a825' },
    { type: 'Meeting', count: 14, color: '#6a1b9a' },
    { type: 'Community Event', count: 11, color: '#c62828' },
    { type: 'Youth Program', count: 9, color: '#00838f' },
    { type: 'Prayer Meeting', count: 7, color: '#e91e63' },
  ],
  supportTrend: [
    { month: 'Jan', submitted: 8, resolved: 6 },
    { month: 'Feb', submitted: 11, resolved: 9 },
    { month: 'Mar', submitted: 9, resolved: 8 },
    { month: 'Apr', submitted: 14, resolved: 11 },
    { month: 'May', submitted: 6, resolved: 4 },
  ],
};

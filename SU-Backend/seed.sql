-- =============================================
-- SU CONNECT - COMPREHENSIVE DATA INSERTION SCRIPT
-- Populates all tables with realistic sample data
-- Run AFTER creating the tables
-- =============================================

-- =============================================
-- PART 1: INSERT USERS (15+ users with different roles)
-- =============================================

-- Note: Passwords are hashed. In production, use Django to set actual passwords.
-- For testing, you can use: python manage.py changepassword

-- Admin Users
INSERT INTO accounts_user (id, username, email, name, role, region, department, position, phone, is_active, is_superuser, is_staff, mfa_enabled, password, date_joined, created_at, updated_at, first_name, last_name, avatar) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'emmanuel.h', 'admin@su.rw', 'Emmanuel Habimana', 'admin', 'Kigali City', 'Administration', 'National Director', '+250788001001', true, true, true, true, 'pbkdf2_sha256$600000$hash123', NOW(), NOW(), NOW(), '', '', ''),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'alice.m', 'alice@su.rw', 'Alice Mukamana', 'admin', 'Kigali City', 'Finance', 'Finance Director', '+250788001002', true, false, true, false, 'pbkdf2_sha256$600000$hash456', NOW(), NOW(), NOW(), '', '', '') ON CONFLICT (id) DO NOTHING;

-- Manager Users
INSERT INTO accounts_user (id, username, email, name, role, region, department, position, phone, is_active, is_superuser, is_staff, mfa_enabled, password, date_joined, created_at, updated_at, first_name, last_name, avatar) VALUES 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'pierre.n', 'pierre@su.rw', 'Pierre Nkurunziza', 'manager', 'Northern Province', 'Field Operations', 'Regional Manager', '+250788001003', true, false, true, false, 'pbkdf2_sha256$600000$hash789', NOW(), NOW(), NOW(), '', '', ''),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'claudine.u', 'claudine@su.rw', 'Claudine Uwase', 'manager', 'Southern Province', 'Field Operations', 'Regional Manager', '+250788001004', true, false, true, false, 'pbkdf2_sha256$600000$hash012', NOW(), NOW(), NOW(), '', '', ''),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'john.m', 'john@su.rw', 'John Mugabo', 'manager', 'Eastern Province', 'Youth Ministry', 'Youth Director', '+250788001005', true, false, true, false, 'pbkdf2_sha256$600000$hash345', NOW(), NOW(), NOW(), '', '', '') ON CONFLICT (id) DO NOTHING;

-- Staff Users
INSERT INTO accounts_user (id, username, email, name, role, region, department, position, phone, is_active, is_superuser, is_staff, mfa_enabled, password, date_joined, created_at, updated_at, first_name, last_name, avatar) VALUES 
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'jean.h', 'jean@su.rw', 'Jean Habimana', 'staff', 'Southern Province', 'Outreach', 'Field Staff', '+250788001006', true, false, false, false, 'pbkdf2_sha256$600000$hash678', NOW(), NOW(), NOW(), '', '', ''),
('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'marie.u', 'marie@su.rw', 'Marie Uwase', 'staff', 'Eastern Province', 'Youth Ministry', 'Youth Worker', '+250788001007', true, false, false, false, 'pbkdf2_sha256$600000$hash901', NOW(), NOW(), NOW(), '', '', ''),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'patrick.n', 'patrick@su.rw', 'Patrick Nkurunziza', 'staff', 'Kigali City', 'Administration', 'Admin Assistant', '+250788001008', true, false, false, false, 'pbkdf2_sha256$600000$hash234', NOW(), NOW(), NOW(), '', '', ''),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'grace.u', 'grace@su.rw', 'Grace Uwimana', 'staff', 'Western Province', 'Field Operations', 'Field Staff', '+250788001009', true, false, false, false, 'pbkdf2_sha256$600000$hash567', NOW(), NOW(), NOW(), '', '', ''),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'david.k', 'david.k@su.rw', 'David Kagame', 'staff', 'Northern Province', 'Outreach', 'Community Worker', '+250788001010', false, false, false, false, 'pbkdf2_sha256$600000$hash890', NOW(), NOW(), NOW(), '', '', '') ON CONFLICT (id) DO NOTHING;

-- Coordinator Users
INSERT INTO accounts_user (id, username, email, name, role, region, department, position, phone, is_active, is_superuser, is_staff, mfa_enabled, password, date_joined, created_at, updated_at, first_name, last_name, avatar) VALUES 
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380abb', 'david.m', 'david.m@su.rw', 'David Mugabo', 'coordinator', 'Western Province', 'Field Operations', 'Field Coordinator', '+250788001011', true, false, false, false, 'pbkdf2_sha256$600000$hash1234', NOW(), NOW(), NOW(), '', '', ''),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'sarah.u', 'sarah@su.rw', 'Sarah Uwitonze', 'coordinator', 'Kigali City', 'Youth Ministry', 'Youth Coordinator', '+250788001012', true, false, false, false, 'pbkdf2_sha256$600000$hash5678', NOW(), NOW(), NOW(), '', '', ''),
('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 'peter.n', 'peter@su.rw', 'Peter Niyonshuti', 'coordinator', 'Eastern Province', 'Field Operations', 'Field Coordinator', '+250788001013', true, false, false, false, 'pbkdf2_sha256$600000$hash9012', NOW(), NOW(), NOW(), '', '', ''),
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380aee', 'esther.m', 'esther@su.rw', 'Esther Mukamana', 'coordinator', 'Northern Province', 'Youth Ministry', 'Youth Coordinator', '+250788001014', true, false, false, false, 'pbkdf2_sha256$600000$hash3456', NOW(), NOW(), NOW(), '', '', ''),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'joseph.h', 'joseph@su.rw', 'Joseph Habineza', 'coordinator', 'Southern Province', 'Field Operations', 'Field Coordinator', '+250788001015', false, false, false, false, 'pbkdf2_sha256$600000$hash7890', NOW(), NOW(), NOW(), '', '', '') ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PART 2: INSERT REPORTS (20+ reports)
-- =============================================

-- January 2025 Reports
INSERT INTO reports (title, type, region, department, activity_date, duration, location, status, submitted_by_id, participants, demographics, description, outcomes, challenges, prayer_requests, ai_category, confidence, keywords, ai_summary, created_at, updated_at, overridden) VALUES 
('Kigali Youth Outreach Program', 'Outreach', 'Kigali City', 'Youth Ministry', '2025-01-15', '6 hours', 'Kimironko, Kigali', 'approved', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 124, '{"male": 58, "female": 66, "youth": 89, "adults": 35}', 'Successfully conducted youth outreach with focus on discipleship and evangelism. Event included games, worship, Bible teaching, and one-on-one mentoring sessions.', '45 youth committed to follow-up discipleship program. 12 youth accepted Christ. Strong interest in Bible study groups.', 'Limited venue space for breakout sessions. Some youth had transportation challenges.', 'Pray for the 45 youth who committed to follow-up discipleship and the 12 new believers.', 'Outreach', 95, '["youth", "evangelism", "discipleship", "kigali"]'::jsonb, 'Highly successful youth outreach with 124 participants, 45 follow-up commitments, and 12 first-time decisions for Christ.', '2025-01-15 14:30:00+00', '2025-01-15 14:30:00+00', false),

('Musanze Bible Study Training', 'Training', 'Northern Province', 'Field Operations', '2025-01-20', '2 days', 'Musanze Cultural Center', 'approved', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 67, '{"male": 31, "female": 36, "youth": 42, "adults": 25}', 'Two-day Bible study facilitator training for church leaders and youth volunteers covering inductive Bible study methods, small group facilitation, and discipleship principles.', '67 leaders trained. 5 new Bible study groups formed. Facilitator network established for ongoing support.', 'Language barrier with some participants preferring Kinyarwanda over English.', 'Pray for the newly formed Bible study groups and translation of training materials.', 'Training', 98, '["bible study", "training", "leaders", "facilitators"]'::jsonb, 'Training equipped 67 leaders in inductive Bible study methods, resulting in 5 new groups formed.', '2025-01-20 09:00:00+00', '2025-01-20 09:00:00+00', false),

('Rwamagana Community Health Event', 'Community Event', 'Eastern Province', 'Outreach', '2025-01-25', '8 hours', 'Rwamagana Stadium', 'approved', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 312, '{"male": 145, "female": 167, "youth": 210, "adults": 102}', 'Community health and spiritual awareness event in partnership with local health center. Free health screenings, HIV testing, malaria prevention education, and spiritual counseling.', '312 people reached. 78 interested in SU programs. 24 received Christ. Community health partnerships strengthened.', 'Limited medical supplies restricted number of health screenings. Long queues caused some to leave.', 'Pray for follow-up with 78 interested people and 24 new believers.', 'Community Event', 90, '["community", "health", "outreach", "partnership"]'::jsonb, 'Community event reached 312 people with health services, resulting in 78 new program interests and 24 salvations.', '2025-01-25 08:00:00+00', '2025-01-25 08:00:00+00', false);

-- February 2025 Reports
INSERT INTO reports (title, type, region, department, activity_date, duration, location, status, submitted_by_id, participants, demographics, description, outcomes, challenges, prayer_requests, ai_category, confidence, keywords, ai_summary, created_at, updated_at, overridden) VALUES 
('Southern Province Youth Camp', 'Youth Program', 'Southern Province', 'Youth Ministry', '2025-02-10', '3 days', 'Butare, Huye District', 'approved', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 156, '{"male": 72, "female": 84, "youth": 145, "adults": 11}', 'Three-day residential youth camp focusing on leadership development, spiritual growth, team building, Bible study, worship sessions, and leadership workshops.', '67 youth identified as potential leaders. 3 new Bible study groups formed. Youth council established for ongoing engagement.', 'Insufficient camping equipment. Some participants shared sleeping mats.', 'Pray for the 67 emerging youth leaders and provision of better camping equipment.', 'Youth Program', 96, '["youth camp", "leadership", "spiritual growth", "teambuilding"]'::jsonb, 'Residential youth camp developed 67 emerging leaders and established 3 new Bible study groups.', '2025-02-10 10:00:00+00', '2025-02-10 10:00:00+00', false),

('Kigali Prayer Summit', 'Prayer Meeting', 'Kigali City', 'Administration', '2025-02-15', '4 hours', 'SU Rwanda Headquarters', 'approved', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 45, '{"male": 20, "female": 25, "youth": 18, "adults": 27}', 'Monthly staff and volunteer prayer meeting focusing on ministry needs and national revival with worship, intercessory prayer, and testimonies.', 'Powerful prayer time with answered prayer testimonies. Monthly prayer calendar established for all departments.', 'Low attendance from some regions due to distance.', 'Pray for increased participation and continued prayer momentum.', 'Prayer Meeting', 88, '["prayer", "intercession", "revival", "worship"]'::jsonb, 'Monthly prayer meeting strengthened intercessory prayer ministry with answered prayer testimonies.', '2025-02-15 16:00:00+00', '2025-02-15 16:00:00+00', false),

('Ngoma Bible Study Launch', 'Bible Study', 'Eastern Province', 'Field Operations', '2025-02-20', '3 hours', 'Ngoma District', 'approved', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 89, '{"male": 41, "female": 48, "youth": 63, "adults": 26}', 'Launch of new community Bible study program in Ngoma District with introductory session explaining inductive Bible study method.', '89 community members attended. 63 committed to regular participation. 6 new study groups formed.', 'Limited Bible copies available for distribution.', 'Pray for provision of 50 more Bibles and for new study groups to thrive.', 'Bible Study', 94, '["bible study", "launch", "community", "inductive"]'::jsonb, 'Successful Bible study program launch with 89 attendees and 6 new groups formed.', '2025-02-20 15:00:00+00', '2025-02-20 15:00:00+00', false);

-- March 2025 Reports
INSERT INTO reports (title, type, region, department, activity_date, duration, location, status, submitted_by_id, participants, demographics, description, outcomes, challenges, prayer_requests, ai_category, confidence, keywords, ai_summary, created_at, updated_at, overridden) VALUES 
('Northern Province Leadership Retreat', 'Training', 'Northern Province', 'Field Operations', '2025-03-05', '2 days', 'Gicumbi Retreat Center', 'approved', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380aee', 78, '{"male": 48, "female": 30, "youth": 25, "adults": 53}', 'Leadership retreat for church pastors and ministry leaders focusing on strategic planning and ministry effectiveness.', '5-year strategic plan developed. 12 priority communities identified for outreach. Leadership council established.', 'Some leaders had scheduling conflicts.', 'Pray for implementation of strategic plan and wisdom for leadership council.', 'Training', 92, '["leadership", "strategic planning", "retreat", "pastors"]'::jsonb, 'Leadership retreat developed 5-year strategic plan and identified 12 priority communities.', '2025-03-05 09:30:00+00', '2025-03-05 09:30:00+00', false),

('Nyamirambo Street Outreach', 'Outreach', 'Kigali City', 'Outreach', '2025-03-12', '8 hours', 'Nyamirambo, Kigali', 'approved', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 234, '{"male": 110, "female": 124, "youth": 178, "adults": 56}', 'Street outreach in Nyamirambo community including door-to-door evangelism, children''s ministry, and community cleaning.', '234 people reached. 34 decisions for Christ. Established relationship with local church for follow-up.', 'Security concerns in some areas.', 'Pray for the 34 new believers and continued safety.', 'Outreach', 97, '["evangelism", "street outreach", "community", "cleaning"]'::jsonb, 'Street outreach reached 234 people with 34 decisions for Christ.', '2025-03-12 10:00:00+00', '2025-03-12 10:00:00+00', false),

('Gisagara Discipleship Conference', 'Youth Program', 'Southern Province', 'Youth Ministry', '2025-03-18', '1 day', 'Gisagara District', 'submitted', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 112, '{"male": 52, "female": 60, "youth": 98, "adults": 14}', 'One-day discipleship conference for youth focused on spiritual disciplines and peer mentoring.', '98 youth trained in spiritual disciplines. Peer mentoring pairs established for accountability.', 'Limited time for all planned activities.', 'Pray for peer mentoring pairs to be effective.', 'Youth Program', 91, '["discipleship", "youth", "mentoring", "spiritual disciplines"]'::jsonb, 'Discipleship conference trained 98 youth in spiritual disciplines.', '2025-03-18 08:00:00+00', '2025-03-18 08:00:00+00', false);

-- April 2025 Reports
INSERT INTO reports (title, type, region, department, activity_date, duration, location, status, submitted_by_id, participants, demographics, description, outcomes, challenges, prayer_requests, ai_category, confidence, keywords, ai_summary, created_at, updated_at, overridden) VALUES 
('Rubavu Community Development', 'Community Event', 'Western Province', 'Field Operations', '2025-04-02', '1 day', 'Rubavu District', 'approved', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380abb', 189, '{"male": 88, "female": 101, "youth": 134, "adults": 55}', 'Community development day including skills training, financial literacy workshop, and spiritual encouragement.', '189 participated. 45 enrolled in savings group. 23 interested in vocational training.', 'Language diversity required multiple translators.', 'Pray for savings group success and vocational training resources.', 'Community Event', 89, '["community development", "financial literacy", "savings", "skills"]'::jsonb, 'Community development day trained 189 people in financial literacy.', '2025-04-02 09:00:00+00', '2025-04-02 09:00:00+00', false),

('Annual Leadership Summit', 'Meeting', 'Kigali City', 'Administration', '2025-04-08', '1 day', 'Kigali Convention Center', 'approved', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 156, '{"male": 98, "female": 58, "youth": 45, "adults": 111}', 'Annual leadership summit bringing together all SU Rwanda leaders for vision casting and planning.', 'Aligned all departments on 2025 priorities. Successfully introduced new reporting system.', 'Technical difficulties with virtual participants.', 'Pray for unity in implementing strategic priorities.', 'Meeting', 93, '["leadership", "planning", "strategy", "summit"]'::jsonb, 'Annual leadership summit aligned all departments on 2025 priorities.', '2025-04-08 08:30:00+00', '2025-04-08 08:30:00+00', false);

-- May 2025 Reports
INSERT INTO reports (title, type, region, department, activity_date, duration, location, status, submitted_by_id, participants, demographics, description, outcomes, challenges, prayer_requests, ai_category, confidence, keywords, ai_summary, created_at, updated_at, overridden) VALUES 
('Kayonza Evangelism Campaign', 'Outreach', 'Eastern Province', 'Outreach', '2025-05-01', '2 days', 'Kayonza District', 'approved', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 412, '{"male": 195, "female": 217, "youth": 298, "adults": 114}', 'Two-day evangelism campaign with open-air meetings, drama presentations, and personal evangelism.', '412 heard the gospel. 56 decisions for Christ. Local church follow-up program established.', 'Crowd control challenging.', 'Pray for 56 new believers and follow-up program.', 'Outreach', 96, '["evangelism", "campaign", "salvation", "drama"]'::jsonb, 'Evangelism campaign reached 412 people with 56 decisions for Christ.', '2025-05-01 15:00:00+00', '2025-05-01 15:00:00+00', false),

('All-Staff Prayer and Fasting', 'Prayer Meeting', 'All Regions', 'Administration', '2025-05-10', '1 day', 'SU Rwanda Headquarters', 'submitted', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 67, '{"male": 34, "female": 33, "youth": 22, "adults": 45}', 'All-staff prayer and fasting day focusing on 2025 ministry goals and national spiritual needs.', 'Powerful breakthrough prayers. Staff reported renewed purpose and unity.', 'Some staff had health challenges with fasting.', 'Pray for continued unity and God''s guidance.', 'Prayer Meeting', 87, '["prayer", "fasting", "unity", "breakthrough"]'::jsonb, 'All-staff prayer day resulted in renewed unity and breakthrough prayers.', '2025-05-10 07:00:00+00', '2025-05-10 07:00:00+00', false),

('Kicukiro Youth Leaders Training', 'Training', 'Kigali City', 'Youth Ministry', '2025-05-15', '2 days', 'Kicukiro District', 'draft', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 89, '{"male": 47, "female": 42, "youth": 75, "adults": 14}', 'Training for youth leaders on child protection, trauma-informed care, and effective youth ministry.', 'Training in progress - will update upon completion.', 'None yet.', 'Pray for effective training and application.', 'Training', NULL, '[]'::jsonb, NULL, '2025-05-15 09:00:00+00', '2025-05-15 09:00:00+00', false);

-- =============================================
-- PART 3: INSERT SUPPORT REQUESTS
-- =============================================

INSERT INTO support_requests (category, title, description, urgency, status, deadline, requester_id, assigned_to_id, region, created_at, updated_at) VALUES 
('Equipment', 'Bible Study Workbooks', 'Need 500 Bible study workbooks for new groups formed in Musanze district. Five new Bible study groups formed with 67 trained facilitators need materials for 500 participants.', 'high', 'approved', '2025-03-15', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Northern Province', '2025-02-01 10:00:00+00', '2025-02-05 14:15:00+00'),

('Financial', 'Youth Camp Funding', 'Financial support needed for annual youth camp in Butare planned for July 2025. Camp budget: $5,000 for venue, meals, materials, transport for 150 youth, and facilitator stipends.', 'critical', 'approved', '2025-06-30', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Southern Province', '2025-03-15 14:30:00+00', '2025-03-20 10:00:00+00'),

('Training', 'Digital Literacy Training', 'Training for 25 field staff on using the SU Connect system effectively in remote areas. New system requires technical training for all field staff to maximize usage.', 'medium', 'in_progress', '2025-06-15', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kigali City', '2025-04-10 11:00:00+00', '2025-04-12 09:00:00+00'),

('Personnel', 'Additional Field Staff', 'Request for two additional field staff to handle growing ministry in Kayonza and Ngoma districts. Current staff-to-population ratio is 1:50,000. Need 2 more staff to effectively reach communities.', 'high', 'submitted', '2025-08-01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', NULL, 'Eastern Province', '2025-04-20 09:15:00+00', '2025-04-20 09:15:00+00'),

('Spiritual', 'National Revival Prayer Strategy', 'Request for coordinated prayer strategy across all regions for national revival. God is moving across the nation. Need strategic prayer coordination to sustain momentum.', 'critical', 'approved', '2025-05-30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'All Regions', '2025-04-25 08:00:00+00', '2025-04-28 14:00:00+00'),

('Equipment', 'Sports Equipment', 'Need soccer balls, nets, and sports jerseys for youth outreach programs across Kigali. Sports ministry is growing rapidly. Current equipment is worn out and insufficient for 200+ youth.', 'medium', 'in_progress', '2025-06-20', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Kigali City', '2025-05-01 13:20:00+00', '2025-05-01 13:20:00+00'),

('Financial', 'Computer Lab Equipment', 'Need 15 computers for new youth training center in Huye District. Youth digital literacy program launching in September. Need computers for training 300 youth annually.', 'high', 'submitted', '2025-08-15', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', NULL, 'Southern Province', '2025-05-10 10:30:00+00', '2025-05-10 10:30:00+00'),

('Other', 'Vehicle for Northern Province', 'Request for 4x4 vehicle to reach remote communities in Northern Province during rainy season. Current vehicle is unreliable. Many communities inaccessible during rainy season.', 'critical', 'resolved', '2025-07-01', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Northern Province', '2025-03-01 12:00:00+00', '2025-06-01 11:00:00+00');

-- =============================================
-- PART 4: INSERT PRAYER REQUESTS
-- =============================================

INSERT INTO prayer_requests (title, request, requester_id, region, status, visibility, commitments_count, created_at, updated_at) VALUES 
('Revival in Eastern Province Schools', 'Pray for spiritual awakening and youth revival across Eastern Province secondary schools. Many students are hungry for God.', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Eastern Province', 'active', 'public', 1, '2025-01-10 08:00:00+00', '2025-01-10 08:00:00+00'),

('Staff Protection in Remote Areas', 'Pray for safety of field staff traveling to remote areas for outreach, especially during rainy season when roads are dangerous.', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Northern Province', 'active', 'public', 2, '2025-01-15 09:30:00+00', '2025-01-15 09:30:00+00'),

('Resources for Youth Ministry', 'Pray for provision of resources (Bibles, sports equipment, computers) to support growing youth ministry reaching 500+ youth weekly.', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'Kigali City', 'active', 'public', 0, '2025-01-20 14:15:00+00', '2025-01-20 14:15:00+00'),

('Healing for Director', 'Please pray for complete healing and recovery for Emmanuel who is in hospital with malaria complications.', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kigali City', 'answered', 'anonymous', 2, '2025-01-25 11:00:00+00', '2025-01-25 11:00:00+00'),

('Unity Among Leadership', 'Pray for unity and wisdom as leadership team makes critical decisions for 2025 ministry direction.', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kigali City', 'active', 'public', 1, '2025-02-01 10:00:00+00', '2025-02-01 10:00:00+00'),

('Western Province Youth Camp', 'Pray for 150 youth attending camp next month. Pray for safety, salvation, and life transformation.', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380abb', 'Western Province', 'active', 'public', 0, '2025-02-05 13:45:00+00', '2025-02-05 13:45:00+00'),

('Bible Distribution Funding', 'Pray for $10,000 needed to distribute 2,000 Bibles to new believers in rural communities.', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'All Regions', 'active', 'regional', 0, '2025-02-10 09:00:00+00', '2025-02-10 09:00:00+00'),

('Staff Recruitment', 'Pray for God to send qualified Christian staff to fill 5 open positions across various departments.', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'All Regions', 'active', 'public', 1, '2025-02-15 11:30:00+00', '2025-02-15 11:30:00+00'),

('Peace in Community Conflicts', 'Pray for resolution of land disputes affecting our ministry communities in Eastern Province.', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Eastern Province', 'active', 'anonymous', 0, '2025-02-20 08:30:00+00', '2025-02-20 08:30:00+00'),

('School Bible Clubs', 'Pray for favor as we seek permission to start Bible clubs in 10 new secondary schools.', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Eastern Province', 'active', 'regional', 0, '2025-03-01 10:15:00+00', '2025-03-01 10:15:00+00'),

('Financial Breakthrough', 'Pray for provision to meet monthly operational budget shortfall of $8,000.', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'All Regions', 'active', 'public', 1, '2025-03-05 14:00:00+00', '2025-03-05 14:00:00+00'),

('Volunteer Training Program', 'Pray for effectiveness of new volunteer training program launching in April.', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Western Province', 'active', 'public', 0, '2025-03-10 09:45:00+00', '2025-03-10 09:45:00+00'),

('Healing for Mama Jeanne', 'Please pray for Mama Jeanne, a community volunteer, who was diagnosed with cancer.', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'Southern Province', 'answered', 'anonymous', 1, '2025-03-15 12:30:00+00', '2025-03-15 12:30:00+00'),

('Strategic Planning Wisdom', 'Pray for wisdom as we develop 5-year strategic plan for SU Rwanda.', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kigali City', 'active', 'public', 0, '2025-03-20 08:00:00+00', '2025-03-20 08:00:00+00');

-- =============================================
-- PART 5: INSERT DOCUMENTS
-- =============================================

-- Note: we skip inserting documents into reports' M2M because in Django it's generated by IDs,
-- and the actual files won't exist in the mock storage.

-- =============================================
-- PART 8: INSERT AUDIT LOGS
-- =============================================

INSERT INTO audit_logs (user_id, user_snapshot, action, resource, ip, severity, created_at) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Database Setup', 'SU Connect database initialized with sample data', '127.0.0.1', 'info', NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'User Created', 'Created admin user: emmanuel.h', '196.12.1.5', 'info', '2025-01-01 09:00:00+00'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Report Submitted', 'Report #1: Kigali Youth Outreach Program', '196.12.1.15', 'info', '2025-01-15 16:30:00+00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Report Approved', 'Report #1 approved', '196.12.1.5', 'info', '2025-01-18 10:15:00+00'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Support Approved', 'Support Request #1: Bible Study Workbooks', '196.12.1.10', 'info', '2025-02-05 09:30:00+00'),
(NULL, 'Unknown', 'Failed Login Attempt', 'Invalid password for admin@su.rw', '203.0.113.5', 'high', '2025-01-15 22:15:30+00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Document Uploaded', 'Document #7: Strategic Plan 2025-2030.pdf', '196.12.1.5', 'info', '2025-04-10 09:00:00+00');

-- =============================================
-- PART 9: INSERT NOTIFICATIONS
-- =============================================

INSERT INTO notifications (user_id, type, title, message, icon, read, created_at) VALUES 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'report', 'Report Approved', 'Your Bible Study Training report has been approved. Well done!', 'check', false, '2025-01-22 09:00:00+00'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'support', 'Support Request Approved', 'Your youth camp funding request has been approved. $5,000 allocated.', 'package', false, '2025-03-20 10:30:00+00'),
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'prayer', 'Prayer Response', 'People have committed to pray for your revival request.', 'heart', false, '2025-01-11 14:15:00+00'),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'deadline', 'Report Deadline Reminder', 'Your monthly report for April is due in 3 days.', 'clock', false, '2025-04-27 08:00:00+00'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'support', 'Support Request Updated', 'Your personnel request has been assigned for review.', 'user', false, '2025-04-22 11:00:00+00'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'system', 'Welcome to SU Connect', 'Welcome to the new reporting system! Complete your profile setup.', 'star', true, '2025-01-01 00:00:00+00'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'report', 'Monthly Summary', 'Your region submitted 12 reports this month. 10 approved, 2 pending.', 'trending', true, '2025-02-01 09:00:00+00');

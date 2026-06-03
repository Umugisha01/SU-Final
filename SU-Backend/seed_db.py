import os, django, datetime
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.development')
django.setup()

from django.db import connection
from apps.accounts.models import User

print('Clearing tables...')
with connection.cursor() as cursor:
    cursor.execute('TRUNCATE TABLE accounts_user CASCADE;')
    cursor.execute('TRUNCATE TABLE reports CASCADE;')
    cursor.execute('TRUNCATE TABLE support_requests CASCADE;')
    cursor.execute('TRUNCATE TABLE prayer_requests CASCADE;')
    cursor.execute('TRUNCATE TABLE notifications CASCADE;')
    cursor.execute('TRUNCATE TABLE audit_logs CASCADE;')

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

with open('seed.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

import re
sql_cleaned = re.sub(r'(?i)INSERT INTO accounts_user.*?ON CONFLICT \(id\) DO NOTHING;', '', sql, flags=re.DOTALL)
sql_cleaned = re.sub(r'(?i)INSERT INTO accounts_user.*?\);', '', sql_cleaned, flags=re.DOTALL)


with connection.cursor() as cursor:
    cursor.execute(sql_cleaned)

print('Database seeded completely!')

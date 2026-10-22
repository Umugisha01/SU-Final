# 🚀 PgBouncer Setup & Architecture for SU Connect

## 📌 Architecture Overview

**PgBouncer** is a lightweight, high-performance PostgreSQL connection pooler configured for **SU Connect**. It sits directly between the Django/Channels/Celery backend and the PostgreSQL database engine.

```
+---------------------------------------------------------------------------------+
|                                APPLICATION LAYER                                |
|  - Django REST Framework (HTTP endpoints)                                       |
|  - Django Channels / Daphne (WebSocket real-time events)                        |
|  - Celery Background Workers (AI tasks & batch jobs)                            |
+----------------------------------------+----------------------------------------+
                                         | Port 6432 (Transaction Pooling)
                                         v
+---------------------------------------------------------------------------------+
|                                 PGBOUNCER LAYER                                 |
|  - Listens on: 127.0.0.1:6432                                                   |
|  - Pool Mode: transaction                                                       |
|  - Max Client Connections: 250                                                  |
|  - Default Pool Size: 25                                                        |
|  - Authentication: SCRAM-SHA-256                                                |
+----------------------------------------+----------------------------------------+
                                         | Port 5432 (Persistent Connection Pool)
                                         v
+---------------------------------------------------------------------------------+
|                           POSTGRESQL 18 DATABASE LAYER                          |
|  - Database: su_connect                                                         |
|  - Port: 5432                                                                   |
+---------------------------------------------------------------------------------+
```

---

## 📂 PgBouncer Directory Topology

All PgBouncer files are located under `d:\FINAL-Project\pgbouncer\`:

| File | Purpose |
|---|---|
| `pgbouncer.exe` | Native 64-bit Windows binary (v1.26.1) |
| `pgbouncer.ini` | Main configuration file (pools, ports, timeouts) |
| `userlist.txt` | Secure authentication file with SCRAM-SHA-256 credentials |
| `start_pgbouncer.bat` | One-click script to start PgBouncer in the background |
| `stop_pgbouncer.bat` | One-click script to terminate the PgBouncer process |
| `status_pgbouncer.bat` | Displays running status and queries active pool statistics |
| `pgbouncer.log` | PgBouncer runtime log file |

---

## 🐳 Option C: Docker Container Setup

For containerized environments or production deployments, a fully configured Docker Compose setup is provided:

### Files:
- [docker-compose.pgbouncer.yml](file:///d:/FINAL-Project/docker-compose.pgbouncer.yml): Docker Compose definition with port `6432:6432`, volume mounts, and `host.docker.internal` routing.
- [docker/Dockerfile](file:///d:/FINAL-Project/docker/Dockerfile): Lightweight Alpine 3.20 image with PgBouncer.
- [docker/pgbouncer.ini](file:///d:/FINAL-Project/docker/pgbouncer.ini): Configured with `host=host.docker.internal` to route to host PostgreSQL.
- [docker/userlist.txt](file:///d:/FINAL-Project/docker/userlist.txt): SCRAM-SHA-256 credentials.
- [start_docker_pgbouncer.bat](file:///d:/FINAL-Project/start_docker_pgbouncer.bat): Start the container via Docker Compose.
- [stop_docker_pgbouncer.bat](file:///d:/FINAL-Project/stop_docker_pgbouncer.bat): Stop the container.
- [status_docker_pgbouncer.bat](file:///d:/FINAL-Project/status_docker_pgbouncer.bat): View container health & logs.

### Running with Docker Compose:
```bash
docker compose -f docker-compose.pgbouncer.yml up -d --build
```

---

## 🛠️ Management Commands

### Native Windows Option:
### 1. Start PgBouncer
Double-click `start_pgbouncer.bat` or run:
```cmd
d:\FINAL-Project\pgbouncer\start_pgbouncer.bat
```

### 2. Check Pool Statistics
Double-click `status_pgbouncer.bat` or run:
```cmd
d:\FINAL-Project\pgbouncer\status_pgbouncer.bat
```

### 3. Stop PgBouncer
Double-click `stop_pgbouncer.bat` or run:
```cmd
d:\FINAL-Project\pgbouncer\stop_pgbouncer.bat
```

---

## ⚙️ Django Configuration Details

### 1. Environment Variables (`SU-Backend/.env`)
```env
# Application connects to PgBouncer on port 6432
DATABASE_URL=postgresql://postgres:Bnc20031!@localhost:6432/su_connect

# Direct port for DDL migrations or emergency administration
DIRECT_DATABASE_URL=postgresql://postgres:Bnc20031!@localhost:5432/su_connect

# Connection age set to 0 so PgBouncer manages pool recycling
DB_CONN_MAX_AGE=0
```

### 2. Settings Optimization (`su_connect/settings/base.py`)
```python
_db_config = env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
if 'postgresql' in _db_config.get('ENGINE', ''):
    _db_config['CONN_MAX_AGE'] = int(env('DB_CONN_MAX_AGE', default=0))
    # Required for transaction pooling to avoid prepared cursor errors across transactions
    _db_config['DISABLE_SERVER_SIDE_CURSORS'] = True

DATABASES = {
    'default': _db_config
}

if env('DIRECT_DATABASE_URL', default=''):
    DATABASES['direct'] = env.db('DIRECT_DATABASE_URL')
```

---

## 🔍 Verification & Health Checks

Verify connection from PowerShell or Command Prompt:
```powershell
$env:PGPASSWORD='Bnc20031!'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -p 6432 -U postgres -d su_connect -c "SELECT current_database(), current_user, version();"
```

Verify Django ORM query routing:
```powershell
.\SU-Backend\.venv\Scripts\python.exe SU-Backend\manage.py shell -c "from apps.accounts.models import User; print('Users in DB via PgBouncer:', User.objects.count())"
```

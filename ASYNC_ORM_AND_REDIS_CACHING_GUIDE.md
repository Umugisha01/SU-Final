# ⚡ Daphne Async ORM Wrapping & Redis Caching Implementation Guide

This guide provides end-to-end implementation instructions and architectural explanations for two critical performance and scalability optimizations in **SU Connect**:

1. **Wrapping Synchronous Django ORM Calls in Daphne (ASGI / Channels)**: Preventing server thread starvation in WebSocket consumers and async views.
2. **Implementing In-Memory Redis Caching for Read-Heavy Endpoints**: Sub-millisecond response times for `/api/prayer/` feed, User Directory (`/api/users/directory`), and Region lists.

---

## 📑 Table of Contents
1. [Part 1: Wrapping Synchronous ORM Calls in Daphne](#part-1-wrapping-synchronous-orm-calls-in-daphne)
   - [The Problem: Event Loop Thread Blocking](#the-problem-event-loop-thread-blocking)
   - [The Core Solution: `database_sync_to_async` vs `sync_to_async`](#the-core-solution-database_sync_to_async-vs-sync_to_async)
   - [Audit & Implementation in Channels Consumers](#audit--implementation-in-channels-consumers)
   - [Handling Django 4.2+ Native Async ORM Methods](#handling-django-42-native-async-orm-methods)
   - [Golden Rules for Async ORM Safety](#golden-rules-for-async-orm-safety)
2. [Part 2: Redis Caching for Read-Heavy Endpoints](#part-2-redis-caching-for-read-heavy-endpoints)
   - [Architecture & Cache Topology](#architecture--cache-topology)
   - [Configuring Redis Cache in Django Settings](#configuring-redis-cache-in-django-settings)
   - [Strategy A: View-Level Caching (`@cache_page`)](#strategy-a-view-level-caching-cache_page)
   - [Strategy B: Regional-Aware Low-Level Caching (`cache.get / cache.set`)](#strategy-b-regional-aware-low-level-caching-cacheget--cacheset)
   - [Automatic Cache Invalidation via Django Signals](#automatic-cache-invalidation-via-django-signals)
3. [Verification & Benchmarking](#verification--benchmarking)

---

# Part 1: Wrapping Synchronous ORM Calls in Daphne

## The Problem: Event Loop Thread Blocking

**Daphne** is an ASGI (Asynchronous Server Gateway Interface) server built on Python's `asyncio` and Twisted event loops. It executes asynchronous handlers—such as WebSocket connections and async views—on a single event loop thread per worker process.

### What Happens During a Synchronous Database Call?

```
[ Daphne Event Loop Thread ]
      │
      ├─► Client A: WebSocket event loop
      │
      ├─► Client B: Calls synchronous User.objects.get(...) ──────┐
      │                                                          │
      │   🛑 EVENT LOOP COMPLETELY FROZEN HERE                    │ Database I/O Latency
      │   • Client A WebSocket ping/pong drops                   │ (15ms - 200ms)
      │   • Client C connection handshake stalls                 │
      │   • Celery AI progress WebSocket frames queued           │
      │                                                          │
      ├─► Synchronous ORM call finishes ◄────────────────────────┘
      │
      └─► Event loop resumes (causes latency spikes & client disconnects)
```

1. **Synchronous I/O Blocks the Entire Thread**: Standard Django ORM operations execute blocking socket read/write calls to PostgreSQL.
2. **`SynchronousOnlyOperation` Exceptions**: Django detects synchronous DB calls inside an async event loop and raises:
   ```text
   django.core.exceptions.SynchronousOnlyOperation: 
   You cannot call this from an async context - use a thread or sync_to_async.
   ```
3. **Connection Leaks**: Unwrapped threads exiting unexpectedly fail to release database connections cleanly back to PostgreSQL or PgBouncer.

---

## The Core Solution: `database_sync_to_async` vs `sync_to_async`

In Django Channels, **always prefer `channels.db.database_sync_to_async` over plain `asgiref.sync.sync_to_async`** for database interactions.

| Feature | `channels.db.database_sync_to_async` | `asgiref.sync.sync_to_async` |
|---|---|---|
| **Primary Target** | Django ORM queries & transactions | General synchronous Python functions / external I/O |
| **Connection Cleanup** | ✅ Automatically closes expired DB connections and returns connections to PgBouncer pool | ❌ Does not handle Django DB connection lifecycle |
| **Context Safety** | ✅ Ensures thread-sensitive execution within Django's thread pool | Requires explicit `thread_sensitive=True` |

```python
from channels.db import database_sync_to_async

@database_sync_to_async
def get_user_profile(user_id):
    # This executes synchronously in a separate worker thread pool
    return User.objects.select_related('department').get(id=user_id)
```

---

## Audit & Implementation in Channels Consumers

Inspect [core/consumers.py](file:///d:/FINAL-Project/SU-Backend/core/consumers.py). All database queries, user lookups, and ORM relationship traversals must be isolated into decorated methods.

### 1. `NotificationConsumer` Implementation
All database operations (`get_user_from_token`, `mark_notification_read`, and counting unread notifications) are strictly separated from async WebSocket handlers:

```python
# core/consumers.py
import urllib.parse
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_string):
    """
    Decodes JWT token and retrieves user instance in a sync thread.
    """
    try:
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        # Use select_related or only() to avoid lazy attribute loading in async context
        return User.objects.filter(id=user_id, status='active').first()
    except Exception:
        return None


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode()
        query_params = urllib.parse.parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        self.user = None
        if token:
            # AWAIT the async wrapper
            self.user = await get_user_from_token(token)
            
        if self.user:
            self.group_name = f"user_{self.user.id}_notifications"
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close(code=4001)

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        action = content.get('action')
        notification_id = content.get('notification_id')
        
        if action == 'mark_read' and notification_id:
            success = await self.mark_notification_read(notification_id)
            await self.send_json({"success": success, "notification_id": notification_id})
        
        elif action == 'get_unread_count':
            count = await self.get_unread_count()
            await self.send_json({"unread_count": count})

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        from apps.notifications.models import Notification
        try:
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.read = True
            notification.save(update_fields=['read'])
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def get_unread_count(self):
        from apps.notifications.models import Notification
        return Notification.objects.filter(user=self.user, read=False).count()

    async def new_notification(self, event):
        await self.send_json(event['data'])
```

---

## Handling Django 4.2+ Native Async ORM Methods

Django 4.2+ natively provides asynchronous versions for most ORM queries, prefixed with `a`. When performing simple, single queries inside async views or consumer methods, native async methods can be used directly without a helper function:

```python
# Single record retrieval
user = await User.objects.filter(id=user_id).afirst()

# Asynchronous count
total = await Notification.objects.filter(user=user, read=False).acount()

# Asynchronous creation
notification = await Notification.objects.acreate(
    user=user,
    title="Report Approved",
    message="Your monthly field report has been approved."
)

# Asynchronous iteration over querysets
async for req in PrayerRequest.objects.filter(region='Kigali City')[:10]:
    await self.send_json({"id": req.id, "title": req.title})
```

> [!WARNING]
> **Beware of Lazy Evaluation**: Django model relationships (such as `user.profile` or `report.author`) are evaluated lazily. Accessing `report.author.name` inside an async method will trigger a synchronous query error. Always prefetch data using `.select_related()` or `.prefetch_related()` inside `@database_sync_to_async`.

---

## Golden Rules for Async ORM Safety

1. **Evaluate QuerySets inside the synchronous function**: Return Python primitives (lists, dicts, tuples, IDs) from `@database_sync_to_async` rather than lazy `QuerySet` objects.
   ```python
   # ✅ SAFE: Evaluation happens entirely inside the synchronous thread
   @database_sync_to_async
   def get_active_regions():
       return list(User.objects.values_list('region', flat=True).distinct())

   # ❌ UNSAFE: Returning an un-evaluated QuerySet will explode when iterated in async context
   @database_sync_to_async
   def get_active_regions():
       return User.objects.values_list('region', flat=True).distinct()
   ```
2. **Never access foreign keys directly in async blocks**:
   ```python
   # ❌ Will trigger SynchronousOnlyOperation
   async def handle_event(self):
       print(self.user.department.name) 

   # ✅ Fetch needed fields during user lookup
   @database_sync_to_async
   def get_user_with_dept(user_id):
       return User.objects.select_related('department').get(id=user_id)
   ```

---

# Part 2: Redis Caching for Read-Heavy Endpoints

## Architecture & Cache Topology

```
+─────────────────────────────────────────────────────────────────────────────+
|                              CLIENT REQUEST                                 |
|                   GET /api/prayer/?region=Kigali City                       |
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │
                                       ▼
+─────────────────────────────────────────────────────────────────────────────+
|                         DJANGO REST FRAMEWORK / DAPHNE                      |
|                                                                             |
|   1. Check Redis Cache: Key = "prayer_feed:Kigali City:active:page_1"       |
+──────────────────┬──────────────────────────────────────────┬───────────────+
                   │ Cache HIT (< 1ms)                        │ Cache MISS
                   ▼                                          ▼
+──────────────────────────────────+      +───────────────────────────────────+
|         REDIS IN-MEMORY          |      |       POSTGRESQL (via PgBouncer)  |
|  - In-Memory Key Lookup          |      |  - SQL Query Execution            |
|  - Instant JSON Serialization    |      |  - Serializer processing (~35ms)  |
|  - Zero DB Connection Overhead   |      |  - Stores result in Redis cache   |
+──────────────────────────────────+      +───────────────────────────────────+
```

---

## Configuring Redis Cache in Django Settings

In [su_connect/settings/base.py](file:///d:/FINAL-Project/SU-Backend/su_connect/settings/base.py), verify the Redis cache configuration:

```python
# su_connect/settings/base.py
import environ

env = environ.Env()

REDIS_URL = env('REDIS_URL', default='redis://127.0.0.1:6379/1')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
        'TIMEOUT': 60 * 15,  # 15 minutes default TTL
        'KEY_PREFIX': 'su_connect',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',  # If using django-redis
        }
    }
}
```

> [!NOTE]
> In [su_connect/settings/development.py](file:///d:/FINAL-Project/SU-Backend/su_connect/settings/development.py), `LocMemCache` is configured for offline local testing without Redis. In production and staging, ensure `DJANGO_SETTINGS_MODULE=su_connect.settings.production` or remove the `LocMemCache` override when testing Redis performance.

---

## Strategy A: View-Level Caching (`@cache_page`)

For endpoints that are identical across all users or public feeds, Django provides `@method_decorator(cache_page(...))` and `@method_decorator(vary_on_headers(...))`.

### 1. Caching the Prayer Feed (`/api/prayer/`)

In [apps/prayer/views.py](file:///d:/FINAL-Project/SU-Backend/apps/prayer/views.py):

```python
# apps/prayer/views.py
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework import generics
from apps.prayer.models import PrayerRequest
from apps.prayer.serializers import PrayerRequestSerializer
from rest_framework.response import Response

class PrayerRequestListCreateView(generics.ListCreateAPIView):
    """
    GET /api/prayer - list visible prayers (Cached for 15 minutes)
    POST /api/prayer - create prayer (Invalidates cache)
    """
    serializer_class = PrayerRequestSerializer

    # Cache GET requests for 15 minutes.
    # vary_on_headers('Authorization') guarantees that users with different permissions
    # or regional assignments do not share the exact same cached response.
    @method_decorator(cache_page(60 * 15, key_prefix='prayer_feed'))
    @method_decorator(vary_on_headers('Authorization'))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
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
```

---

### 2. Caching the User Directory (`/api/users/directory`)

In [apps/accounts/views.py](file:///d:/FINAL-Project/SU-Backend/apps/accounts/views.py):

```python
# apps/accounts/views.py
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class UserDirectoryView(APIView):
    """
    Returns a lightweight directory of active users for dropdowns and selectors.
    Cached for 15 minutes.
    """
    permission_classes = [permissions.IsAuthenticated]

    @method_decorator(cache_page(60 * 15, key_prefix='user_dir'))
    @method_decorator(vary_on_headers('Authorization'))
    def get(self, request):
        queryset = User.objects.filter(status='active')
        if request.user.role == 'field_officer':
            queryset = queryset.exclude(role__in=['national_manager', 'administrator'])
        users = queryset.values('id', 'name', 'role', 'region', 'department')
        return Response({"success": True, "data": list(users)}, status=status.HTTP_200_OK)
```

---

### 3. Caching Region Lists

If providing a static or database-driven regional lookup endpoint:

```python
# apps/accounts/views.py (or apps/reports/views.py)
class RegionListView(APIView):
    """
    Returns the list of administrative provinces and operational regions.
    Publicly cacheable for 24 hours.
    """
    permission_classes = [permissions.IsAuthenticated]

    @method_decorator(cache_page(60 * 60 * 24, key_prefix='regions_list'))
    def get(self, request):
        regions = [
            {"id": "kigali", "name": "Kigali City"},
            {"id": "eastern", "name": "Eastern Province"},
            {"id": "northern", "name": "Northern Province"},
            {"id": "western", "name": "Western Province"},
            {"id": "southern", "name": "Southern Province"},
            {"id": "all", "name": "All Regions"},
        ]
        return Response({"success": True, "data": regions}, status=status.HTTP_200_OK)
```

---

## Strategy B: Regional-Aware Low-Level Caching (`cache.get / cache.set`)

### Why Low-Level Caching is Superior for SU Connect
SU Connect uses **`RegionalIsolationMiddleware`** and role-based data partitioning. A low-level caching approach gives complete control over cache key generation and allows instant, surgical cache invalidation without flushing unrelated records.

### Implementation: Low-Level Region-Aware Prayer Feed

```python
# apps/prayer/views.py
from django.core.cache import cache
from rest_framework import generics, status
from rest_framework.response import Response
from apps.prayer.models import PrayerRequest
from apps.prayer.serializers import PrayerRequestSerializer

class PrayerRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = PrayerRequestSerializer

    def list(self, request, *args, **kwargs):
        user = request.user
        role = getattr(user, 'role', 'anonymous')
        region = request.query_params.get('region', getattr(user, 'region', 'all'))
        page = request.query_params.get('page', '1')
        status_param = request.query_params.get('status', 'active')
        search = request.query_params.get('search', '')

        # Do not cache search queries with custom keywords
        if search:
            return super().list(request, *args, **kwargs)

        # Unique cache key per region, role, and pagination
        cache_key = f"prayer_feed:{region}:{role}:{status_param}:p{page}"
        cached_response = cache.get(cache_key)

        if cached_response is not None:
            # ⚡ Instant Return from Redis (< 1ms)
            return Response(cached_response, status=status.HTTP_200_OK)

        # Database Query on Cache Miss
        response = super().list(request, *args, **kwargs)

        if response.status_code == 200:
            # Store payload in Redis for 15 minutes
            cache.set(cache_key, response.data, timeout=60 * 15)

        return response
```

---

## Automatic Cache Invalidation via Django Signals

When a user creates a prayer request, edits a profile, or archives a post, stale cache entries must be purged immediately.

### Signal Implementation for Prayer Requests & User Directory

Create or edit [apps/prayer/signals.py](file:///d:/FINAL-Project/SU-Backend/apps/prayer/signals.py):

```python
# apps/prayer/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from apps.prayer.models import PrayerRequest
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver([post_save, post_delete], sender=PrayerRequest)
def invalidate_prayer_cache(sender, instance, **kwargs):
    """
    Clears cached prayer feeds whenever a prayer request is created, updated, or deleted.
    """
    region = instance.region or 'all'
    # Delete region-specific keys and broad wildcard patterns if using redis cache backend
    if hasattr(cache, 'delete_pattern'):
        cache.delete_pattern("su_connect:prayer_feed:*")
    else:
        # Standard fallback for default cache
        for r in [region, 'all', 'Kigali City', 'Western Province', 'Eastern Province', 'Northern Province', 'Southern Province']:
            for p in range(1, 10):
                cache.delete(f"prayer_feed:{r}:field_officer:active:p{p}")
                cache.delete(f"prayer_feed:{r}:regional_coordinator:active:p{p}")
                cache.delete(f"prayer_feed:{r}:national_manager:active:p{p}")
                cache.delete(f"prayer_feed:{r}:administrator:active:p{p}")


@receiver([post_save, post_delete], sender=User)
def invalidate_user_directory_cache(sender, instance, **kwargs):
    """
    Clears the user directory cache when users change status, role, or names.
    """
    if hasattr(cache, 'delete_pattern'):
        cache.delete_pattern("su_connect:user_dir:*")
    else:
        cache.delete("user_directory_active")
```

Register the signals in `apps/prayer/apps.py`:

```python
# apps/prayer/apps.py
from django.apps import AppConfig

class PrayerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.prayer'

    def ready(self):
        import apps.prayer.signals
```

---

# Verification & Benchmarking

### 1. Verifying Daphne Thread Safety

Start Daphne and connect a WebSocket client to `ws://localhost:8000/ws/notifications/?token=<JWT>`:

```powershell
# In SU-Backend directory
daphne -b 127.0.0.1 -p 8000 su_connect.asgi:application
```

Send a test JSON payload over the WebSocket:
```json
{"action": "mark_read", "notification_id": 1}
```
**Success Indicator**:
- Response received within 1-3ms.
- Daphne console shows NO `SynchronousOnlyOperation` stack traces.
- Concurrent requests to HTTP and WebSocket remain uninterrupted.

### 2. Verifying Redis Cache Hits

Run Redis CLI to observe keys and monitor real-time cache hits:

```bash
# In Redis CLI
redis-cli
> KEYS su_connect:*
1) "su_connect:prayer_feed:..."
2) "su_connect:user_dir:..."

> MONITOR
```

Execute two consecutive requests to the prayer endpoint:
```powershell
curl -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:8000/api/prayer/
```

- **Request 1 (Cold Start)**:
  - PostgreSQL receives SQL queries.
  - Latency: ~40ms - 80ms.
  - Redis sets the key.
- **Request 2 (Cached Hit)**:
  - PostgreSQL receives 0 queries.
  - PgBouncer active client pool remains idle.
  - Latency: **< 2ms**.
  - Redis `GET` operation logged in `redis-cli MONITOR`.

---

## 📌 Implementation Checklist

- [ ] Check all consumers in `core/consumers.py` to ensure every DB query uses `@database_sync_to_async`.
- [ ] Confirm related models are prefetched via `select_related()` / `prefetch_related()` inside sync blocks.
- [ ] Set `CACHES` in `su_connect/settings/base.py` to `django.core.cache.backends.redis.RedisCache`.
- [ ] Decorate `PrayerRequestListCreateView.get()` with `@method_decorator(cache_page(60 * 15))`.
- [ ] Decorate `UserDirectoryView.get()` with `@method_decorator(cache_page(60 * 15))`.
- [ ] Add `vary_on_headers('Authorization')` to prevent cross-role or cross-region cache pollution.
- [ ] Register `post_save` / `post_delete` cache invalidation signals in `apps.prayer` and `apps.accounts`.

import json
from django.core.cache import cache
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin

class IdempotencyMiddleware(MiddlewareMixin):
    """
    Middleware that enforces idempotency on POST requests using the 'Idempotency-Key' header.
    Applies only to:
      - POST /api/reports
      - POST /api/support
      - POST /api/documents/upload
    Caches responses in Redis for 24 hours.
    """
    def process_request(self, request):
        if request.method == 'POST':
            path = request.path
            # Check target endpoints
            target_endpoints = ['/api/reports', '/api/support', '/api/documents/upload']
            is_target = any(path.rstrip('/').startswith(ep.rstrip('/')) for ep in target_endpoints)
            
            if is_target:
                key = request.headers.get('Idempotency-Key')
                if key:
                    cache_key = f"idempotent:{key}"
                    cached_data = cache.get(cache_key)
                    
                    if cached_data:
                        if cached_data == 'processing':
                            return HttpResponse(
                                json.dumps({"success": False, "error": "Conflict: Request with this Idempotency-Key is currently being processed."}),
                                content_type="application/json",
                                status=409
                            )
                        # Reconstruct response from cache
                        response = HttpResponse(
                            cached_data['content'],
                            content_type=cached_data['content_type'],
                            status=cached_data['status']
                        )
                        response['X-Cache-Lookup'] = 'HIT - Idempotent'
                        return response
                    
                    # Set a temporary locking flag for 60 seconds
                    cache.set(cache_key, 'processing', timeout=60)
                    request._idempotency_cache_key = cache_key
        return None

    def process_response(self, request, response):
        cache_key = getattr(request, '_idempotency_cache_key', None)
        if cache_key:
            # We only cache successful responses (2xx)
            if 200 <= response.status_code < 300:
                # Ensure the response is rendered before accessing its content
                if hasattr(response, 'render') and callable(response.render):
                    if not getattr(response, '_is_rendered', True):
                        try:
                            response.render()
                        except Exception:
                            pass
                cache.set(cache_key, {
                    'content': response.content,
                    'content_type': response.get('Content-Type', 'application/json'),
                    'status': response.status_code
                }, timeout=86400)  # 24 hours
            else:
                # Release processing lock on failure to allow retries
                cache.delete(cache_key)
        return response

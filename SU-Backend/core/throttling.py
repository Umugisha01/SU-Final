from rest_framework.throttling import SimpleRateThrottle

class AuthRateThrottle(SimpleRateThrottle):
    """
    Throttle for authentication endpoints: 5 requests per 15 minutes per IP.
    """
    scope = 'auth'

    def get_cache_key(self, request, view):
        return self.get_ident(request)

    def parse_rate(self, rate):
        if rate == '5/15min':
            return (5, 900)
        return super().parse_rate(rate)


class StandardRateThrottle(SimpleRateThrottle):
    """
    General rate limit: 120 requests per minute per authenticated user (or IP).
    """
    scope = 'user'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_user_{request.user.id}"
        return self.get_ident(request)


class AIRateThrottle(SimpleRateThrottle):
    """
    Throttle for AI processing requests: 5 requests per hour per organization (region).
    """
    scope = 'ai'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            # We group "organization" by user region to prevent regional overuse
            region = getattr(request.user, 'region', 'global')
            return f"throttle_ai_region_{region}"
        return self.get_ident(request)


class UploadRateThrottle(SimpleRateThrottle):
    """
    Throttle for file uploads: 30 uploads per hour per user.
    """
    scope = 'upload'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"throttle_upload_user_{request.user.id}"
        return self.get_ident(request)

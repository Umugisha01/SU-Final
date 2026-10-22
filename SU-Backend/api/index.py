import os
import sys
import traceback

# Ensure root directory of SU-Backend is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.production')

try:
    from su_connect.wsgi import application as django_app

    def app(environ, start_response):
        try:
            return django_app(environ, start_response)
        except Exception as e:
            err_trace = traceback.format_exc()
            print("WSGI RUNTIME EXCEPTION:\n", err_trace, file=sys.stderr)
            status = '500 Internal Server Error'
            headers = [('Content-Type', 'text/plain; charset=utf-8')]
            start_response(status, headers)
            return [f"Django Application Runtime Error:\n\n{err_trace}".encode('utf-8')]

except Exception as e:
    startup_trace = traceback.format_exc()
    print("DJANGO INITIALIZATION EXCEPTION:\n", startup_trace, file=sys.stderr)

    def app(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/plain; charset=utf-8')]
        start_response(status, headers)
        return [f"Django Startup Initialization Error:\n\n{startup_trace}".encode('utf-8')]

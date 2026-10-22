import os
import sys

# Add project root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set production settings as default for Vercel Serverless Function
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.production')

from su_connect.wsgi import application

# Vercel looks for the WSGI/ASGI callable named 'app'
app = application

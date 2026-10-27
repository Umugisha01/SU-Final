#!/bin/sh
set -e

# Optional: Run database migrations if RUN_MIGRATIONS is set to true
if [ "$RUN_MIGRATIONS" = "true" ] || [ "$RUN_MIGRATIONS" = "1" ]; then
    echo "Running database migrations..."
    python manage.py migrate --noinput
fi

# Optional: Collect static files if COLLECT_STATIC is set to true
if [ "$COLLECT_STATIC" = "true" ] || [ "$COLLECT_STATIC" = "1" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
fi

# Execute the main container command
exec "$@"

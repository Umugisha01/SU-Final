@echo off
setlocal
echo Stopping PgBouncer Docker container...
cd /d "%~dp0"
docker compose -f docker-compose.pgbouncer.yml down
echo Container stopped.
endlocal

@echo off
setlocal
echo ========================================================
echo   PgBouncer Docker Container Status
echo ========================================================
cd /d "%~dp0"
docker compose -f docker-compose.pgbouncer.yml ps
echo.
echo Container logs:
docker compose -f docker-compose.pgbouncer.yml logs --tail 20
endlocal

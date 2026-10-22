@echo off
setlocal
echo ========================================================
echo   Starting PgBouncer in Docker Container (Port 6432)
echo ========================================================
cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
    echo [ERROR] 'docker' command is not installed or not in PATH.
    echo.
    echo To install Docker Desktop on Windows:
    echo   1. Run in Administrator PowerShell: choco install docker-desktop -y
    echo   2. Or download from: https://www.docker.com/products/docker-desktop/
    echo   3. Launch Docker Desktop and rerun this script.
    echo.
    echo Note: Native Windows pgbouncer is currently available in \pgbouncer\
    pause
    exit /b 1
)

echo Checking if native Windows pgbouncer.exe is currently occupying port 6432...
taskkill /f /im pgbouncer.exe >nul 2>&1

echo Starting Docker container...
docker compose -f docker-compose.pgbouncer.yml up -d --build

if errorlevel 1 (
    echo [ERROR] Failed to start Docker container. Ensure Docker Desktop is running.
) else (
    echo [SUCCESS] PgBouncer container started on port 6432.
    echo.
    docker ps --filter "name=su_connect_pgbouncer"
)
endlocal

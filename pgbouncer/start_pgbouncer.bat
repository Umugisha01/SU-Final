@echo off
setlocal
echo ========================================================
echo   Starting PgBouncer for SU Connect (Port 6432)
echo ========================================================
cd /d "%~dp0"

tasklist /fi "imagename eq pgbouncer.exe" | find /i "pgbouncer.exe" >nul
if errorlevel 1 (
    start "" /b pgbouncer.exe pgbouncer.ini
    timeout /t 1 /nobreak >nul
    tasklist /fi "imagename eq pgbouncer.exe" | find /i "pgbouncer.exe" >nul
    if errorlevel 1 (
        echo [ERROR] Failed to start PgBouncer. Check pgbouncer.log for details.
    ) else (
        echo [SUCCESS] PgBouncer is running and listening on 127.0.0.1:6432.
    )
) else (
    echo [INFO] PgBouncer is already running on 127.0.0.1:6432.
)
endlocal

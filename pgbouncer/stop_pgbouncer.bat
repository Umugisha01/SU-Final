@echo off
setlocal
echo ========================================================
echo   Stopping PgBouncer
echo ========================================================
taskkill /f /im pgbouncer.exe >nul 2>&1
if errorlevel 1 (
    echo [INFO] PgBouncer is not currently running.
) else (
    echo [SUCCESS] PgBouncer process terminated.
)
endlocal

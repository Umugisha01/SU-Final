@echo off
setlocal
echo ========================================================
echo   PgBouncer Pool Status (SU Connect)
echo ========================================================
tasklist /fi "imagename eq pgbouncer.exe" | find /i "pgbouncer.exe" >nul
if errorlevel 1 (
    echo [STATUS] PgBouncer is NOT running.
) else (
    echo [STATUS] PgBouncer is RUNNING.
    echo.
    echo Querying pool stats via psql:
    set PGPASSWORD=Bnc20031!
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h 127.0.0.1 -p 6432 -U postgres -d pgbouncer -c "SHOW POOLS;"
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h 127.0.0.1 -p 6432 -U postgres -d pgbouncer -c "SHOW STATS;"
)
endlocal

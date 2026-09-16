@echo off
title CrewLink - Full Stack Internet Backend
cd /d "%~dp0"

echo ========================================================
echo   Starting CrewLink Services for Mobile Internet
echo ========================================================

:: 1. Check & Start MongoDB
echo [1/3] Checking MongoDB...
netstat -ano | findstr :27017 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo  MongoDB is already running on port 27017.
) else (
    echo  Starting MongoDB daemon...
    start "MongoDB Server" /min "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "%~dp0mongodb_data" --bind_ip 127.0.0.1 --logpath "%~dp0mongo.log"
    timeout /t 2 /nobreak >nul
)

:: 2. Check & Start Node Server
echo [2/3] Checking Backend Server...
netstat -ano | findstr :5000 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo  Backend server is already running on port 5000.
) else (
    echo  Starting Node backend server...
    start "CrewLink Node Server" /min node server/index.js
    timeout /t 2 /nobreak >nul
)

:: 3. Start Internet Tunnel
echo [3/3] Launching Public Internet Tunnel...
echo.
node run_tunnel.cjs
pause

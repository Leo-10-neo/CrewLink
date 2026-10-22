@echo off
title CrewLink - Local Development Environment
cd /d "%~dp0"

echo ========================================================
echo   Starting CrewLink Full Stack Local Development
echo   Hot-Reload Backend (port 5000) + Vite HMR (port 5173)
echo ========================================================
echo.

:: 1. Check & Ensure MongoDB is running
echo [1/3] Checking MongoDB...
netstat -ano | findstr :27017 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo  MongoDB is already running on port 27017.
) else (
    echo  Starting MongoDB daemon...
    start "MongoDB Server" /min "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "%~dp0mongodb_data" --bind_ip 127.0.0.1 --logpath "%~dp0mongo.log"
    timeout /t 2 /nobreak >nul
)

:: 2. Start Backend with file watching (auto-reloads on change)
echo [2/3] Starting Backend Server (node --watch server/index.js)...
start "CrewLink Node Backend" cmd /k "node --watch server/index.js"
timeout /t 2 /nobreak >nul

:: 3. Start Frontend Vite Dev Server with HMR (hot module replacement)
echo [3/3] Starting Frontend with Vite HMR...
echo.
echo ========================================================
echo   CrewLink Local Dev Environment is LIVE!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   Admin:    admin@crewlink.com     / admin123
echo   Volunteer: volunteer@crewlink.com / volunteer123
echo ========================================================
echo.

npm run dev -- --open

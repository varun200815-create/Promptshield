@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo   PROMPTSHIELD AI - Windows setup
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required. Install from https://nodejs.org/
  pause
  exit /b 1
)
echo.
echo Node and npm versions:
node --version
npm --version
echo.
echo Installing all workspace dependencies...
call npm install --no-audit --no-fund
if errorlevel 1 goto failed
if not exist backend\.env copy backend\.env.example backend\.env >nul
echo.
echo Setup complete. Run RUN-PROMPTSHIELD.bat to start both services.
pause
exit /b 0
:failed
echo.
echo npm install failed. Confirm this folder contains package.json, frontend, and backend.
echo If needed, delete node_modules and package-lock.json, then run npm install again.
pause
exit /b 1

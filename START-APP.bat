@echo off
title PromptShield AI v2 — Full Stack Server
echo ========================================================
echo   Starting PromptShield AI v2 (Frontend + Backend)
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ========================================================
if not exist "node_modules" (
  echo Installing dependencies...
  call npm.cmd install
)
call npm.cmd run dev
pause

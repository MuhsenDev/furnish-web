@echo off
title Furnish — local server
color 0E
echo.
echo  ========================================
echo            FURNISH LOCAL SERVER
echo  ========================================
echo.
echo  When you see "Accepting connections at..."
echo  open this URL in your browser:
echo.
echo      http://localhost:3000
echo.
echo  To stop the server, close this window.
echo.
echo  ----------------------------------------
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  ERROR: Node.js is not installed.
  echo.
  echo  Install it from https://nodejs.org
  echo  Pick the "LTS" download, run it, then
  echo  double-click this file again.
  echo.
  pause
  exit /b 1
)
cd /d "%~dp0"
npx --yes serve . -l 3000
pause

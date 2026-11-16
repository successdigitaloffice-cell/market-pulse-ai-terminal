@echo off
title Market Pulse - Check Status
cd /d "%~dp0"
node "%~dp0scripts\check_status.js"
echo.
pause

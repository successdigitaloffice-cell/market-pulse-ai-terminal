@echo off
title Market Pulse - Setup Permanent Windows Autostart
cd /d "%~dp0"
echo ================================================================
echo  Setting up Permanent Autostart after PC Restart / Reboot...
echo ================================================================
echo.
node "%~dp0scripts\register_autostart.js"
echo.
pause

@echo off
title Market Pulse - Mobile View Preview
cd /d "%~dp0"

echo ================================================================
echo  MARKET PULSE AI TERMINAL - 1-CLICK MOBILE VIEW PREVIEW
echo ================================================================
echo Launching standalone mobile phone view (412 x 915) on your screen...
echo.

set "TARGET_URL=http://localhost:5000/?mobile_sim=1"

:: 1. Try launching Google Chrome in standalone mobile app window
start "" chrome.exe --app="%TARGET_URL%" --window-size=412,915 2>nul
if %ERRORLEVEL% EQU 0 goto success

:: 2. Fallback: Try Microsoft Edge in standalone mobile app window
start "" msedge.exe --app="%TARGET_URL%" --window-size=412,915 2>nul
if %ERRORLEVEL% EQU 0 goto success

:: 3. Final Fallback: Standard browser
start "" "%TARGET_URL%"

:success
echo [OK] Mobile preview window launched successfully!
timeout /t 3 /nobreak >nul

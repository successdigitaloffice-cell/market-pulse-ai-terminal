@echo off
title Setup Free Permanent Ngrok Tunnel (24/7 Global Access)
color 0b
cls
echo ======================================================================
echo           MARKET LIVE AI TERMINAL - NGROK PERMANENT TUNNEL SETUP
echo ======================================================================
echo.
echo  Ngrok gives you 1 FREE Permanent Static Domain forever with 99.99%% uptime.
echo  It NEVER disconnects, NEVER changes links, and has NO password screens!
echo.
echo  STEP 1: Open https://dashboard.ngrok.com/get-started/your-authtoken
echo          (Sign up / Log in for FREE - takes 30 seconds)
echo.
echo  STEP 2: Copy your AuthToken from the page.
echo.
set /p NGROK_TOKEN="  STEP 3: Paste your Ngrok AuthToken here and press Enter: "

if "%NGROK_TOKEN%"=="" (
    echo.
    echo [ERROR] No token entered. Exiting setup.
    pause
    exit /b
)

echo.
echo [1/3] Saving Ngrok Token to .env...
echo NGROK_AUTHTOKEN=%NGROK_TOKEN%>> "%~dp0.env"

echo.
echo [2/3] Configuring Ngrok CLI...
npx -y ngrok config add-authtoken %NGROK_TOKEN%

echo.
echo [3/3] Setting Tunnel Provider to Ngrok in .env...
echo TUNNEL_PROVIDER=ngrok>> "%~dp0.env"

echo.
echo ======================================================================
echo  SUCCESS! Ngrok is now configured for 24/7 permanent high-speed access!
echo  Restarting Market Host Watchdog to apply changes...
echo ======================================================================
echo.
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
wscript "%~dp0scripts\MarketPulseBotHost.vbs"
echo Market Host Host restarted successfully.
pause

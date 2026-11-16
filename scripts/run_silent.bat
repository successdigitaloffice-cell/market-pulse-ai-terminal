@echo off
cd /d "%~dp0.."
start "" /B node "%~dp0host_watchdog.js"
exit

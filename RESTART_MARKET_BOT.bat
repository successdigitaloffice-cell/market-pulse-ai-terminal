@echo off
cd /d "%~dp0"
node "%~dp0scripts\stop_host.js"
ping 127.0.0.1 -n 3 >nul
wscript "%~dp0scripts\host_runner.vbs"
exit

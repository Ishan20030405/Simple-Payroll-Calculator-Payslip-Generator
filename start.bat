@echo off
setlocal
cd /d "%~dp0"
echo Opening local Payroll and HR...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
if errorlevel 1 pause

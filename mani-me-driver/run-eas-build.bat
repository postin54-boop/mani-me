@echo off
cd /d "%~dp0"
echo Current directory: %CD%
eas build --platform android --profile preview --non-interactive
echo Build command finished with exit code: %ERRORLEVEL%
pause

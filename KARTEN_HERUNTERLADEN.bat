@echo off
chcp 65001 >nul
echo DieDonuts - CS2 Kartenbilder holen
echo =====================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get_maps.ps1"
echo.
pause

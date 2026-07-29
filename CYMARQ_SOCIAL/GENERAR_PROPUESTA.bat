@echo off
chcp 65001 >nul
title CYMARQ SOCIAL - Generar propuesta
cd /d "%~dp0"

python cymarq.py escanear
echo.
python cymarq.py generar
echo.
echo   Revisa la propuesta en la carpeta PENDIENTES o en el panel local.
pause

@echo off
chcp 65001 >nul
title CYMARQ SOCIAL - Panel local
cd /d "%~dp0"

echo ==============================================================
echo   CYMARQ SOCIAL - iniciando panel local
echo   (no se publica nada en Instagram ni Facebook)
echo ==============================================================
echo.

python cymarq.py panel
if errorlevel 1 (
  echo.
  echo   No se pudo iniciar. Verifica que Python este instalado:
  echo       python --version
  echo.
  pause
)

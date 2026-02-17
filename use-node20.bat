@echo off
setlocal

REM === Ruta donde está node.exe ===
set NODE20=C:\Users\RubenVillarGonzalez\Desktop\Instalacion\nodejs\nodejs\node-v20.19.0-win-x64

REM === Activar Node 20 SOLO en esta sesión ===
set PATH=%NODE20%;%NODE20%\node_modules\npm\bin;%PATH%

echo ===========================================
echo   USANDO NODE PORTABLE PARA ESTE PROYECTO
echo ===========================================

echo Node version:
"%NODE20%\node.exe" -v
echo.

echo NPM version:
"%NODE20%\npm.cmd" -v
echo.

echo AHORA SE ABRIRÁ UNA CONSOLA CON NODE 20 ACTIVADO
echo Pulsa CTRL + C para cerrarla cuando termines.
echo.

REM === Abrir una consola CMD y NO cerrarla ===
cmd /K
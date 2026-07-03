@echo off
REM ================================================
REM Qdrant Vector Database - Windows Startup Script
REM ResumePilot AI
REM ================================================

set QDRANT_DIR=%~dp0

REM Default data directory (persistent storage)
if "%QDRANT_DATA_DIR%"=="" set QDRANT_DATA_DIR=%QDRANT_DIR%data

REM Create data directory if not exists
if not exist "%QDRANT_DATA_DIR%" mkdir "%QDRANT_DATA_DIR%"

echo.
echo   ResumePilot AI - Qdrant Vector Database
echo   Data: %QDRANT_DATA_DIR%
echo   HTTP: http://localhost:6333
echo   Dashboard: http://localhost:6333/dashboard
echo.

REM Start Qdrant
"%QDRANT_DIR%qdrant.exe" --storage-path "%QDRANT_DATA_DIR%"

pause

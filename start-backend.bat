@echo off
cd /d "%~dp0backend"
py -m uvicorn app.main:app --reload --port 8000

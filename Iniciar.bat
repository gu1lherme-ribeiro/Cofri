@echo off
setlocal
cd /d "%~dp0"
title Cofri launcher

REM Verifica se pnpm esta instalado.
where pnpm >nul 2>&1
if errorlevel 1 (
  echo.
  echo [erro] pnpm nao encontrado no PATH.
  echo        Instale com: npm i -g pnpm
  echo.
  pause
  exit /b 1
)

REM Verifica se o .env esta presente.
if not exist ".env" (
  echo.
  echo [erro] .env nao encontrado em %CD%.
  echo        Crie a partir do .env.example antes de iniciar.
  echo.
  pause
  exit /b 1
)

echo.
echo Subindo Cofri em duas janelas:
echo   - Bot     (polling Telegram, recompila em hot reload)
echo   - Web     (Next.js em http://localhost:3000)
echo.
echo Feche as janelas pra encerrar os processos. Esta janela
echo pode ser fechada com seguranca depois.
echo.

start "Cofri - Bot" cmd /k "pnpm bot:dev"
start "Cofri - Web" cmd /k "pnpm web:dev"

timeout /t 4 >nul
endlocal

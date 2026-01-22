@echo off
REM Test script for the cron endpoint on Windows
REM Usage: test-cron.bat [local|production]

set MODE=%1
if "%MODE%"=="" set MODE=local

if "%MODE%"=="local" (
  set URL=http://localhost:4239/api/cron/generate-recurring-invoices
  echo Testing LOCAL endpoint: %URL%
) else (
  REM Replace with your actual production URL
  set URL=https://e2w-finance.vercel.app/api/cron/generate-recurring-invoices
  echo Testing PRODUCTION endpoint: %URL%
)

REM Prompt for CRON_SECRET
set /p CRON_SECRET="Enter CRON_SECRET: "

echo Making request with Authorization header...
echo.

curl -X GET "%URL%" -H "Authorization: Bearer %CRON_SECRET%" -H "Content-Type: application/json" -w "\n\nHTTP Status: %%{http_code}\n"

echo.
echo Test complete!
pause

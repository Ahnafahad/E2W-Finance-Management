{
  "cron": [
    {
      "path": "/api/recurring/generate",
      "schedule": "0 0 * * *"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}

#!/bin/bash

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start the app
echo "Starting application..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT

#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U postgres; do
  sleep 1
done

echo "PostgreSQL is ready!"

# Run migrations if needed
if [ -f /docker-entrypoint-initdb.d/001_initial_schema.sql ]; then
    echo "Running initial schema..."
    psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/001_initial_schema.sql
fi

echo "Database initialization complete!"
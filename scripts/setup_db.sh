#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Configuration
DB_NAME="sendam"
DB_USER="kashim"
DB_PASS="password"
DB_HOST="localhost"
DB_PORT="5432"

echo "🐘 Initializing Database Setup for SendAm..."

# Create database and user if they don't exist
sudo -u postgres psql <<EOF
DO \$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS' CREATEDB;
    END IF;
END
\$$;

SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Enable PostGIS
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS postgis;
EOF

echo "✅ Database '$DB_NAME' created and owned by '$DB_USER'."

# Update .env file using absolute path
ENV_FILE="$PROJECT_ROOT/backend/.env"
DB_URL="postgresql+asyncpg://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"

if [ -f "$ENV_FILE" ]; then
    sed -i '/^DATABASE_URL=/d' "$ENV_FILE"
    echo "DATABASE_URL=$DB_URL" >> "$ENV_FILE"
    echo "🚀 Updated $ENV_FILE with new DATABASE_URL."
else
    # Create the directory if it doesn't exist
    mkdir -p "$(dirname "$ENV_FILE")"
    echo "DATABASE_URL=$DB_URL" > "$ENV_FILE"
    echo "📝 Created $ENV_FILE with DATABASE_URL."
fi

echo "✨ Backend is now wired to $DB_NAME."

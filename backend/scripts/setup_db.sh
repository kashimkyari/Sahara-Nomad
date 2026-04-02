#!/bin/bash

# Configuration
DB_NAME="sendam"
DB_USER="kashim"
DB_PASS="password"
DB_HOST="localhost"
DB_PORT="5432"

echo "🐘 Initializing Database Setup for Sahara Nomad..."

# Create database and user if they don't exist
# We use sudo -u postgres to ensure we have permission to create roles/dbs
sudo -u postgres psql <<EOF
-- Create User
DO \$$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS' CREATEDB;
    END IF;
END
\$$;

-- Create Database
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant Privileges
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "✅ Database '$DB_NAME' created and owned by '$DB_USER'."

# Update .env file
ENV_FILE="backend/.env"
DB_URL="postgresql+asyncpg://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"

if [ -f "$ENV_FILE" ]; then
    # Remove existing DATABASE_URL line if it exists
    sed -i '/^DATABASE_URL=/d' "$ENV_FILE"
    # Append the new one
    echo "DATABASE_URL=$DB_URL" >> "$ENV_FILE"
    echo "🚀 Updated $ENV_FILE with new DATABASE_URL."
else
    echo "DATABASE_URL=$DB_URL" > "$ENV_FILE"
    echo "📝 Created $ENV_FILE with DATABASE_URL."
fi

echo "✨ Backend is now wired to $DB_NAME."

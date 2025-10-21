#!/bin/bash

echo "🧹 CoLiv Database Cleanup Script"
echo "================================"
echo ""

# Check environment
ENVIRONMENT=$(grep ENVIRONMENT .env 2>/dev/null | cut -d '=' -f2)

if [ "$ENVIRONMENT" = "production" ]; then
    echo "❌ ERROR: Cannot run cleanup script in PRODUCTION environment!"
    echo ""
    echo "This script is for development only."
    echo "To clean production data, use Railway connect method."
    exit 1
fi

# Get database URL to show which database will be cleaned
DB_URL=$(grep DATABASE_URL .env 2>/dev/null | cut -d '=' -f2)

echo "Environment: ${ENVIRONMENT:-development}"
echo "Database: ${DB_URL:-localhost Docker}"
echo ""
echo "⚠️  WARNING: This will DELETE ALL DATA from your local database!"
echo "This action cannot be undone."
echo ""

# Wait for user confirmation
read -p "Are you sure you want to continue? Type 'yes' to proceed: " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "🗑️  Cleaning local database..."

# Clean database
docker exec -i colivos_db psql -U colivos_user -d colivos_db << 'EOSQL'
-- Disable triggers temporarily for faster deletion
SET session_replication_role = 'replica';

-- Delete in correct order (respecting foreign keys)
TRUNCATE TABLE tenant_preferences CASCADE;
TRUNCATE TABLE announcements CASCADE;
TRUNCATE TABLE maintenance_requests CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE tenants CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE units CASCADE;
TRUNCATE TABLE properties CASCADE;
TRUNCATE TABLE operators CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

EOSQL

echo ""
echo "✅ Local database cleaned successfully!"
echo "All tables are now empty but schema is intact."
echo ""
echo "You can now create a fresh operator account and start over."

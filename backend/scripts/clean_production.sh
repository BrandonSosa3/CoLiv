#!/bin/bash

echo "🚨 PRODUCTION DATABASE CLEANUP"
echo "=============================="
echo ""
echo "⚠️  DANGER: This will delete ALL data from your Railway production database!"
echo "This includes all users, properties, tenants, payments, and preferences."
echo ""
echo "Make sure you understand the consequences:"
echo "- All operator accounts will be deleted"
echo "- All tenant accounts will be deleted"  
echo "- All property/unit/room data will be deleted"
echo "- All payment history will be deleted"
echo "- All preferences and matches will be deleted"
echo ""

read -p "Type 'DELETE EVERYTHING' to confirm: " confirm
if [ "$confirm" != "DELETE EVERYTHING" ]; then
    echo "❌ Aborted - confirmation did not match"
    exit 1
fi

echo ""
echo "🗑️  Connecting to production database..."

# Use Railway CLI to connect and run cleanup
railway connect << 'EOSQL'
-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Delete all data
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

-- Verify tables are empty
SELECT 'users' as table_name, count(*) as rows FROM users
UNION ALL
SELECT 'operators', count(*) FROM operators
UNION ALL  
SELECT 'properties', count(*) FROM properties
UNION ALL
SELECT 'units', count(*) FROM units
UNION ALL
SELECT 'rooms', count(*) FROM rooms
UNION ALL
SELECT 'tenants', count(*) FROM tenants
UNION ALL
SELECT 'payments', count(*) FROM payments;

EOSQL

echo ""
echo "✅ Production database cleaned!"
echo ""
echo "Next steps:"
echo "1. Go to https://co-liv.vercel.app"
echo "2. Sign up with a new operator account"
echo "3. Start fresh!"

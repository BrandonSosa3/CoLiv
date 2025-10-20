#!/bin/bash

echo "🧹 Cleaning CoLiv Database..."
echo "This will remove all data but preserve the schema."
echo ""

read -p "Are you sure you want to delete ALL data? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

docker exec -i colivos_db psql -U colivos_user -d colivos_db << 'EOSQL'
SET session_replication_role = 'replica';
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
SET session_replication_role = 'origin';
EOSQL

echo ""
echo "✅ Database cleaned successfully!"

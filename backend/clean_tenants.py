"""
Script to clean all tenants and payments from the database.
This will:
1. Delete all payments
2. Delete all tenants
3. Delete all tenant user accounts
4. Mark all rooms as vacant
5. Keep properties, units, rooms, and operators intact
"""

from app.database import get_db
from app.models.payment import Payment
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.user import User


def clean_database():
    db = next(get_db())
    
    try:
        # Get all tenant user IDs before deleting tenants
        tenant_records = db.query(Tenant).all()
        tenant_user_ids = [t.user_id for t in tenant_records]

        # Delete all payments
        payments_deleted = db.query(Payment).delete()
        print(f"✅ Deleted {payments_deleted} payments")

        # Delete all tenants
        tenants_deleted = db.query(Tenant).delete()
        print(f"✅ Deleted {tenants_deleted} tenants")

        # Delete all tenant user accounts
        users_deleted = 0
        for user_id in tenant_user_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.role == 'tenant':
                db.delete(user)
                users_deleted += 1
        print(f"✅ Deleted {users_deleted} tenant user accounts")

        # Mark all rooms as vacant
        rooms = db.query(Room).all()
        for room in rooms:
            room.status = "vacant"
        print(f"✅ Marked {len(rooms)} rooms as vacant")

        db.commit()
        print("\n🎉 Database cleaned successfully!")
        print("\nYou can now:")
        print("1. Assign new tenants with any email")
        print("2. Payments will be created automatically")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    print("🧹 Cleaning database...")
    print("This will delete all tenants, their user accounts, and payments\n")
    confirm = input("Are you sure? (yes/no): ")
    if confirm.lower() == 'yes':
        clean_database()
    else:
        print("❌ Cancelled")

"""
Complete database cleanup - removes ALL tenant users
"""

from app.database import get_db
from app.models.payment import Payment
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.user import User

def clean_database():
    db = next(get_db())
    
    try:
        # Delete all payments
        payments_deleted = db.query(Payment).delete()
        print(f"✅ Deleted {payments_deleted} payments")
        
        # Delete all tenants
        tenants_deleted = db.query(Tenant).delete()
        print(f"✅ Deleted {tenants_deleted} tenants")
        
        # Delete ALL users with role='tenant'
        tenant_users = db.query(User).filter(User.role == 'tenant').all()
        for user in tenant_users:
            db.delete(user)
        print(f"✅ Deleted {len(tenant_users)} tenant users")
        
        # Mark all rooms as vacant
        rooms = db.query(Room).all()
        for room in rooms:
            room.status = "vacant"
        print(f"✅ Marked {len(rooms)} rooms as vacant")
        
        db.commit()
        print("\n🎉 Database completely cleaned!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()

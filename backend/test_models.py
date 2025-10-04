from app.database import SessionLocal
from app.models import User, UserRole, Operator, Property

# Create session
db = SessionLocal()

try:
    # Create a test user
    user = User(
        email="test@example.com",
        password_hash="hashed_password_here",
        role=UserRole.OPERATOR
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    print(f"✅ Created user: {user.id}, {user.email}")
    
    # Create operator
    operator = Operator(
        user_id=user.id,
        company_name="Test Co-Living",
        phone="555-0123"
    )
    db.add(operator)
    db.commit()
    db.refresh(operator)
    
    print(f"✅ Created operator: {operator.id}, {operator.company_name}")
    
    # Create property
    property = Property(
        operator_id=operator.id,
        name="Downtown Loft",
        address="123 Main St",
        city="San Diego",
        state="CA",
        zip="92101",
        amenities={"gym": True, "rooftop": True}
    )
    db.add(property)
    db.commit()
    db.refresh(property)
    
    print(f"✅ Created property: {property.id}, {property.name}")
    
    # Query back
    fetched_property = db.query(Property).filter(Property.name == "Downtown Loft").first()
    print(f"✅ Fetched property: {fetched_property.name}, Operator: {fetched_property.operator.company_name}")
    
    print("\n✅ All models working correctly!")
    
finally:
    db.close()

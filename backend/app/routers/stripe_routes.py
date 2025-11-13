from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.payment import Payment
from app.services.stripe_service import StripeService
from app.utils.auth import get_current_user
import stripe
import os

router = APIRouter(prefix="/stripe", tags=["Stripe"])

def get_current_tenant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Tenant:
    """Get the current tenant from the authenticated user"""
    if current_user.role != 'tenant':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Tenant role required."
        )
    
    tenant = db.query(Tenant).filter(Tenant.user_id == current_user.id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found"
        )
    
    return tenant


@router.post("/create-payment-intent/{payment_id}")
def create_payment_intent(
    payment_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a Stripe payment intent for a specific payment"""
    
    # Get the payment
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.tenant_id == tenant.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check if payment is already paid
    if payment.status == 'paid':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment already completed"
        )
    
    # Get tenant's email
    from app.models.user import User
    user = db.query(User).filter(User.id == tenant.user_id).first()
    
    # Create payment intent
    try:
        result = StripeService.create_payment_intent(
            amount=payment.amount,
            payment_id=str(payment.id),
            tenant_email=user.email
        )
        
        # Store the payment intent ID in the payment record
        payment.stripe_payment_id = result["payment_intent_id"]
        db.commit()
        
        return {
            "clientSecret": result["client_secret"],
            "publishableKey": os.getenv("STRIPE_PUBLISHABLE_KEY", ""),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        payment_id = payment_intent["metadata"].get("payment_id")
        
        if payment_id:
            payment = db.query(Payment).filter(Payment.id == payment_id).first()
            if payment:
                from datetime import datetime
                payment.status = "paid"
                payment.paid_date = datetime.fromtimestamp(payment_intent.get("created")).date()
                payment.payment_method = "stripe"
                db.commit()
    
    elif event["type"] == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        payment_id = payment_intent["metadata"].get("payment_id")
        
        if payment_id:
            payment = db.query(Payment).filter(Payment.id == payment_id).first()
            if payment:
                payment.status = "failed"
                db.commit()
    
    return {"status": "success"}


@router.get("/config")
def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return {
        "publishableKey": os.getenv("STRIPE_PUBLISHABLE_KEY", ""),
    }

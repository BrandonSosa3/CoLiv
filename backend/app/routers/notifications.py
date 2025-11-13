from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_operator
from app.services.payment_reminder_service import PaymentReminderService

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/send-payment-reminders")
def trigger_payment_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Manually trigger payment reminders (operators only)"""
    
    try:
        PaymentReminderService.send_payment_reminders(db)
        return {"message": "Payment reminders sent successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send reminders: {str(e)}"
        )


@router.post("/send-announcement/{announcement_id}")
def send_announcement_notification(
    announcement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_operator)
):
    """Send announcement notification to all tenants"""
    
    try:
        PaymentReminderService.send_announcement_notifications(db, announcement_id)
        return {"message": "Announcement notifications sent successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send notifications: {str(e)}"
        )

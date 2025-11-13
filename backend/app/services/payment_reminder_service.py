from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from app.models.payment import Payment
from app.models.tenant import Tenant
from app.models.user import User
from app.services.email_service import EmailService

class PaymentReminderService:
    @staticmethod
    def send_payment_reminders(db: Session):
        """
        Check for upcoming payments and send reminders
        - 7 days before due date
        - 3 days before due date
        - On due date
        - Every day after due date (overdue)
        """
        today = date.today()
        
        # Get all pending and overdue payments
        payments = db.query(Payment).filter(
            Payment.status.in_(['pending', 'overdue'])
        ).all()
        
        for payment in payments:
            days_until_due = (payment.due_date - today).days
            
            # Determine if we should send a reminder
            should_send = False
            
            if days_until_due == 7:
                should_send = True  # 7 days before
            elif days_until_due == 3:
                should_send = True  # 3 days before
            elif days_until_due == 0:
                should_send = True  # Due today
            elif days_until_due < 0:
                should_send = True  # Overdue
            
            if should_send:
                # Get tenant info
                tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
                if tenant:
                    user = db.query(User).filter(User.id == tenant.user_id).first()
                    if user:
                        try:
                            tenant_name = f"{user.first_name} {user.last_name}" if user.first_name else user.email
                            
                            EmailService.send_payment_reminder(
                                tenant_email=user.email,
                                tenant_name=tenant_name,
                                amount=float(payment.amount),
                                due_date=payment.due_date,
                                days_until_due=days_until_due
                            )
                            
                            print(f"✅ Payment reminder sent to {user.email} (Due: {payment.due_date}, Days: {days_until_due})")
                        except Exception as e:
                            print(f"❌ Failed to send reminder to {user.email}: {str(e)}")
    
    @staticmethod
    def send_announcement_notifications(db: Session, announcement_id: str):
        """Send announcement notifications to all tenants"""
        from app.models.announcement import Announcement
        
        announcement = db.query(Announcement).filter(
            Announcement.id == announcement_id
        ).first()
        
        if not announcement:
            return
        
        # Get all active tenants
        tenants = db.query(Tenant).filter(Tenant.status == 'active').all()
        
        for tenant in tenants:
            user = db.query(User).filter(User.id == tenant.user_id).first()
            if user:
                try:
                    tenant_name = f"{user.first_name} {user.last_name}" if user.first_name else user.email
                    
                    EmailService.send_announcement_notification(
                        tenant_email=user.email,
                        tenant_name=tenant_name,
                        announcement_title=announcement.title,
                        announcement_content=announcement.content,
                        announcement_date=announcement.created_at
                    )
                    
                    print(f"✅ Announcement notification sent to {user.email}")
                except Exception as e:
                    print(f"❌ Failed to send announcement to {user.email}: {str(e)}")

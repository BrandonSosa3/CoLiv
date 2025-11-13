import resend
import os
from typing import Optional
from datetime import datetime, date

# Initialize Resend with API key
resend.api_key = os.getenv("RESEND_API_KEY", "")

class EmailService:
    FROM_EMAIL = "CoLiv <noreply@resend.dev>"  # We'll update this with your domain later
    
    @staticmethod
    def send_payment_reminder(
        tenant_email: str,
        tenant_name: str,
        amount: float,
        due_date: date,
        days_until_due: int
    ):
        """Send payment reminder email to tenant"""
        
        if days_until_due > 0:
            subject = f"Payment Reminder: ${amount:.2f} due in {days_until_due} days"
            urgency = "upcoming"
        elif days_until_due == 0:
            subject = f"Payment Due Today: ${amount:.2f}"
            urgency = "today"
        else:
            subject = f"Overdue Payment: ${amount:.2f} - Please Pay Immediately"
            urgency = "overdue"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .amount {{
                    font-size: 36px;
                    font-weight: bold;
                    color: {'#ff453a' if urgency == 'overdue' else '#667eea'};
                    margin: 20px 0;
                }}
                .due-date {{
                    font-size: 18px;
                    color: {'#ff453a' if urgency == 'overdue' else '#666'};
                    margin: 10px 0;
                }}
                .button {{
                    display: inline-block;
                    background: {'#ff453a' if urgency == 'overdue' else '#667eea'};
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-weight: bold;
                }}
                .footer {{
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>💰 Payment {'Overdue' if urgency == 'overdue' else 'Reminder'}</h1>
            </div>
            <div class="content">
                <p>Hi {tenant_name},</p>
                
                {'<p style="color: #ff453a; font-weight: bold;">⚠️ This payment is overdue. Please pay immediately to avoid late fees.</p>' if urgency == 'overdue' else ''}
                
                <p>This is a {'friendly reminder' if urgency != 'overdue' else 'notice'} about your upcoming rent payment:</p>
                
                <div class="amount">${amount:.2f}</div>
                <div class="due-date">
                    Due Date: {due_date.strftime('%B %d, %Y')}
                    {f'({days_until_due} days from now)' if days_until_due > 0 else '(Today!)' if days_until_due == 0 else f'({abs(days_until_due)} days overdue)'}
                </div>
                
                <center>
                    <a href="https://your-tenant-portal.com/payments" class="button">
                        Pay Now
                    </a>
                </center>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    If you've already paid, please disregard this message. If you have any questions, 
                    please contact your property manager.
                </p>
            </div>
            <div class="footer">
                <p>CoLiv Property Management</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            response = resend.Emails.send({
                "from": EmailService.FROM_EMAIL,
                "to": [tenant_email],
                "subject": subject,
                "html": html_content,
            })
            return response
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            raise
    
    @staticmethod
    def send_payment_confirmation(
        tenant_email: str,
        tenant_name: str,
        amount: float,
        payment_date: date,
        payment_method: str = "Stripe"
    ):
        """Send payment confirmation email to tenant"""
        
        subject = f"Payment Confirmed: ${amount:.2f}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #32d74b 0%, #2fb844 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .checkmark {{
                    font-size: 48px;
                    margin: 20px 0;
                }}
                .amount {{
                    font-size: 36px;
                    font-weight: bold;
                    color: #32d74b;
                    margin: 20px 0;
                }}
                .details {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }}
                .footer {{
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="checkmark">✅</div>
                <h1>Payment Received!</h1>
            </div>
            <div class="content">
                <p>Hi {tenant_name},</p>
                
                <p>Thank you for your payment! We've successfully received your rent payment.</p>
                
                <div class="details">
                    <div class="detail-row">
                        <span>Amount:</span>
                        <span class="amount">${amount:.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span>Payment Date:</span>
                        <span>{payment_date.strftime('%B %d, %Y')}</span>
                    </div>
                    <div class="detail-row">
                        <span>Payment Method:</span>
                        <span>{payment_method}</span>
                    </div>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    This email serves as your receipt. Please keep it for your records.
                </p>
            </div>
            <div class="footer">
                <p>CoLiv Property Management</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            response = resend.Emails.send({
                "from": EmailService.FROM_EMAIL,
                "to": [tenant_email],
                "subject": subject,
                "html": html_content,
            })
            return response
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            raise
    
    @staticmethod
    def send_announcement_notification(
        tenant_email: str,
        tenant_name: str,
        announcement_title: str,
        announcement_content: str,
        announcement_date: datetime
    ):
        """Send new announcement notification to tenant"""
        
        subject = f"New Announcement: {announcement_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .announcement {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                }}
                .button {{
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-weight: bold;
                }}
                .footer {{
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📢 New Announcement</h1>
            </div>
            <div class="content">
                <p>Hi {tenant_name},</p>
                
                <p>Your property manager has posted a new announcement:</p>
                
                <div class="announcement">
                    <h2 style="margin-top: 0; color: #667eea;">{announcement_title}</h2>
                    <p style="white-space: pre-wrap;">{announcement_content}</p>
                    <p style="font-size: 12px; color: #999; margin-bottom: 0;">
                        Posted on {announcement_date.strftime('%B %d, %Y at %I:%M %p')}
                    </p>
                </div>
                
                <center>
                    <a href="https://your-tenant-portal.com/announcements" class="button">
                        View All Announcements
                    </a>
                </center>
            </div>
            <div class="footer">
                <p>CoLiv Property Management</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            response = resend.Emails.send({
                "from": EmailService.FROM_EMAIL,
                "to": [tenant_email],
                "subject": subject,
                "html": html_content,
            })
            return response
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            raise

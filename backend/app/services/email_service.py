import resend
import os
from typing import Optional
from datetime import datetime, date

# Initialize Resend with API key
resend.api_key = os.getenv("RESEND_API_KEY", "")

class EmailService:
    FROM_EMAIL = "CoLiv <onboarding@resend.dev>"  # We'll update this with your domain later
    
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

    @staticmethod
    def send_operator_payment_received(
        operator_email: str,
        operator_name: str,
        tenant_name: str,
        tenant_email: str,
        amount: float,
        payment_date: date,
        property_name: str,
        unit_number: str,
        room_number: str
    ):
        """Send payment received notification to operator"""
        
        subject = f"💰 Payment Received: ${amount:.2f} from {tenant_name}"
        
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
                .amount {{
                    font-size: 42px;
                    font-weight: bold;
                    color: #32d74b;
                    margin: 20px 0;
                    text-align: center;
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
                    padding: 12px 0;
                    border-bottom: 1px solid #eee;
                }}
                .detail-row:last-child {{
                    border-bottom: none;
                }}
                .detail-label {{
                    color: #666;
                    font-weight: 500;
                }}
                .detail-value {{
                    color: #333;
                    font-weight: 600;
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
                <div style="font-size: 48px; margin-bottom: 10px;">💰</div>
                <h1>Payment Received!</h1>
            </div>
            <div class="content">
                <p>Hi {operator_name},</p>
                
                <p>Great news! You've received a payment:</p>
                
                <div class="amount">${amount:.2f}</div>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Tenant:</span>
                        <span class="detail-value">{tenant_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">{tenant_email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Property:</span>
                        <span class="detail-value">{property_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">Unit {unit_number}, Room {room_number}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Date:</span>
                        <span class="detail-value">{payment_date.strftime('%B %d, %Y')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Method:</span>
                        <span class="detail-value">Stripe</span>
                    </div>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                    The funds will be deposited to your account according to your Stripe payout schedule.
                </p>
            </div>
            <div class="footer">
                <p>CoLiv Property Management</p>
                <p>This is an automated notification from your property management system.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            response = resend.Emails.send({
                "from": EmailService.FROM_EMAIL,
                "to": [operator_email],
                "subject": subject,
                "html": html_content,
            })
            return response
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            raise
    
    @staticmethod
    def send_operator_maintenance_request(
        operator_email: str,
        operator_name: str,
        tenant_name: str,
        tenant_email: str,
        property_name: str,
        unit_number: str,
        room_number: str,
        issue_type: str,
        description: str,
        urgency: str,
        request_date: datetime
    ):
        """Send new maintenance request notification to operator"""
        
        urgency_colors = {
            'low': '#32d74b',
            'medium': '#ffd60a',
            'high': '#ff9f0a',
            'emergency': '#ff453a'
        }
        urgency_color = urgency_colors.get(urgency.lower(), '#667eea')
        
        subject = f"🔧 New Maintenance Request: {issue_type} ({urgency.upper()})"
        
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
                .urgency-badge {{
                    display: inline-block;
                    background: {urgency_color};
                    color: white;
                    padding: 8px 20px;
                    border-radius: 20px;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 14px;
                    margin: 10px 0;
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
                    padding: 12px 0;
                    border-bottom: 1px solid #eee;
                }}
                .detail-row:last-child {{
                    border-bottom: none;
                }}
                .description {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid {urgency_color};
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
                <div style="font-size: 48px; margin-bottom: 10px;">🔧</div>
                <h1>New Maintenance Request</h1>
            </div>
            <div class="content">
                <p>Hi {operator_name},</p>
                
                <p>You have received a new maintenance request:</p>
                
                <center>
                    <span class="urgency-badge">{urgency} Priority</span>
                </center>
                
                <div class="details">
                    <div class="detail-row">
                        <span style="color: #666;">Tenant:</span>
                        <span style="font-weight: 600;">{tenant_name}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Email:</span>
                        <span>{tenant_email}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Property:</span>
                        <span>{property_name}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Location:</span>
                        <span>Unit {unit_number}, Room {room_number}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Issue Type:</span>
                        <span style="font-weight: 600;">{issue_type}</span>
                    </div>
                    <div class="detail-row">
                        <span style="color: #666;">Submitted:</span>
                        <span>{request_date.strftime('%B %d, %Y at %I:%M %p')}</span>
                    </div>
                </div>
                
                <div class="description">
                    <h3 style="margin-top: 0; color: #333;">Description:</h3>
                    <p style="white-space: pre-wrap; margin-bottom: 0;">{description}</p>
                </div>
                
                <center>
                    <a href="https://your-operator-portal.com/maintenance" class="button">
                        View in Dashboard
                    </a>
                </center>
            </div>
            <div class="footer">
                <p>CoLiv Property Management</p>
                <p>This is an automated notification from your property management system.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            response = resend.Emails.send({
                "from": EmailService.FROM_EMAIL,
                "to": [operator_email],
                "subject": subject,
                "html": html_content,
            })
            return response
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            raise
    
    @staticmethod
    def send_operator_overdue_summary(
        operator_email: str,
        operator_name: str,
        overdue_payments: list
    ):
        """Send daily summary of overdue payments to operator"""
        
        total_overdue = sum(payment['amount'] for payment in overdue_payments)
        
        subject = f"⚠️ Overdue Payments Summary: {len(overdue_payments)} payments (${total_overdue:.2f})"
        
        rows_html = ""
        for payment in overdue_payments:
            days_overdue = abs(payment['days_overdue'])
            rows_html += f"""
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; color: #333;">{payment['tenant_name']}</td>
                <td style="padding: 12px; color: #333;">{payment['property']}</td>
                <td style="padding: 12px; color: #ff453a; font-weight: 600;">${payment['amount']:.2f}</td>
                <td style="padding: 12px; color: #ff453a;">{days_overdue} days</td>
            </tr>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #ff453a 0%, #ff3b30 100%);
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
                .summary {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: center;
                }}
                .total {{
                    font-size: 36px;
                    font-weight: bold;
                    color: #ff453a;
                    margin: 10px 0;
                }}
                table {{
                    width: 100%;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 20px 0;
                }}
                th {{
                    background: #f5f5f5;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #666;
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
                <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                <h1>Overdue Payments Report</h1>
            </div>
            <div class="content">
                <p>Hi {operator_name},</p>
                
                <p>Here's your daily summary of overdue payments:</p>
                
                <div class="summary">
                    <p style="margin: 0; color: #666;">Total Overdue Amount</p>
                    <div class="total">${total_overdue:.2f}</div>
                    <p style="margin: 0; color: #666;">{len(overdue_payments)} payment{'' if len(overdue_payments) == 1 else 's'} overdue</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Tenant</th>
                            <th>Property</th>
                            <th>Amount</th>
                            <th>Days Overdue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows_html}
                    </tbody>
                </table>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    💡 Tip: Consider reaching out to tenants with overdue payments to avoid further delays.
                </p>
            </div>
            <div class="footer">
                <p>CoLiv Property Management</p>
                <p>This is an automated daily report from your property management system.</p>
            </div>
        </body>
        </html>
        """
        
        try:
            response = resend.Emails.send({
                "from": EmailService.FROM_EMAIL,
                "to": [operator_email],
                "subject": subject,
                "html": html_content,
            })
            return response
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            raise

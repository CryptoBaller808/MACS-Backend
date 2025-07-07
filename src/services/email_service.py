import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

class EmailService:
    def __init__(self):
        # Email configuration (in production, use environment variables)
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email_user = os.getenv('EMAIL_USER', 'noreply@macsplatform.com')
        self.email_password = os.getenv('EMAIL_PASSWORD', 'your-app-password')
        self.from_name = 'MACS Platform'
        
    def send_email(self, to_email, subject, html_content, text_content=None):
        """Send an email with HTML content"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.email_user}>"
            msg['To'] = to_email
            
            # Add text version if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML version
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # For demo purposes, just log the email instead of actually sending
            print(f"\n=== EMAIL NOTIFICATION ===")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Content: {html_content}")
            print("=========================\n")
            
            return True
            
            # Uncomment below for actual email sending
            # server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            # server.starttls()
            # server.login(self.email_user, self.email_password)
            # server.send_message(msg)
            # server.quit()
            # return True
            
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
    
    def send_booking_confirmation_to_client(self, booking_data, artist_name):
        """Send booking confirmation email to client"""
        booking_date = datetime.fromisoformat(booking_data['dateTime'].replace('Z', '+00:00'))
        formatted_date = booking_date.strftime('%A, %B %d, %Y')
        formatted_time = booking_date.strftime('%I:%M %p')
        
        subject = f"Booking Request Submitted - {artist_name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }}
                .status-badge {{ background: #FEF3C7; color: #92400E; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                .button {{ background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎨 MACS Platform</h1>
                    <h2>Booking Request Submitted!</h2>
                </div>
                <div class="content">
                    <p>Hi {booking_data['clientName']},</p>
                    
                    <p>Thank you for your booking request! We've successfully received your request and it has been sent to <strong>{artist_name}</strong> for review.</p>
                    
                    <div class="booking-details">
                        <h3>📅 Booking Details</h3>
                        <p><strong>Artist:</strong> {artist_name}</p>
                        <p><strong>Service:</strong> {booking_data['service']}</p>
                        <p><strong>Date:</strong> {formatted_date}</p>
                        <p><strong>Time:</strong> {formatted_time}</p>
                        <p><strong>Status:</strong> <span class="status-badge">⏳ Awaiting Confirmation</span></p>
                    </div>
                    
                    <div style="background: #EBF8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>💬 Your Message:</h4>
                        <p style="font-style: italic;">"{booking_data['message']}"</p>
                    </div>
                    
                    <h3>🔔 What happens next?</h3>
                    <ul>
                        <li>The artist will review your request within 24 hours</li>
                        <li>You'll receive an email notification when they respond</li>
                        <li>You can track your booking status in your MACS dashboard</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://macsplatform.com/my-bookings" class="button">View My Bookings</a>
                    </div>
                    
                    <p>If you have any questions, feel free to reach out to us or contact the artist directly.</p>
                    
                    <p>Best regards,<br>The MACS Platform Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from MACS Platform.<br>
                    Visit us at <a href="https://macsplatform.com">macsplatform.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(booking_data['clientEmail'], subject, html_content)
    
    def send_booking_notification_to_artist(self, booking_data, artist_email, artist_name):
        """Send new booking notification to artist"""
        booking_date = datetime.fromisoformat(booking_data['dateTime'].replace('Z', '+00:00'))
        formatted_date = booking_date.strftime('%A, %B %d, %Y')
        formatted_time = booking_date.strftime('%I:%M %p')
        
        subject = f"New Booking Request from {booking_data['clientName']}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }}
                .client-info {{ background: #F0FDF4; padding: 15px; border-radius: 8px; margin: 15px 0; }}
                .action-buttons {{ text-align: center; margin: 30px 0; }}
                .button {{ padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px; font-weight: bold; }}
                .accept-btn {{ background: #10B981; color: white; }}
                .decline-btn {{ background: #EF4444; color: white; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎨 MACS Platform</h1>
                    <h2>New Booking Request!</h2>
                </div>
                <div class="content">
                    <p>Hi {artist_name},</p>
                    
                    <p>You have received a new booking request! A client is interested in your services and would like to schedule a session.</p>
                    
                    <div class="client-info">
                        <h3>👤 Client Information</h3>
                        <p><strong>Name:</strong> {booking_data['clientName']}</p>
                        <p><strong>Email:</strong> {booking_data['clientEmail']}</p>
                    </div>
                    
                    <div class="booking-details">
                        <h3>📅 Requested Booking</h3>
                        <p><strong>Service:</strong> {booking_data['service']}</p>
                        <p><strong>Date:</strong> {formatted_date}</p>
                        <p><strong>Time:</strong> {formatted_time}</p>
                    </div>
                    
                    <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>💬 Client's Message:</h4>
                        <p style="font-style: italic;">"{booking_data['message']}"</p>
                    </div>
                    
                    <div class="action-buttons">
                        <a href="https://macsplatform.com/dashboard/bookings" class="button accept-btn">✅ Review & Respond</a>
                    </div>
                    
                    <div style="background: #EBF8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>⏰ Response Time</h4>
                        <p>Please respond to this booking request within 24 hours to maintain a good response rate. Clients appreciate quick responses!</p>
                    </div>
                    
                    <p>You can accept or decline this booking request from your artist dashboard.</p>
                    
                    <p>Best regards,<br>The MACS Platform Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from MACS Platform.<br>
                    Visit your dashboard at <a href="https://macsplatform.com/dashboard">macsplatform.com/dashboard</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(artist_email, subject, html_content)
    
    def send_booking_status_update_to_client(self, booking_data, artist_name, status):
        """Send booking status update to client"""
        booking_date = datetime.fromisoformat(booking_data['dateTime'].replace('Z', '+00:00'))
        formatted_date = booking_date.strftime('%A, %B %d, %Y')
        formatted_time = booking_date.strftime('%I:%M %p')
        
        if status == 'confirmed':
            subject = f"Booking Confirmed - {artist_name}"
            status_color = "#10B981"
            status_text = "✅ Confirmed"
            message = f"Great news! {artist_name} has confirmed your booking request."
            next_steps = """
            <h3>🎉 What's next?</h3>
            <ul>
                <li>Your booking is now confirmed and secured</li>
                <li>The artist may contact you directly with additional details</li>
                <li>Please arrive on time for your scheduled session</li>
                <li>Bring any materials or references discussed</li>
            </ul>
            """
        else:  # declined
            subject = f"Booking Update - {artist_name}"
            status_color = "#EF4444"
            status_text = "❌ Declined"
            message = f"Unfortunately, {artist_name} is not available for your requested time slot."
            next_steps = """
            <h3>💡 What you can do:</h3>
            <ul>
                <li>Try booking a different date or time</li>
                <li>Contact the artist directly to discuss alternatives</li>
                <li>Browse other talented artists on MACS Platform</li>
            </ul>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {status_color}; }}
                .status-badge {{ background: {status_color}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                .button {{ background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎨 MACS Platform</h1>
                    <h2>Booking Status Update</h2>
                </div>
                <div class="content">
                    <p>Hi {booking_data['clientName']},</p>
                    
                    <p>{message}</p>
                    
                    <div class="booking-details">
                        <h3>📅 Booking Details</h3>
                        <p><strong>Artist:</strong> {artist_name}</p>
                        <p><strong>Service:</strong> {booking_data['service']}</p>
                        <p><strong>Date:</strong> {formatted_date}</p>
                        <p><strong>Time:</strong> {formatted_time}</p>
                        <p><strong>Status:</strong> <span class="status-badge">{status_text}</span></p>
                    </div>
                    
                    {next_steps}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://macsplatform.com/my-bookings" class="button">View My Bookings</a>
                    </div>
                    
                    <p>Thank you for using MACS Platform to connect with amazing artists!</p>
                    
                    <p>Best regards,<br>The MACS Platform Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from MACS Platform.<br>
                    Visit us at <a href="https://macsplatform.com">macsplatform.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(booking_data['clientEmail'], subject, html_content)

# Create global email service instance
email_service = EmailService()


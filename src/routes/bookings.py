from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid
from services.email_service import email_service

bookings_bp = Blueprint('bookings', __name__)

# In-memory storage for demo (replace with database in production)
bookings_db = [
    {
        'id': '1',
        'artistId': '1',
        'clientName': 'Sarah Johnson',
        'clientEmail': 'sarah.johnson@email.com',
        'dateTime': '2025-07-15T10:00:00Z',
        'service': 'Custom Ceramic Piece',
        'message': 'I would like to commission a traditional ceramic vase with blue and orange patterns.',
        'status': 'pending',
        'createdAt': '2025-07-10T14:30:00Z',
        'updatedAt': '2025-07-10T14:30:00Z'
    },
    {
        'id': '2',
        'artistId': '1',
        'clientName': 'Marcus Chen',
        'clientEmail': 'marcus.chen@email.com',
        'dateTime': '2025-07-18T14:00:00Z',
        'service': 'Art Consultation',
        'message': 'Looking for guidance on starting my own ceramic art journey.',
        'status': 'confirmed',
        'createdAt': '2025-07-08T09:15:00Z',
        'updatedAt': '2025-07-09T11:20:00Z'
    },
    {
        'id': '3',
        'artistId': '1',
        'clientName': 'Elena Rodriguez',
        'clientEmail': 'elena.rodriguez@email.com',
        'dateTime': '2025-07-12T16:00:00Z',
        'service': 'Workshop Session',
        'message': 'Interested in learning traditional pottery techniques for a group of 4 people.',
        'status': 'completed',
        'createdAt': '2025-07-04T11:20:00Z',
        'updatedAt': '2025-07-05T16:30:00Z'
    },
    {
        'id': '4',
        'artistId': '1',
        'clientName': 'David Kim',
        'clientEmail': 'david.kim@email.com',
        'dateTime': '2025-06-28T11:00:00Z',
        'service': 'Portrait Session',
        'message': 'Professional headshots for my business profile.',
        'status': 'declined',
        'createdAt': '2025-06-25T09:15:00Z',
        'updatedAt': '2025-06-26T14:20:00Z'
    }
]

# Artist information for email notifications
artists_db = {
    '1': {
        'name': 'Keoni Nakamura',
        'email': 'keoni.nakamura@email.com',
        'specialties': ['Ceramics', 'Traditional Art', 'Pottery']
    }
}

# Artist availability template (in production, this would be in database)
artist_availability = {
    '1': {
        'default_hours': ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
        'custom_availability': {
            '2025-07-15': ['09:00', '11:00', '13:00', '15:00'],
            '2025-07-16': ['10:00', '12:00', '14:00', '16:00'],
            '2025-07-17': ['09:00', '10:00', '11:00', '14:00', '15:00'],
            '2025-07-18': ['13:00', '15:00', '16:00'],
            '2025-07-19': ['09:00', '11:00', '13:00'],
            '2025-07-22': ['10:00', '11:00', '12:00', '15:00', '16:00'],
            '2025-07-23': ['09:00', '10:00', '14:00', '15:00'],
            '2025-07-24': ['11:00', '12:00', '13:00', '16:00'],
            '2025-07-25': ['09:00', '10:00', '11:00', '14:00'],
            '2025-07-26': ['13:00', '14:00', '15:00', '16:00']
        }
    }
}

def get_booked_slots_for_artist(artist_id, start_date=None, end_date=None):
    """Get all booked time slots for an artist within a date range"""
    booked_slots = {}
    
    for booking in bookings_db:
        if booking['artistId'] == artist_id and booking['status'] in ['pending', 'confirmed']:
            booking_date = datetime.fromisoformat(booking['dateTime'].replace('Z', '+00:00'))
            date_str = booking_date.strftime('%Y-%m-%d')
            time_str = booking_date.strftime('%H:%M')
            
            # Filter by date range if provided
            if start_date and end_date:
                if date_str < start_date or date_str > end_date:
                    continue
            
            if date_str not in booked_slots:
                booked_slots[date_str] = []
            booked_slots[date_str].append(time_str)
    
    return booked_slots

def check_time_slot_availability(artist_id, date_time):
    """Check if a specific time slot is available for booking"""
    try:
        booking_datetime = datetime.fromisoformat(date_time.replace('Z', '+00:00'))
        date_str = booking_datetime.strftime('%Y-%m-%d')
        time_str = booking_datetime.strftime('%H:%M')
        
        # Check if artist has availability for this date
        artist_avail = artist_availability.get(artist_id, {})
        available_slots = artist_avail.get('custom_availability', {}).get(date_str)
        
        if available_slots is None:
            # Use default hours if no custom availability
            available_slots = artist_avail.get('default_hours', [])
        
        if time_str not in available_slots:
            return False, "Artist is not available at this time"
        
        # Check if slot is already booked
        booked_slots = get_booked_slots_for_artist(artist_id, date_str, date_str)
        if date_str in booked_slots and time_str in booked_slots[date_str]:
            return False, "Time slot is already booked"
        
        return True, "Time slot is available"
        
    except Exception as e:
        return False, f"Invalid date/time format: {str(e)}"

@bookings_bp.route('/api/v1/bookings', methods=['POST'])
def create_booking():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['artistId', 'clientName', 'clientEmail', 'dateTime', 'service', 'message']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate email format
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, data['clientEmail']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check time slot availability
        is_available, message = check_time_slot_availability(data['artistId'], data['dateTime'])
        if not is_available:
            return jsonify({'error': f'Booking conflict: {message}'}), 409
        
        # Create new booking
        new_booking = {
            'id': str(uuid.uuid4()),
            'artistId': data['artistId'],
            'clientName': data['clientName'],
            'clientEmail': data['clientEmail'],
            'dateTime': data['dateTime'],
            'service': data['service'],
            'message': data['message'],
            'status': 'pending',
            'createdAt': datetime.utcnow().isoformat() + 'Z',
            'updatedAt': datetime.utcnow().isoformat() + 'Z'
        }
        
        bookings_db.append(new_booking)
        
        # Send email notifications
        artist_info = artists_db.get(data['artistId'])
        if artist_info:
            try:
                # Send confirmation email to client
                email_service.send_booking_confirmation_to_client(new_booking, artist_info['name'])
                
                # Send notification email to artist
                email_service.send_booking_notification_to_artist(
                    new_booking, 
                    artist_info['email'], 
                    artist_info['name']
                )
            except Exception as e:
                print(f"Error sending email notifications: {str(e)}")
                # Don't fail the booking if email fails
        
        return jsonify({
            'success': True,
            'booking': new_booking,
            'message': 'Booking request created successfully. Email notifications sent.'
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@bookings_bp.route('/api/v1/bookings', methods=['GET'])
def get_bookings():
    try:
        # Get query parameters
        artist_id = request.args.get('artistId')
        user_id = request.args.get('userId')
        client_email = request.args.get('clientEmail')
        status = request.args.get('status')
        
        # Filter bookings
        filtered_bookings = bookings_db.copy()
        
        if artist_id:
            filtered_bookings = [b for b in filtered_bookings if b['artistId'] == artist_id]
        
        if user_id:
            filtered_bookings = [b for b in filtered_bookings if b.get('userId') == user_id]
        
        if client_email:
            filtered_bookings = [b for b in filtered_bookings if b['clientEmail'] == client_email]
        
        if status:
            filtered_bookings = [b for b in filtered_bookings if b['status'] == status]
        
        # Sort by creation date (newest first)
        filtered_bookings.sort(key=lambda x: x['createdAt'], reverse=True)
        
        return jsonify({
            'success': True,
            'bookings': filtered_bookings,
            'total': len(filtered_bookings)
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@bookings_bp.route('/api/v1/bookings/<booking_id>', methods=['GET'])
def get_booking(booking_id):
    try:
        booking = next((b for b in bookings_db if b['id'] == booking_id), None)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        return jsonify({
            'success': True,
            'booking': booking
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@bookings_bp.route('/api/v1/bookings/<booking_id>/confirm', methods=['PATCH'])
def confirm_booking(booking_id):
    try:
        data = request.get_json()
        action = data.get('action')  # 'accept' or 'decline'
        
        if action not in ['accept', 'decline']:
            return jsonify({'error': 'Invalid action. Must be "accept" or "decline"'}), 400
        
        # Find booking
        booking = next((b for b in bookings_db if b['id'] == booking_id), None)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking['status'] != 'pending':
            return jsonify({'error': 'Booking is not in pending status'}), 400
        
        # Update booking status
        new_status = 'confirmed' if action == 'accept' else 'declined'
        booking['status'] = new_status
        booking['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
        
        # Send status update email to client
        artist_info = artists_db.get(booking['artistId'])
        if artist_info:
            try:
                email_service.send_booking_status_update_to_client(
                    booking, 
                    artist_info['name'], 
                    new_status
                )
            except Exception as e:
                print(f"Error sending status update email: {str(e)}")
                # Don't fail the booking update if email fails
        
        return jsonify({
            'success': True,
            'booking': booking,
            'message': f'Booking {new_status} successfully. Client has been notified via email.'
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@bookings_bp.route('/api/v1/bookings/availability/<artist_id>', methods=['GET'])
def get_availability(artist_id):
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Get artist availability
        artist_avail = artist_availability.get(artist_id, {})
        default_hours = artist_avail.get('default_hours', [])
        custom_availability = artist_avail.get('custom_availability', {})
        
        # Get booked slots
        booked_slots = get_booked_slots_for_artist(artist_id, start_date, end_date)
        
        # Build availability response
        availability = {}
        
        if start_date and end_date:
            # Generate availability for date range
            current_date = datetime.strptime(start_date, '%Y-%m-%d')
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            
            while current_date <= end_date_obj:
                date_str = current_date.strftime('%Y-%m-%d')
                
                # Skip past dates
                if current_date.date() < datetime.now().date():
                    current_date += timedelta(days=1)
                    continue
                
                # Get available slots for this date
                if date_str in custom_availability:
                    availability[date_str] = custom_availability[date_str]
                else:
                    availability[date_str] = default_hours.copy()
                
                current_date += timedelta(days=1)
        else:
            # Return custom availability only
            availability = custom_availability.copy()
        
        return jsonify({
            'success': True,
            'availability': availability,
            'bookedSlots': booked_slots,
            'defaultHours': default_hours
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@bookings_bp.route('/api/v1/bookings/check-availability', methods=['POST'])
def check_availability():
    try:
        data = request.get_json()
        artist_id = data.get('artistId')
        date_time = data.get('dateTime')
        
        if not artist_id or not date_time:
            return jsonify({'error': 'Missing artistId or dateTime'}), 400
        
        is_available, message = check_time_slot_availability(artist_id, date_time)
        
        return jsonify({
            'success': True,
            'available': is_available,
            'message': message
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Statistics endpoint for artist dashboard
@bookings_bp.route('/api/v1/bookings/stats/<artist_id>', methods=['GET'])
def get_booking_stats(artist_id):
    try:
        artist_bookings = [b for b in bookings_db if b['artistId'] == artist_id]
        
        stats = {
            'total': len(artist_bookings),
            'pending': len([b for b in artist_bookings if b['status'] == 'pending']),
            'confirmed': len([b for b in artist_bookings if b['status'] == 'confirmed']),
            'completed': len([b for b in artist_bookings if b['status'] == 'completed']),
            'declined': len([b for b in artist_bookings if b['status'] == 'declined'])
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Email notification test endpoint
@bookings_bp.route('/api/v1/bookings/test-email', methods=['POST'])
def test_email():
    try:
        data = request.get_json()
        email_type = data.get('type', 'booking_confirmation')
        
        # Sample booking data for testing
        sample_booking = {
            'id': 'test-123',
            'artistId': '1',
            'clientName': 'Test User',
            'clientEmail': data.get('email', 'test@example.com'),
            'dateTime': '2025-07-20T14:00:00Z',
            'service': 'Test Service',
            'message': 'This is a test booking message.',
            'status': 'pending'
        }
        
        artist_info = artists_db.get('1')
        
        if email_type == 'booking_confirmation':
            success = email_service.send_booking_confirmation_to_client(sample_booking, artist_info['name'])
        elif email_type == 'artist_notification':
            success = email_service.send_booking_notification_to_artist(
                sample_booking, 
                artist_info['email'], 
                artist_info['name']
            )
        elif email_type == 'status_update':
            status = data.get('status', 'confirmed')
            success = email_service.send_booking_status_update_to_client(
                sample_booking, 
                artist_info['name'], 
                status
            )
        else:
            return jsonify({'error': 'Invalid email type'}), 400
        
        return jsonify({
            'success': success,
            'message': f'Test email sent successfully' if success else 'Failed to send test email'
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid

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

# Artist availability storage (in production, this would be in database)
availability_db = {
    '1': {
        '2025-07-01': 'available',
        '2025-07-02': 'available',
        '2025-07-03': 'unavailable',
        '2025-07-04': 'available',
        '2025-07-05': 'available',
        '2025-07-06': 'unavailable',
        '2025-07-07': 'unavailable',
        '2025-07-08': 'available',
        '2025-07-09': 'available',
        '2025-07-10': 'available',
        '2025-07-11': 'available',
        '2025-07-12': 'available',
        '2025-07-13': 'unavailable',
        '2025-07-14': 'unavailable',
        '2025-07-15': 'available',
        '2025-07-16': 'available',
        '2025-07-17': 'available',
        '2025-07-18': 'available',
        '2025-07-19': 'available',
        '2025-07-20': 'unavailable',
        '2025-07-21': 'unavailable',
        '2025-07-22': 'available',
        '2025-07-23': 'available',
        '2025-07-24': 'available',
        '2025-07-25': 'available',
        '2025-07-26': 'available',
        '2025-07-27': 'unavailable',
        '2025-07-28': 'unavailable',
        '2025-07-29': 'available',
        '2025-07-30': 'available',
        '2025-07-31': 'available'
    }
}

# Campaigns storage for crowdfunding
campaigns_db = [
    {
        'id': '1',
        'artistId': '1',
        'title': 'Traditional Ceramic Art Exhibition',
        'description': 'Help me create a stunning exhibition showcasing traditional Hawaiian ceramic techniques passed down through generations.',
        'targetAmount': 5000,
        'currentAmount': 1250,
        'deadline': '2025-08-15T23:59:59Z',
        'imageUrl': '/images/ceramic-exhibition.jpg',
        'status': 'active',
        'createdAt': '2025-07-01T10:00:00Z',
        'updatedAt': '2025-07-07T15:30:00Z'
    },
    {
        'id': '2',
        'artistId': '1',
        'title': 'Community Art Workshop Series',
        'description': 'Fund a series of free community workshops to teach traditional pottery techniques to local youth.',
        'targetAmount': 3000,
        'currentAmount': 800,
        'deadline': '2025-07-30T23:59:59Z',
        'imageUrl': '/images/workshop-series.jpg',
        'status': 'active',
        'createdAt': '2025-06-15T14:20:00Z',
        'updatedAt': '2025-07-07T12:15:00Z'
    }
]

# Contributions storage
contributions_db = [
    {
        'id': '1',
        'campaignId': '1',
        'contributorName': 'Maria Santos',
        'contributorEmail': 'maria.santos@email.com',
        'amount': 500,
        'message': 'Love supporting traditional arts! Can\'t wait to see the exhibition.',
        'paymentMethod': 'credit_card',
        'createdAt': '2025-07-02T09:30:00Z'
    },
    {
        'id': '2',
        'campaignId': '1',
        'contributorName': 'James Wilson',
        'contributorEmail': 'james.wilson@email.com',
        'amount': 250,
        'message': 'Beautiful work! Keep preserving these traditions.',
        'paymentMethod': 'paypal',
        'createdAt': '2025-07-03T16:45:00Z'
    },
    {
        'id': '3',
        'campaignId': '2',
        'contributorName': 'Lisa Chang',
        'contributorEmail': 'lisa.chang@email.com',
        'amount': 300,
        'message': 'Supporting art education in our community!',
        'paymentMethod': 'credit_card',
        'createdAt': '2025-06-20T11:20:00Z'
    }
]

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
        available, message = is_time_slot_available(data['artistId'], data['dateTime'])
        if not available:
            return jsonify({'error': message}), 409
        
        # Check for duplicate bookings
        for booking in bookings_db:
            if (booking['artistId'] == data['artistId'] and 
                booking['dateTime'] == data['dateTime'] and
                booking['status'] in ['pending', 'confirmed']):
                return jsonify({'error': 'Time slot already booked'}), 409
        
        # Create new booking
        new_booking = {
            'id': len(bookings_db) + 1,
            'artistId': data['artistId'],
            'clientName': data['clientName'],
            'clientEmail': data['clientEmail'],
            'dateTime': data['dateTime'],
            'service': data['service'],
            'message': data.get('message', ''),
            'status': 'pending',
            'createdAt': datetime.now().isoformat()
        }
        
        bookings_db.append(new_booking)
        
        return jsonify({
            'success': True,
            'booking': new_booking,
            'message': 'Booking request submitted successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Update booking status endpoint
@bookings_bp.route('/api/v1/bookings/<booking_id>', methods=['PATCH'])
def update_booking_status(booking_id):
    try:
        data = request.get_json()
        
        # Find the booking
        booking = next((b for b in bookings_db if str(b['id']) == str(booking_id)), None)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Update status
        if 'status' in data:
            booking['status'] = data['status']
            booking['updatedAt'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'booking': booking,
            'message': f'Booking {data.get("status", "updated")} successfully'
        }), 200
        
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

# Availability management endpoints
@bookings_bp.route('/api/v1/availability/<artist_id>', methods=['GET'])
def get_artist_availability(artist_id):
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        if artist_id not in availability_db:
            availability_db[artist_id] = {}
        
        artist_availability = availability_db[artist_id]
        
        # Filter by date range if provided
        if start_date and end_date:
            filtered_availability = {}
            current_date = datetime.strptime(start_date, '%Y-%m-%d')
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            
            while current_date <= end_date_obj:
                date_str = current_date.strftime('%Y-%m-%d')
                filtered_availability[date_str] = artist_availability.get(date_str, 'available')
                current_date += timedelta(days=1)
            
            artist_availability = filtered_availability
        
        return jsonify({
            'success': True,
            'availability': artist_availability
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@bookings_bp.route('/api/v1/availability/<artist_id>', methods=['POST'])
def update_artist_availability(artist_id):
    try:
        data = request.get_json()
        availability = data.get('availability', {})
        
        if not availability:
            return jsonify({'error': 'No availability data provided'}), 400
        
        # Initialize artist availability if not exists
        if artist_id not in availability_db:
            availability_db[artist_id] = {}
        
        # Update availability
        availability_db[artist_id].update(availability)
        
        return jsonify({
            'success': True,
            'message': 'Availability updated successfully',
            'availability': availability_db[artist_id]
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@bookings_bp.route('/api/v1/bookings/check-availability', methods=['POST'])
def check_time_slot_availability():
    try:
        data = request.get_json()
        artist_id = data.get('artistId')
        date = data.get('date')
        time = data.get('time')
        
        if not all([artist_id, date, time]):
            return jsonify({'error': 'Missing required fields: artistId, date, time'}), 400
        
        # Check if date is available
        if artist_id in availability_db:
            date_availability = availability_db[artist_id].get(date, 'available')
            if date_availability == 'unavailable':
                return jsonify({
                    'success': True,
                    'available': False,
                    'message': 'This date is marked as unavailable'
                })
        
        # Check for existing confirmed bookings at this time
        date_time_str = f"{date}T{time}:00Z"
        existing_booking = next((
            b for b in bookings_db 
            if b['artistId'] == artist_id 
            and b['dateTime'] == date_time_str 
            and b['status'] in ['confirmed', 'pending']
        ), None)
        
        if existing_booking:
            return jsonify({
                'success': True,
                'available': False,
                'message': 'This time slot is already booked'
            })
        
        return jsonify({
            'success': True,
            'available': True,
            'message': 'Time slot is available'
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# User booking tracking endpoint
@bookings_bp.route('/api/v1/bookings/user/<user_email>', methods=['GET'])
def get_user_bookings(user_email):
    try:
        # Find all bookings for this user email
        user_bookings = [b for b in bookings_db if b['clientEmail'].lower() == user_email.lower()]
        
        # Sort by creation date (newest first)
        user_bookings.sort(key=lambda x: x['createdAt'], reverse=True)
        
        return jsonify({
            'success': True,
            'bookings': user_bookings,
            'total': len(user_bookings)
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Enhanced time slot availability check
@bookings_bp.route('/api/v1/bookings/check-timeslot', methods=['POST'])
def check_timeslot_availability():
    try:
        data = request.get_json()
        artist_id = data.get('artistId')
        date = data.get('date')
        time = data.get('time')
        
        if not all([artist_id, date, time]):
            return jsonify({'error': 'Missing required fields: artistId, date, time'}), 400
        
        # Check if date is available
        if artist_id in availability_db:
            date_availability = availability_db[artist_id].get(date, 'available')
            if date_availability == 'unavailable':
                return jsonify({
                    'success': True,
                    'available': False,
                    'message': 'This date is marked as unavailable by the artist'
                })
        
        # Check for existing confirmed bookings at this time
        date_time_str = f"{date}T{time}:00Z"
        existing_booking = next((
            b for b in bookings_db 
            if b['artistId'] == artist_id 
            and b['dateTime'] == date_time_str 
            and b['status'] in ['confirmed', 'pending']
        ), None)
        
        if existing_booking:
            return jsonify({
                'success': True,
                'available': False,
                'message': f'This time slot is already {existing_booking["status"]}'
            })
        
        return jsonify({
            'success': True,
            'available': True,
            'message': 'Time slot is available'
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

# ============= CROWDFUNDING CAMPAIGN ENDPOINTS =============

# Get all campaigns
@bookings_bp.route('/api/v1/campaigns', methods=['GET'])
def get_campaigns():
    try:
        # Filter active campaigns by default
        status_filter = request.args.get('status', 'active')
        artist_id = request.args.get('artistId')
        
        filtered_campaigns = campaigns_db
        
        if status_filter != 'all':
            filtered_campaigns = [c for c in filtered_campaigns if c['status'] == status_filter]
        
        if artist_id:
            filtered_campaigns = [c for c in filtered_campaigns if c['artistId'] == artist_id]
        
        # Calculate progress percentage for each campaign
        for campaign in filtered_campaigns:
            campaign['progressPercentage'] = round((campaign['currentAmount'] / campaign['targetAmount']) * 100, 1)
            
            # Calculate days remaining
            deadline = datetime.fromisoformat(campaign['deadline'].replace('Z', '+00:00'))
            now = datetime.now(deadline.tzinfo)
            days_remaining = (deadline - now).days
            campaign['daysRemaining'] = max(0, days_remaining)
        
        return jsonify({
            'success': True,
            'campaigns': filtered_campaigns,
            'total': len(filtered_campaigns)
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Create new campaign
@bookings_bp.route('/api/v1/campaigns', methods=['POST'])
def create_campaign():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['artistId', 'title', 'description', 'targetAmount', 'deadline']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate target amount
        try:
            target_amount = float(data['targetAmount'])
            if target_amount <= 0:
                return jsonify({'error': 'Target amount must be greater than 0'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid target amount format'}), 400
        
        # Validate deadline
        try:
            deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
            if deadline <= datetime.now(deadline.tzinfo):
                return jsonify({'error': 'Deadline must be in the future'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid deadline format'}), 400
        
        # Create new campaign
        campaign_id = str(len(campaigns_db) + 1)
        new_campaign = {
            'id': campaign_id,
            'artistId': data['artistId'],
            'title': data['title'],
            'description': data['description'],
            'targetAmount': target_amount,
            'currentAmount': 0,
            'deadline': data['deadline'],
            'imageUrl': data.get('imageUrl', ''),
            'status': 'active',
            'createdAt': datetime.now().isoformat() + 'Z',
            'updatedAt': datetime.now().isoformat() + 'Z'
        }
        
        campaigns_db.append(new_campaign)
        
        return jsonify({
            'success': True,
            'campaign': new_campaign,
            'message': 'Campaign created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Get specific campaign
@bookings_bp.route('/api/v1/campaigns/<campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    try:
        campaign = next((c for c in campaigns_db if c['id'] == campaign_id), None)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Calculate progress percentage
        campaign['progressPercentage'] = round((campaign['currentAmount'] / campaign['targetAmount']) * 100, 1)
        
        # Calculate days remaining
        deadline = datetime.fromisoformat(campaign['deadline'].replace('Z', '+00:00'))
        now = datetime.now(deadline.tzinfo)
        days_remaining = (deadline - now).days
        campaign['daysRemaining'] = max(0, days_remaining)
        
        # Get campaign contributions
        campaign_contributions = [c for c in contributions_db if c['campaignId'] == campaign_id]
        campaign['contributionsCount'] = len(campaign_contributions)
        
        return jsonify({
            'success': True,
            'campaign': campaign
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Update campaign
@bookings_bp.route('/api/v1/campaigns/<campaign_id>', methods=['PATCH'])
def update_campaign(campaign_id):
    try:
        campaign = next((c for c in campaigns_db if c['id'] == campaign_id), None)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = ['title', 'description', 'targetAmount', 'deadline', 'imageUrl', 'status']
        for field in updatable_fields:
            if field in data:
                if field == 'targetAmount':
                    try:
                        target_amount = float(data[field])
                        if target_amount <= 0:
                            return jsonify({'error': 'Target amount must be greater than 0'}), 400
                        campaign[field] = target_amount
                    except ValueError:
                        return jsonify({'error': 'Invalid target amount format'}), 400
                elif field == 'deadline':
                    try:
                        deadline = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                        if deadline <= datetime.now(deadline.tzinfo):
                            return jsonify({'error': 'Deadline must be in the future'}), 400
                        campaign[field] = data[field]
                    except ValueError:
                        return jsonify({'error': 'Invalid deadline format'}), 400
                else:
                    campaign[field] = data[field]
        
        campaign['updatedAt'] = datetime.now().isoformat() + 'Z'
        
        return jsonify({
            'success': True,
            'campaign': campaign,
            'message': 'Campaign updated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ============= CONTRIBUTION ENDPOINTS =============

# Submit contribution
@bookings_bp.route('/api/v1/contributions', methods=['POST'])
def create_contribution():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['campaignId', 'contributorName', 'contributorEmail', 'amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate amount
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({'error': 'Contribution amount must be greater than 0'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid amount format'}), 400
        
        # Check if campaign exists and is active
        campaign = next((c for c in campaigns_db if c['id'] == data['campaignId']), None)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        if campaign['status'] != 'active':
            return jsonify({'error': 'Campaign is not active'}), 400
        
        # Check if campaign deadline has passed
        deadline = datetime.fromisoformat(campaign['deadline'].replace('Z', '+00:00'))
        if datetime.now(deadline.tzinfo) > deadline:
            return jsonify({'error': 'Campaign deadline has passed'}), 400
        
        # Create new contribution
        contribution_id = str(len(contributions_db) + 1)
        new_contribution = {
            'id': contribution_id,
            'campaignId': data['campaignId'],
            'contributorName': data['contributorName'],
            'contributorEmail': data['contributorEmail'],
            'amount': amount,
            'message': data.get('message', ''),
            'paymentMethod': data.get('paymentMethod', 'credit_card'),
            'createdAt': datetime.now().isoformat() + 'Z'
        }
        
        contributions_db.append(new_contribution)
        
        # Update campaign current amount
        campaign['currentAmount'] += amount
        campaign['updatedAt'] = datetime.now().isoformat() + 'Z'
        
        return jsonify({
            'success': True,
            'contribution': new_contribution,
            'campaign': campaign,
            'message': 'Contribution submitted successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Get contributions for a campaign
@bookings_bp.route('/api/v1/contributions/<campaign_id>', methods=['GET'])
def get_campaign_contributions(campaign_id):
    try:
        # Check if campaign exists
        campaign = next((c for c in campaigns_db if c['id'] == campaign_id), None)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Get all contributions for this campaign
        campaign_contributions = [c for c in contributions_db if c['campaignId'] == campaign_id]
        
        # Sort by creation date (newest first)
        campaign_contributions.sort(key=lambda x: x['createdAt'], reverse=True)
        
        # Calculate total amount
        total_amount = sum(c['amount'] for c in campaign_contributions)
        
        return jsonify({
            'success': True,
            'contributions': campaign_contributions,
            'total': len(campaign_contributions),
            'totalAmount': total_amount
        })
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


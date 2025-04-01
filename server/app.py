from typing import Dict, List, Union, Optional, Any, TypeVar, Callable
from flask import Flask, jsonify, request, Response, current_app, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from datetime import datetime, timedelta
import os
import uuid
import jwt
from functools import wraps
import json
import re
import base64
from werkzeug.security import generate_password_hash, check_password_hash
import random

# Type variable for the wrapped function
R = TypeVar('R', bound=Response)

# Initialize Flask app
app = Flask(__name__)

# Configure app settings
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'kinetics_super_secure_secret_123')

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 
    'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'app.db')
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
migrate = Migrate(app, db)

# Enable CORS with proper configuration
CORS(app, 
     resources={r"/*": {"origins": "http://localhost:5173"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Custom type for route return
RouteReturn = Union[Response, tuple[Response, int]]

# Helper function for JSON columns
def json_column_to_list(data):
    if data is None:
        return []
    if isinstance(data, list):
        return data
    try:
        return json.loads(data)
    except (TypeError, json.JSONDecodeError):
        return []

# Basic sentiment analysis functionality
def analyze_sentiment(text: str) -> str:
    """
    Perform basic sentiment analysis on the given text.
    
    Args:
        text: The message text to analyze
        
    Returns:
        sentiment: A string representing the sentiment ('positive', 'negative', or 'neutral')
    """
    # Define sentiment keywords
    positive_words = [
        'good', 'great', 'excellent', 'amazing', 'awesome', 'fantastic',
        'happy', 'excited', 'love', 'like', 'progress', 'success', 'well',
        'glad', 'thank', 'thanks', 'appreciate', 'done', 'completed', 'resolved'
    ]
    
    negative_words = [
        'bad', 'poor', 'terrible', 'awful', 'horrible', 'issue', 'problem',
        'fail', 'error', 'bug', 'difficult', 'hard', 'unhappy', 'frustrated',
        'disappointed', 'slow', 'wrong', 'broken', 'delay', 'missed', 'angry',
        'hate', 'dislike', 'trouble', 'never', 'impossible', 'fail', 'sorry'
    ]
    
    # Convert text to lowercase and tokenize
    words = re.findall(r'\b\w+\b', text.lower())
    
    # Count positive and negative words
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    
    # Determine sentiment
    if positive_count > negative_count:
        return 'positive'
    elif negative_count > positive_count:
        return 'negative'
    else:
        return 'neutral'

# Database models matching TypeScript interfaces
class User(db.Model):
    id: str = db.Column(db.String(50), primary_key=True)
    name: str = db.Column(db.String(100), nullable=False)
    email: str = db.Column(db.String(100), unique=True, nullable=False)
    password_hash: str = db.Column(db.String(128), nullable=False)
    is_online: bool = db.Column(db.Boolean, default=False)
    avatar: Optional[str] = db.Column(db.String(200))

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'isOnline': self.is_online,
            'avatar': self.avatar
        }

class Message(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    sender_id: str = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    sender = db.relationship('User', backref='messages')
    content: str = db.Column(db.Text, nullable=False)
    timestamp: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    is_private: bool = db.Column(db.Boolean, default=False)
    priority: str = db.Column(db.String(20), default='normal')
    tags: List[str] = db.Column(db.Text, default='[]')
    mentions: List[str] = db.Column(db.Text, default='[]')
    search_keywords: List[str] = db.Column(db.Text, default='[]')
    read_by: List[str] = db.Column(db.Text, default='[]')
    sentiment: str = db.Column(db.String(20), default='neutral')
    
    @property
    def tags_list(self) -> List[str]:
        return json_column_to_list(self.tags)
        
    @property
    def mentions_list(self) -> List[str]:
        return json_column_to_list(self.mentions)
        
    @property
    def search_keywords_list(self) -> List[str]:
        return json_column_to_list(self.search_keywords)
        
    @property
    def read_by_list(self) -> List[str]:
        return json_column_to_list(self.read_by)

# New models for meetings, work items, and chart data
class Meeting(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    title: str = db.Column(db.String(100), nullable=False)
    date: str = db.Column(db.String(50), nullable=False)
    start_time: str = db.Column(db.String(20), nullable=False)
    end_time: str = db.Column(db.String(20), nullable=False)
    room: str = db.Column(db.String(50), nullable=False)
    organizer_id: str = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    organizer = db.relationship('User', backref='organized_meetings')
    attendees: List[str] = db.Column(db.Text, default='[]')
    notes: str = db.Column(db.Text, default='')
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def attendees_list(self) -> List[str]:
        return json_column_to_list(self.attendees)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'title': self.title,
            'date': self.date,
            'startTime': self.start_time,
            'endTime': self.end_time,
            'room': self.room,
            'organizer': self.organizer.to_dict(),
            'attendees': self.attendees_list,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat()
        }

class WorkItem(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    title: str = db.Column(db.String(100), nullable=False)
    description: str = db.Column(db.Text, default='')
    status: str = db.Column(db.String(20), default='todo')
    priority: str = db.Column(db.String(20), default='medium')
    assigned_to: str = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=True)
    created_by: str = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    due_date: datetime = db.Column(db.DateTime, nullable=True)
    tags: List[str] = db.Column(db.Text, default='[]')
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Update relationships to specify foreign keys explicitly
    assignee = db.relationship('User', foreign_keys=[assigned_to], backref='work_items')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_work_items')
    
    @property
    def tags_list(self) -> List[str]:
        return json_column_to_list(self.tags)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'assignedTo': self.assignee.to_dict() if self.assignee else None,
            'createdBy': self.creator.to_dict(),
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'tags': self.tags_list,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
            'attachments': [attachment.to_dict() for attachment in self.attachments] if hasattr(self, 'attachments') else []
        }

class ChartData(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    chart_type: str = db.Column(db.String(50), nullable=False)
    title: str = db.Column(db.String(100), nullable=False)
    data: str = db.Column(db.Text, nullable=False)  # JSON string
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_data(self) -> Dict[str, Any]:
        try:
            return json.loads(self.data)
        except json.JSONDecodeError:
            return {}
    
    def set_data(self, data_dict: Dict[str, Any]) -> None:
        self.data = json.dumps(data_dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'chartType': self.chart_type,
            'title': self.title,
            'data': self.get_data(),
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

# New model for file attachments
class FileAttachment(db.Model):
    id: int = db.Column(db.Integer, primary_key=True)
    filename: str = db.Column(db.String(255), nullable=False)
    file_type: str = db.Column(db.String(100), nullable=False)
    file_size: int = db.Column(db.Integer, nullable=False)
    data: str = db.Column(db.Text, nullable=False)  # Base64 encoded file data
    message_id: int = db.Column(db.Integer, db.ForeignKey('message.id'), nullable=True)
    work_item_id: int = db.Column(db.Integer, db.ForeignKey('work_item.id'), nullable=True)
    uploader_id: str = db.Column(db.String(50), db.ForeignKey('user.id'), nullable=False)
    uploaded_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    
    uploader = db.relationship('User', backref='uploaded_files')
    message = db.relationship('Message', backref='attachments')
    work_item = db.relationship('WorkItem', backref='attachments')
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'filename': self.filename,
            'fileType': self.file_type,
            'fileSize': self.file_size,
            'uploaderId': self.uploader_id,
            'uploaderName': self.uploader.name,
            'uploadedAt': self.uploaded_at.isoformat(),
            'messageId': self.message_id,
            'workItemId': self.work_item_id
        }

def token_required(f: Callable[..., R]) -> Callable[..., R]:
    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> R:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authorization token missing'}), 401  # type: ignore
        try:
            # Remove 'Bearer ' prefix if present
            token = token.split()[1] if len(token.split()) > 1 else token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401  # type: ignore
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401  # type: ignore
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401  # type: ignore
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/auth/login', methods=['POST'])
def login() -> RouteReturn:
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Generate JWT token with explicit algorithm
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=12)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        # Update user status with error handling
        try:
            user.is_online = True
            db.session.commit()
        except Exception as status_error:
            db.session.rollback()
            current_app.logger.error(f"Error updating user status: {status_error}")

        return jsonify({
            'user': user.to_dict(),
            'token': token
        }), 200

    except Exception as e:
        current_app.logger.error(f"Authentication error: {e}")
        return jsonify({'error': 'Authentication failed', 'details': str(e)}), 500

@app.route('/api/auth/register', methods=['POST'])
def register() -> RouteReturn:
    data = request.json
    
    # Validate input
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required registration fields'}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    try:
        new_user = User(
            id=str(uuid.uuid4()),
            name=data['name'],
            email=data['email'],
            is_online=True
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate JWT token with explicit algorithm
        token = jwt.encode({
            'user_id': new_user.id,
            'exp': datetime.utcnow() + timedelta(hours=12)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'user': new_user.to_dict(),
            'token': token
        }), 201
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify_token(current_user: User) -> RouteReturn:
    return jsonify({
        'user': current_user.to_dict(),
        'isValid': True
    }), 200

@app.route('/api/users', methods=['GET'])
@token_required
def get_users(current_user: User) -> Response:
    users = User.query.all()
    return jsonify([{
        'id': u.id, 
        'name': u.name, 
        'isOnline': u.is_online,
        'avatar': u.avatar
    } for u in users])

@app.route('/api/messages', methods=['GET', 'POST'])
@token_required
def handle_messages(current_user: User) -> RouteReturn:
    if request.method == 'GET':
        messages = Message.query.order_by(Message.timestamp.desc()).limit(100).all()
        return jsonify({
            'data': [{
                'id': m.id,
                'sender': {
                    'id': m.sender_id,
                    'name': m.sender.name if m.sender else 'Unknown'
                },
                'content': m.content,
                'timestamp': m.timestamp.isoformat(),
                'isPrivate': m.is_private,
                'priority': m.priority,
                'tags': m.tags_list,
                'mentions': m.mentions_list,
                'searchKeywords': m.search_keywords_list,
                'readBy': m.read_by_list,
                'sentiment': m.sentiment
            } for m in messages]
        })
    
    if request.method == 'POST':
        data = request.json
        if not data or not data.get('content'):
            return jsonify({'error': 'Message content is required'}), 400

        try:
            # Resolve mentions to user IDs
            resolved_mentions = []
            for mention in data.get('mentions', []):
                user = User.query.filter_by(name=mention).first()
                if user:
                    resolved_mentions.append(user.id)

            # Get sentiment from data or analyze it
            sentiment = data.get('sentiment')
            if not sentiment:
                sentiment = analyze_sentiment(data['content'])

            # Create new message with relationships
            new_message = Message(
                sender_id=current_user.id,
                content=data['content'],
                is_private=data.get('isPrivate', False),
                priority=data.get('priority', 'normal'),
                tags=json.dumps(data.get('tags', [])),
                mentions=json.dumps(resolved_mentions),
                search_keywords=json.dumps(data.get('searchKeywords', [])),
                read_by=json.dumps([current_user.id]),
                sentiment=sentiment
            )
            
            db.session.add(new_message)
            db.session.commit()
            
            return jsonify({
                'id': new_message.id,
                'sender': {
                    'id': current_user.id,
                    'name': current_user.name
                },
                'content': new_message.content,
                'timestamp': new_message.timestamp.isoformat(),
                'isPrivate': new_message.is_private,
                'priority': new_message.priority,
                'tags': new_message.tags_list,
                'mentions': [User.query.get(u).name for u in new_message.mentions_list if User.query.get(u)],
                'searchKeywords': new_message.search_keywords_list,
                'readBy': [current_user.name],
                'sentiment': new_message.sentiment
            }), 201
        
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error creating message: {e}")
            return jsonify({'error': 'Failed to create message', 'details': str(e)}), 500

# Sentiment analysis endpoint
@app.route('/api/analyze/sentiment', methods=['POST'])
@token_required
def analyze_message_sentiment(current_user: User) -> RouteReturn:
    data = request.json
    if not data or 'text' not in data:
        return jsonify({'error': 'Text to analyze is required'}), 400
    
    text = data['text']
    sentiment = analyze_sentiment(text)
    
    return jsonify({
        'text': text,
        'sentiment': sentiment,
        'analysisTime': datetime.utcnow().isoformat()
    })

# Team sentiment analysis endpoint
@app.route('/api/analyze/team-sentiment', methods=['GET'])
@token_required
def get_team_sentiment(current_user: User) -> RouteReturn:
    # Get recent messages, limit to last 100
    recent_messages = Message.query.filter_by(is_private=False).order_by(Message.timestamp.desc()).limit(100).all()
    
    if not recent_messages:
        return jsonify({
            'sentiment': 'neutral',
            'insight': 'Not enough data to analyze team sentiment',
            'data': {
                'positive': 0,
                'neutral': 0,
                'negative': 0
            }
        })
    
    # Count sentiments
    sentiment_counts = {
        'positive': 0,
        'neutral': 0,
        'negative': 0
    }
    
    for message in recent_messages:
        sentiment_counts[message.sentiment] += 1
    
    total_messages = len(recent_messages)
    positive_percent = round((sentiment_counts['positive'] / total_messages) * 100)
    negative_percent = round((sentiment_counts['negative'] / total_messages) * 100)
    
    # Determine overall sentiment and insight
    if positive_percent > 60:
        overall_sentiment = 'positive'
        insight = 'Team morale is high with positive communication patterns.'
    elif negative_percent > 40:
        overall_sentiment = 'negative'
        insight = 'Team might be facing challenges. Consider scheduling a check-in meeting.'
    elif sentiment_counts['neutral'] > (sentiment_counts['positive'] + sentiment_counts['negative']):
        overall_sentiment = 'neutral'
        insight = 'Conversations are mostly neutral. Consider encouraging more open expression.'
    else:
        overall_sentiment = 'mixed'
        insight = 'Mixed sentiments detected in team communications. Regular sync meetings recommended.'
    
    return jsonify({
        'sentiment': overall_sentiment,
        'insight': insight,
        'data': sentiment_counts,
        'messageCount': total_messages,
        'analysis': {
            'positivePercent': positive_percent,
            'negativePercent': negative_percent,
            'neutralPercent': 100 - positive_percent - negative_percent
        }
    })

# Meetings API routes
@app.route('/api/meetings', methods=['GET'])
@token_required
def get_meetings(current_user: User) -> RouteReturn:
    try:
        print(f"Getting meetings for user: {current_user.id} ({current_user.name})")
        meetings = Meeting.query.all()
        print(f"Found {len(meetings)} meetings")
        
        # Debug information about each meeting
        for meeting in meetings:
            print(f"Meeting {meeting.id}: {meeting.title} (Date: {meeting.date})")
            
        return jsonify([meeting.to_dict() for meeting in meetings]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching meetings: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch meetings', 'details': str(e)}), 500

@app.route('/api/meetings', methods=['POST'])
@token_required
def create_meeting(current_user: User) -> RouteReturn:
    data = request.get_json()
    
    if not data or not all(key in data for key in ['title', 'date', 'startTime', 'endTime', 'room']):
        return jsonify({'error': 'Missing required meeting fields'}), 400
    
    try:
        # Add debugging
        print(f"Creating meeting with data: {data}")
        print(f"Current user: {current_user.id} ({current_user.name})")
        
        # Ensure attendees is a valid JSON array
        attendees = data.get('attendees', [])
        if not isinstance(attendees, list):
            attendees = []
            
        print(f"Attendees: {attendees}")
        
        meeting = Meeting(
            title=data['title'],
            date=data['date'],
            start_time=data['startTime'],
            end_time=data['endTime'],
            room=data['room'],
            organizer_id=current_user.id,
            attendees=json.dumps(attendees),
            notes=data.get('notes', '')
        )
        
        db.session.add(meeting)
        db.session.commit()
        
        print(f"Successfully created meeting {meeting.id}")
        return jsonify(meeting.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating meeting: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to create meeting', 'details': str(e)}), 500

@app.route('/api/meetings/<int:meeting_id>', methods=['GET'])
@token_required
def get_meeting(current_user: User, meeting_id: int) -> RouteReturn:
    try:
        meeting = Meeting.query.get(meeting_id)
        if not meeting:
            return jsonify({'error': 'Meeting not found'}), 404
        
        return jsonify(meeting.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching meeting: {e}")
        return jsonify({'error': 'Failed to fetch meeting', 'details': str(e)}), 500

@app.route('/api/meetings/<int:meeting_id>', methods=['PUT'])
@token_required
def update_meeting(current_user: User, meeting_id: int) -> RouteReturn:
    data = request.get_json()
    
    try:
        meeting = Meeting.query.get(meeting_id)
        if not meeting:
            return jsonify({'error': 'Meeting not found'}), 404
        
        # Update fields if provided
        if 'title' in data:
            meeting.title = data['title']
        if 'date' in data:
            meeting.date = data['date']
        if 'startTime' in data:
            meeting.start_time = data['startTime']
        if 'endTime' in data:
            meeting.end_time = data['endTime']
        if 'room' in data:
            meeting.room = data['room']
        if 'attendees' in data:
            meeting.attendees = json.dumps(data['attendees'])
        if 'notes' in data:
            meeting.notes = data['notes']
        
        db.session.commit()
        return jsonify(meeting.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating meeting: {e}")
        return jsonify({'error': 'Failed to update meeting', 'details': str(e)}), 500

@app.route('/api/meetings/<int:meeting_id>', methods=['DELETE'])
@token_required
def delete_meeting(current_user: User, meeting_id: int) -> RouteReturn:
    try:
        meeting = Meeting.query.get(meeting_id)
        if not meeting:
            return jsonify({'error': 'Meeting not found'}), 404
        
        db.session.delete(meeting)
        db.session.commit()
        return jsonify({'message': 'Meeting deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting meeting: {e}")
        return jsonify({'error': 'Failed to delete meeting', 'details': str(e)}), 500

# Work items API routes
@app.route('/api/work-items', methods=['GET'])
@token_required
def get_work_items(current_user: User) -> RouteReturn:
    try:
        print(f"Getting work items for user: {current_user.id} ({current_user.name})")
        work_items = WorkItem.query.all()
        print(f"Found {len(work_items)} work items")
        
        # Debug information about each work item
        for item in work_items:
            print(f"Work item {item.id}: {item.title} (Status: {item.status})")
            
        return jsonify([item.to_dict() for item in work_items]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching work items: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch work items', 'details': str(e)}), 500

@app.route('/api/work-items', methods=['POST'])
@token_required
def create_work_item(current_user: User) -> RouteReturn:
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        # Add debugging
        print(f"Creating work item with data: {data}")
        print(f"Current user: {current_user.id} ({current_user.name})")
        
        # Check if assignedTo exists and is a valid user ID
        assigned_to = data.get('assignedTo')
        if assigned_to:
            assignee = User.query.get(assigned_to)
            if not assignee:
                return jsonify({'error': 'Assigned user not found'}), 404
        
        # Format due date if present
        due_date = None
        if data.get('dueDate'):
            try:
                due_date = datetime.fromisoformat(data['dueDate'])
            except ValueError as e:
                print(f"Error parsing due date: {e}")
                return jsonify({'error': f'Invalid date format: {e}'}), 400
        
        # Create work item
        work_item = WorkItem(
            title=data['title'],
            description=data.get('description', ''),
            status=data.get('status', 'todo'),
            priority=data.get('priority', 'medium'),
            assigned_to=assigned_to,
            created_by=current_user.id,
            due_date=due_date,
            tags=json.dumps(data.get('tags', []))
        )
        
        db.session.add(work_item)
        db.session.commit()
        
        return jsonify(work_item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating work item: {e}")
        # Also print to console for debugging
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to create work item', 'details': str(e)}), 500

@app.route('/api/work-items/<int:item_id>', methods=['GET'])
@token_required
def get_work_item(current_user: User, item_id: int) -> RouteReturn:
    try:
        work_item = WorkItem.query.get(item_id)
        if not work_item:
            return jsonify({'error': 'Work item not found'}), 404
        
        return jsonify(work_item.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching work item: {e}")
        return jsonify({'error': 'Failed to fetch work item', 'details': str(e)}), 500

@app.route('/api/work-items/<int:item_id>', methods=['PUT'])
@token_required
def update_work_item(current_user: User, item_id: int) -> RouteReturn:
    data = request.get_json()
    
    try:
        work_item = WorkItem.query.get(item_id)
        if not work_item:
            return jsonify({'error': 'Work item not found'}), 404
        
        # Update fields if provided
        if 'title' in data:
            work_item.title = data['title']
        if 'description' in data:
            work_item.description = data['description']
        if 'status' in data:
            work_item.status = data['status']
        if 'priority' in data:
            work_item.priority = data['priority']
        if 'assignedTo' in data:
            work_item.assigned_to = data['assignedTo']
        if 'dueDate' in data:
            work_item.due_date = datetime.fromisoformat(data['dueDate']) if data['dueDate'] else None
        if 'tags' in data:
            work_item.tags = json.dumps(data['tags'])
        
        db.session.commit()
        return jsonify(work_item.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating work item: {e}")
        return jsonify({'error': 'Failed to update work item', 'details': str(e)}), 500

@app.route('/api/work-items/<int:item_id>', methods=['DELETE'])
@token_required
def delete_work_item(current_user: User, item_id: int) -> RouteReturn:
    try:
        work_item = WorkItem.query.get(item_id)
        if not work_item:
            return jsonify({'error': 'Work item not found'}), 404
        
        db.session.delete(work_item)
        db.session.commit()
        return jsonify({'message': 'Work item deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting work item: {e}")
        return jsonify({'error': 'Failed to delete work item', 'details': str(e)}), 500

# Chart data API routes
@app.route('/api/chart-data', methods=['GET'])
@token_required
def get_chart_data(current_user: User) -> RouteReturn:
    try:
        chart_type = request.args.get('type')
        charts = ChartData.query.filter_by(chart_type=chart_type) if chart_type else ChartData.query.all()
        return jsonify([chart.to_dict() for chart in charts]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching chart data: {e}")
        return jsonify({'error': 'Failed to fetch chart data', 'details': str(e)}), 500

@app.route('/api/chart-data', methods=['POST'])
@token_required
def create_chart_data(current_user: User) -> RouteReturn:
    data = request.get_json()
    
    if not data or not all(key in data for key in ['chartType', 'title', 'data']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        chart_data = ChartData(
            chart_type=data['chartType'],
            title=data['title'],
            data=json.dumps(data['data'])
        )
        
        db.session.add(chart_data)
        db.session.commit()
        
        return jsonify(chart_data.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating chart data: {e}")
        return jsonify({'error': 'Failed to create chart data', 'details': str(e)}), 500

@app.route('/api/chart-data/<int:chart_id>', methods=['PUT'])
@token_required
def update_chart_data(current_user: User, chart_id: int) -> RouteReturn:
    data = request.get_json()
    
    try:
        chart_data = ChartData.query.get(chart_id)
        if not chart_data:
            return jsonify({'error': 'Chart data not found'}), 404
        
        # Update fields if provided
        if 'title' in data:
            chart_data.title = data['title']
        if 'data' in data:
            chart_data.data = json.dumps(data['data'])
        
        db.session.commit()
        return jsonify(chart_data.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating chart data: {e}")
        return jsonify({'error': 'Failed to update chart data', 'details': str(e)}), 500

@app.route('/api/chart-data/<int:chart_id>', methods=['DELETE'])
@token_required
def delete_chart_data(current_user: User, chart_id: int) -> RouteReturn:
    try:
        chart_data = ChartData.query.get(chart_id)
        if not chart_data:
            return jsonify({'error': 'Chart data not found'}), 404
        
        db.session.delete(chart_data)
        db.session.commit()
        return jsonify({'message': 'Chart data deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting chart data: {e}")
        return jsonify({'error': 'Failed to delete chart data', 'details': str(e)}), 500

# File attachment routes
@app.route('/api/files', methods=['POST'])
@token_required
def upload_file(current_user: User) -> RouteReturn:
    data = request.get_json()
    
    if not data or not all(key in data for key in ['filename', 'fileType', 'fileData']):
        return jsonify({'error': 'Missing required file fields'}), 400
    
    try:
        # Extract file information from the request
        filename = data['filename']
        file_type = data['fileType']
        file_data = data['fileData']  # Base64 encoded
        
        # Calculate file size
        file_size = len(base64.b64decode(file_data.split(',')[1] if ',' in file_data else file_data))
        
        # Create file attachment record
        file_attachment = FileAttachment(
            filename=filename,
            file_type=file_type,
            file_size=file_size,
            data=file_data,
            message_id=data.get('messageId'),
            work_item_id=data.get('workItemId'),
            uploader_id=current_user.id
        )
        
        # Add debugging information
        print(f"Uploading file: {filename}, type: {file_type}, size: {file_size}, message_id: {data.get('messageId')}, work_item_id: {data.get('workItemId')}")
        
        db.session.add(file_attachment)
        db.session.commit()
        
        return jsonify(file_attachment.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading file: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to upload file', 'details': str(e)}), 500

@app.route('/api/files/<int:file_id>', methods=['GET'])
@token_required
def get_file(current_user: User, file_id: int) -> RouteReturn:
    try:
        file_attachment = FileAttachment.query.get(file_id)
        if not file_attachment:
            return jsonify({'error': 'File not found'}), 404
        
        return jsonify({
            **file_attachment.to_dict(),
            'data': file_attachment.data
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching file: {e}")
        return jsonify({'error': 'Failed to fetch file', 'details': str(e)}), 500

@app.route('/api/files/message/<int:message_id>', methods=['GET'])
@token_required
def get_message_files(current_user: User, message_id: int) -> RouteReturn:
    try:
        files = FileAttachment.query.filter_by(message_id=message_id).all()
        return jsonify([file.to_dict() for file in files]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching message files: {e}")
        return jsonify({'error': 'Failed to fetch message files', 'details': str(e)}), 500

@app.route('/api/files/work-item/<int:work_item_id>', methods=['GET'])
@token_required
def get_work_item_files(current_user: User, work_item_id: int) -> RouteReturn:
    try:
        files = FileAttachment.query.filter_by(work_item_id=work_item_id).all()
        return jsonify([file.to_dict() for file in files]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching work item files: {e}")
        return jsonify({'error': 'Failed to fetch work item files', 'details': str(e)}), 500

@app.route('/api/files/<int:file_id>', methods=['DELETE'])
@token_required
def delete_file(current_user: User, file_id: int) -> RouteReturn:
    try:
        file_attachment = FileAttachment.query.get(file_id)
        if not file_attachment:
            return jsonify({'error': 'File not found'}), 404
        
        # Check if the user is the uploader
        if file_attachment.uploader_id != current_user.id:
            return jsonify({'error': 'Unauthorized to delete this file'}), 403
        
        db.session.delete(file_attachment)
        db.session.commit()
        
        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting file: {e}")
        return jsonify({'error': 'Failed to delete file', 'details': str(e)}), 500

# Add route to check if email exists
@app.route('/api/auth/check-email/<email>', methods=['GET'])
def check_email(email: str) -> RouteReturn:
    try:
        user = User.query.filter_by(email=email).first()
        return jsonify({
            'exists': user is not None,
            'message': 'Email already registered' if user else 'Email available'
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error checking email: {e}")
        return jsonify({'error': 'Failed to check email', 'details': str(e)}), 500

# Add route to reset database (development only)
@app.route('/api/dev/reset-db', methods=['POST'])
def reset_database() -> RouteReturn:
    try:
        # Drop all tables
        db.drop_all()
        
        # Create all tables
        db.create_all()
        
        # Create test user
        test_user = User(
            id=str(uuid.uuid4()),
            name="Test User",
            email="test@example.com",
            is_online=True
        )
        test_user.set_password("password123")
        
        test_user2 = User(
            id=str(uuid.uuid4()),
            name="Another User",
            email="user2@example.com",
            is_online=False
        )
        test_user2.set_password("password123")
        
        db.session.add(test_user)
        db.session.add(test_user2)
        db.session.commit()
        
        # Create test messages
        messages = [
            Message(
                content="Hello! How is everyone doing?",
                sender_id=test_user.id,
                is_private=False,
                priority="normal",
                sentiment="positive",
                tags=json.dumps(["greeting", "team"]),
                mentions=json.dumps([])
            ),
            Message(
                content="I'm working on the new feature. It's coming along well!",
                sender_id=test_user.id,
                is_private=False,
                priority="normal",
                sentiment="positive",
                tags=json.dumps(["work", "development"]),
                mentions=json.dumps([])
            ),
            Message(
                content="@AnotherUser Can you help with the database issue?",
                sender_id=test_user.id,
                is_private=True,
                priority="urgent",
                sentiment="neutral",
                tags=json.dumps(["help", "database"]),
                mentions=json.dumps([test_user2.id])
            )
        ]
        
        for msg in messages:
            db.session.add(msg)
        
        # Create test meetings
        meetings = [
            Meeting(
                title="Team Standup",
                date=datetime.utcnow().date().isoformat(),
                start_time="09:00",
                end_time="09:30",
                room="Conference Room A",
                organizer_id=test_user.id,
                attendees=json.dumps([test_user.id, test_user2.id]),
                notes="Daily standup meeting to discuss progress and blockers."
            ),
            Meeting(
                title="Sprint Planning",
                date=(datetime.utcnow() + timedelta(days=1)).date().isoformat(),
                start_time="14:00",
                end_time="16:00",
                room="Main Hall",
                organizer_id=test_user.id,
                attendees=json.dumps([test_user.id, test_user2.id]),
                notes="Planning for the next sprint cycle."
            )
        ]
        
        for meeting in meetings:
            db.session.add(meeting)
        
        # Create work items
        statuses = ["todo", "in-progress", "review", "done"]
        priorities = ["low", "medium", "high", "urgent"]
        
        for i in range(1, 11):
            work_item = WorkItem(
                title=f"Task {i}",
                description=f"This is a description for task {i}",
                status=random.choice(statuses),
                priority=random.choice(priorities),
                assigned_to=test_user.id if i % 2 == 0 else test_user2.id,
                created_by=test_user.id,
                due_date=(datetime.utcnow() + timedelta(days=i)).date(),
                tags=json.dumps([f"tag{i}", "work"])
            )
            db.session.add(work_item)
        
        # Create chart data
        chart = ChartData(
            chart_type="bar",
            title="Sample Task Status",
            data=json.dumps([
                {"name": "Todo", "value": 5},
                {"name": "In Progress", "value": 3},
                {"name": "Review", "value": 2},
                {"name": "Done", "value": 7}
            ])
        )
        db.session.add(chart)
        
        db.session.commit()
        return jsonify({'message': 'Database reset successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error resetting database: {e}")
        return jsonify({'error': 'Failed to reset database', 'details': str(e)}), 500

@app.route('/api/messages/<int:message_id>', methods=['DELETE'])
@token_required
def delete_message(current_user: User, message_id: int) -> RouteReturn:
    try:
        message = Message.query.get(message_id)
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        # Check if the user is the sender of the message
        if message.sender_id != current_user.id:
            return jsonify({'error': 'Unauthorized to delete this message'}), 403
        
        db.session.delete(message)
        db.session.commit()
        
        return jsonify({'message': 'Message deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting message: {e}")
        return jsonify({'error': 'Failed to delete message', 'details': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables created successfully")
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
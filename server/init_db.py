from app import app, db, User, Message, Meeting, WorkItem, ChartData, FileAttachment
import uuid
import json
from datetime import datetime, timedelta
import random

def reset_db():
    with app.app_context():
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
        print("Database initialized with test data.")

if __name__ == "__main__":
    reset_db() 
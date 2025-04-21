from app import app, db

if __name__ == '__main__':
    with app.app_context():
        db.drop_all()  # Use with caution - this will delete existing data
        print("Dropped all existing tables")
        
        db.create_all()
        print("Created all database tables")
        
        # Create a test user if needed
        from app import User, Message, Meeting, WorkItem, ChartData, FileAttachment
        import uuid
        
        test_user = User.query.filter_by(email="test@example.com").first()
        if not test_user:
            test_user = User(
                id=str(uuid.uuid4()),
                name="Test User",
                email="test@example.com",
                is_online=True
            )
            test_user.set_password("password123")
            db.session.add(test_user)
            db.session.commit()
            print(f"Created test user: {test_user.name} ({test_user.email})")
        else:
            print(f"Test user already exists: {test_user.name} ({test_user.email})")
            
        print("Database initialization complete!") 
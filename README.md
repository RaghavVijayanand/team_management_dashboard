# Kinetics Messenger

A modern team collaboration platform with real-time messaging, sentiment analysis, team insights, meeting scheduling, and file sharing capabilities.

## Features

- **Secure Authentication**: JWT-based user authentication system
- **Real-time Messaging**: Send and receive messages in real-time
- **Sentiment Analysis**: Automatic analysis of message sentiment
- **Message Prioritization**: Mark messages as urgent, important, normal, or low priority
- **Tagging System**: Organize conversations with tags
- **User Mentions**: Mention team members in messages
- **Private Messaging**: Send private messages to specific users
- **Team Mood Insights**: Get insights into overall team sentiment
- **Voice Commands**: Control the application using voice commands
- **Mobile-Responsive UI**: Use the app on any device
- **File Sharing**: Attach and share files in messages and work items
- **Work Item Tracking**: Manage tasks with status, priority, and assignees
- **Meeting Scheduler**: Plan and organize team meetings with room selection
- **Project Analytics**: Visualize team performance and project metrics

## New Features

### Enhanced Meeting Scheduler

- **Interactive Calendar**: View and schedule meetings on a visual calendar
- **Room Selection**: Choose meeting rooms based on availability and capacity
- **Attendee Management**: Add and remove attendees to meetings
- **Meeting Notes**: Include detailed notes for meeting preparation
- **Meeting Management**: View, edit, and delete existing meetings
- **Scheduling Conflicts**: Automatically detect scheduling conflicts

### File Sharing System

- **Attach Files to Messages**: Share documents, images, and other files directly in chat
- **Attach Files to Work Items**: Include relevant documents with your tasks
- **File Preview**: View images and PDFs directly in the app
- **File Management**: Download, view, and delete shared files
- **Security**: Files are stored securely and only accessible to authorized users

## Tech Stack

### Frontend
- React
- TypeScript
- Material UI
- React Router
- Recharts

### Backend
- Flask
- SQLAlchemy
- Flask-CORS
- Flask-Bcrypt
- PyJWT
- SQLite

## Getting Started

### Prerequisites
- Node.js (v14+) and npm
- Python 3.8+
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kinetics-messenger.git
   cd kinetics-messenger
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Set up the backend:
   - For Windows users:
     ```
     start_server.bat
     ```
   - For Mac/Linux users:
     ```bash
     chmod +x start_server.sh
     ./start_server.sh
     ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Usage

### Authentication

1. Register a new account using the registration form
2. Log in using your credentials
3. Use the app!

### Sending Messages

1. Go to the Chat tab
2. Type your message in the text field
3. Add optional details like priority, tags, or mentions
4. To attach a file, click the "Add Attachments" button
5. Select a file to upload (max size: 10MB)
6. Send your message

### Managing Work Items

1. Go to the Work Tracker tab
2. Create a new work item by clicking "Add Work Item"
3. Fill in the details (title, description, status, priority, etc.)
4. To attach files to the work item, click "Add Attachments"
5. Click "Create" to save the work item

### Scheduling Meetings

1. Navigate to the Meetings tab
2. Click "New Meeting" to create a meeting
3. Fill in meeting details (title, date, time, room)
4. Add attendees by typing their names or emails
5. Add optional meeting notes
6. Review the meeting details
7. Click "Confirm Meeting" to save

### Using Voice Commands

1. Click the microphone button in the bottom right corner
2. Speak a command like "go to dashboard" or "open chat"
3. The app will navigate to the requested page

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get a JWT token
- `GET /api/auth/verify` - Verify a JWT token

### Message Endpoints

- `GET /api/messages` - Get all messages
- `POST /api/messages` - Create a new message
- `DELETE /api/messages/:id` - Delete a message

### Meeting Endpoints

- `GET /api/meetings` - Get all meetings
- `POST /api/meetings` - Create a new meeting
- `GET /api/meetings/:id` - Get a meeting by ID
- `PUT /api/meetings/:id` - Update a meeting
- `DELETE /api/meetings/:id` - Delete a meeting

### Work Item Endpoints

- `GET /api/work-items` - Get all work items
- `POST /api/work-items` - Create a new work item
- `GET /api/work-items/:id` - Get a work item by ID
- `PUT /api/work-items/:id` - Update a work item
- `DELETE /api/work-items/:id` - Delete a work item

### File Attachment Endpoints

- `POST /api/files` - Upload a new file
- `GET /api/files/:id` - Get a file by ID with file data
- `GET /api/files/message/:messageId` - Get files attached to a message
- `GET /api/files/work-item/:workItemId` - Get files attached to a work item
- `DELETE /api/files/:id` - Delete a file

### Sentiment Analysis Endpoints

- `POST /api/analyze/sentiment` - Analyze the sentiment of text
- `GET /api/analyze/team-sentiment` - Get team sentiment analysis

## Troubleshooting

### Common Issues

1. **CORS Issues**: If experiencing CORS errors, ensure that the backend server is properly configured to accept requests from the frontend origin (`http://localhost:5173`).

2. **Meeting Creation Fails**: Ensure all required fields (title, date, start/end time, room) are properly filled out.

3. **File Upload Issues**: Check that the file size is under 10MB and that the backend database is properly initialized.

4. **Authentication Errors**: Make sure your JWT token is valid and not expired. Try logging out and logging back in.

### Development Reset

To reset the database during development, use the following endpoint:
```
POST /api/dev/reset-db
```

This will recreate the database with test data for development purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

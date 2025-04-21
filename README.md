# Kinetics Chat

A modern, feature-rich chat application that enables team collaboration with sentiment analysis, work item tracking, and meeting management.

## Features

- **Real-time messaging** with public and private communication
- **Sentiment analysis** for messages and team mood tracking
- **Work item management** for task allocation and tracking
- **Meeting scheduling** with room booking and attendee management
- **File attachment** support for messages and work items
- **AI-powered features** including chat summarization and translation
- **Eye gaze tracking** for attention analytics
- **Data visualization** with customizable charts

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: SQLAlchemy with SQLite (configurable for other databases)
- **Authentication**: JWT-based token authentication
- **AI Integration**: Google Gemini API
- **Translation**: Deep-translator library

## Getting Started

### Prerequisites

- Python 3.8+
- pip package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kinetics-chat.git
   cd kinetics-chat
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the project root with:
   ```
   SECRET_KEY=your_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   DATABASE_URL=sqlite:///app.db  # or your database connection string
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd server
   python app.py
   ```

2. Start the frontend development server:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. Access the application at http://localhost:5173

## API Documentation

The application provides a RESTful API with the following main endpoints:

- **Authentication**: `/api/auth/login`, `/api/auth/register`, `/api/auth/verify`
- **Messages**: `/api/messages`
- **Meetings**: `/api/meetings`
- **Work Items**: `/api/work-items`
- **Files**: `/api/files`
- **Sentiment Analysis**: `/api/analyze/sentiment`, `/api/analyze/team-sentiment`
- **AI Features**: `/api/summarize`, `/api/ai-chat`, `/api/translate`
- **Eye Gaze**: `/api/eye-gaze`

For detailed API documentation, refer to the API documentation section.

## Development

### Database Migrations

If you make changes to the database models, you need to create a migration:

```bash
flask db migrate -m "Your migration message"
flask db upgrade
```

### Development Utilities

For development purposes, you can reset the database with sample data:

```
POST /api/dev/reset-db
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
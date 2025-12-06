# StarsTranslations Blog

A full-stack translation blog platform for game and visual novel translations with Patreon authentication.

## Features

- **Patreon OAuth Authentication** - Login with Patreon account
- **Role-based Access Control** - Admin, Translator, and User roles
- **Post Management** - Create, edit, and delete posts with version tracking
- **File Uploads** - Support for translated/original game files and screenshots
- **Comments System** - Nested comments with authentication
- **Category Filtering** - Doujin Game, Visual Novel, Doujin Manga, Admin categories
- **Translation Status Badges** - Visual indicators for translation status
- **Update Notifications** - Follow posts to get notified of updates
- **Responsive Design** - Mobile-friendly interface

## Tech Stack

### Backend
- Node.js + Express
- SQLite (better-sqlite3) - Self-contained database
- Passport.js with Patreon strategy
- JWT for authentication
- Multer for file uploads

### Frontend
- React 18
- React Router 6
- Axios for API calls
- CSS3 with custom variables

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Required environment variables:
- `PATREON_CLIENT_ID` - Get from Patreon Developer Portal
- `PATREON_CLIENT_SECRET` - Get from Patreon Developer Portal
- `JWT_SECRET` - Random secure string
- `SESSION_SECRET` - Random secure string

### 3. Set up Patreon OAuth

1. Go to https://www.patreon.com/portal/registration/register-clients
2. Create a new client
3. Set the redirect URI to: `http://localhost:3000/auth/patreon/callback`
4. Copy the Client ID and Client Secret to your `.env` file

### 4. Initialize Database

```bash
npm run setup-db
```

This will create the SQLite database with all necessary tables.

### 5. Create Upload Directories

```bash
mkdir -p uploads/attachments uploads/images
```

### 6. Run the Application

Development mode (runs both server and client):
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Usage

### First Time Setup

1. Start the application
2. The first user to log in will need to be manually promoted to admin
3. Connect to the database and update the user role:

```bash
sqlite3 data/stars-translations.db
UPDATE users SET role = 'admin' WHERE id = 1;
```

### Creating Posts

1. Login with Patreon
2. Navigate to Admin Dashboard (visible to admin/translator roles)
3. Click "Create New Post"
4. Fill in the form:
   - Basic information (title, category, etc.)
   - Optional version information
   - Upload files (translated, original, screenshots)
5. Click "Create Post"

### Managing Posts

- **Edit**: Click "Edit" button in Admin Dashboard
- **Delete**: Click "Delete" button (admin only)
- **Add Version**: Edit the post and add version information

### User Features

- **Comment**: Login and navigate to any post to comment
- **Follow**: Click "Follow for Updates" on posts you're interested in
- **Notifications**: Get notified when followed posts are updated

## File Storage

All uploaded files are stored locally in the `uploads/` directory:
- `uploads/attachments/` - Game files (ZIP, RAR, etc.)
- `uploads/images/` - Screenshots and thumbnails

This ensures you don't need external hosting services.

## Database

The SQLite database (`data/stars-translations.db`) stores:
- Users and authentication data
- Posts with version history
- Comments (with threading support)
- File metadata (files stored on filesystem)
- Notifications and follows

## Security Notes

1. Change `JWT_SECRET` and `SESSION_SECRET` to random secure strings
2. Use HTTPS in production
3. Set `NODE_ENV=production` in production
4. Consider adding rate limiting for API endpoints
5. Regular backups of the database and uploads folder

## Future Enhancements

- [ ] Patreon tier integration for paywall
- [ ] Rich text editor for post content
- [ ] Search functionality
- [ ] Email notifications
- [ ] Post scheduling
- [ ] Analytics dashboard
- [ ] Multi-language support

## License

MIT

## Support

For issues or questions, visit the GitHub repository.

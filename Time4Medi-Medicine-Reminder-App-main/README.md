# Time4Medi - Medicine Reminder App

A comprehensive medicine reminder application with browser notifications, multi-user support, and custom notification sounds.

## Features

- **Multi-User Support**: Multiple family members can have separate profiles with individual medicine schedules
- **Simple Registration**: One-step registration with name and age only
- **Profile Management**: Edit or delete user profiles with all associated data
- **Medicine Management**: Add, edit, and delete medicine reminders with detailed scheduling
- **Browser Notifications**: Native browser notifications with sound that work reliably
- **Custom Notification Sounds**: Upload your own notification sounds or use the default
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **PWA Support**: Installable as an app on mobile and desktop devices
- **Database Storage**: Secure cloud storage with Supabase

## Notification Setup

The app uses browser notifications for medicine reminders:

1. **Enable Notifications**: Click "Enable Notifications & Test Sound" when prompted
2. **Allow Permission**: Click "Allow" when your browser asks for notification permission
3. **Test Sound**: A test notification with sound will be sent immediately
4. **Scheduled Reminders**: Notifications will be sent at your scheduled medicine times

## Default Notification Sound

The app uses a default notification sound from:
`https://freesound.org/data/previews/403/403007_5121236-lq.mp3`

Users can upload their own custom sounds to override this default.

## Multi-User System

- Each user has a separate profile with individual medicine schedules
- Data is stored separately for each user using their unique ID
- Easy switching between user profiles
- Edit or delete user profiles with confirmation
- User selection screen shows medicine counts and join dates

## Technologies Used

- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- React Hook Form for form handling
- Browser Notification API for push notifications
- Local Storage for data persistence

## Browser Compatibility

- Chrome 50+
- Firefox 44+
- Safari 12+
- Edge 79+

Browser notifications work on all modern browsers and require user permission.

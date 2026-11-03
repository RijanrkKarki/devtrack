# DevTrack — Career Application Tracker

A full-stack job application tracker built to help job seekers manage applications and interview schedules.

## Features
- User registration and login
- Supabase authentication
- Secure user-specific records with Row Level Security
- Add, edit, and delete applications
- Track application statuses
- Schedule interviews
- Search and filter applications
- Dashboard statistics

## Technologies
- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL

## Installation

Clone the repository:

    git clone https://github.com/RijanrkKarki/devtrack.git
    cd devtrack

Install dependencies:

    npm install

Configure your own Supabase credentials in `.env.local`:

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

Run the application:

    npm run dev

Open http://localhost:3000

## Database
Supabase PostgreSQL with Row Level Security (RLS).

## Author
Rijan Karki
GitHub: https://github.com/RijanrkKarki

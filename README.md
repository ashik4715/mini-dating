# Mini Dating App Design

## Overview
A pixel-perfect mini dating app built with Next.js, Tailwind CSS, and MongoDB. The app presents a romantic date invitation flow with a pink/glass-morphism aesthetic.

## Architecture
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with custom theme
- **Database**: MongoDB Atlas
- **Deployment**: Vercel
- **Code Quality**: Husky pre-commit hooks

## App Flow

### Screen 1: Welcome
- Pink card with "Will you go on a date with me?" text
- Flower emojis on sides
- Two buttons: YES (pink, heart emoji) and NO (white, sad emoji)
- Glass-morphism card effect with subtle gradient background

### Screen 2: Date/Time Picker
- Title: "So... when are you free?" with calendar/paw emojis
- "Pick a day" label
- Custom calendar component (month/year navigation)
- Grid of time slots (12:00 PM to 8:30 PM)
- "Set the date" button (pink, heart emoji)

### Screen 3: Food Selection
- Title: "What are we feeling?" with utensils emoji
- 2x3 grid of food options:
  - Pizza 🍕
  - Sushi 🍣
  - Burgers 🍔
  - Pasta 🍝
  - Tacos 🌮
  - Ramen 🍜
- "Next" button (pink, sparkle emoji)
- Selected item has highlighted border

### Screen 4: Confirmation
- Title: "YAY!!" with hearts emoji
- Summary card with:
  - Calendar icon + Date
  - Clock icon + Time
  - Utensils icon + Food choice
- "I can't wait to see you!" with flower/sparkle emojis
- Footer: "normal guys send texts, i made a website on Replit. i'm not like other guys xx"

### Rejection Screen
- "That's okay! Maybe next time?" message
- Sad emoji
- Option to go back to YES/NO

## MongoDB Schema

```javascript
{
  name: String,        // Optional
  date: Date,          // Selected date
  time: String,        // Selected time (e.g., "8:00 PM")
  food: String,        // Selected food (e.g., "Pasta")
  status: String,      // 'accepted' or 'rejected'
  createdAt: Date      // Timestamp
}
```

## API Routes

### POST /api/dates
- **Request**: `{ name?, date, time, food, status }`
- **Response**: `{ success: true, date: savedDate }`
- **Error**: `{ success: false, error: string }`

## Component Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── dates/
│           └── route.ts
├── components/
│   ├── WelcomeScreen.tsx
│   ├── DateTimePicker.tsx
│   ├── FoodPicker.tsx
│   ├── ConfirmationScreen.tsx
│   └── RejectionScreen.tsx
├── lib/
│   └── mongodb.ts
└── types/
    └── index.ts
```

## Styling Details

### Colors
- Primary Pink: `#e91e63` (from screenshots)
- Light Pink: `#fce4ec`
- Background: Gradient from light pink to white
- Card: White with opacity and blur (glass-morphism)

### Typography
- Headers: Serif font (like Playfair Display)
- Body: Sans-serif

### Effects
- Cards: `backdrop-blur-sm`, `bg-white/80`, rounded corners
- Buttons: Rounded full, hover effects
- Transitions: Smooth fade between screens

## Testing
- Manual testing of all screens
- Responsive design for mobile/desktop
- MongoDB connection test

## Deployment
1. Push to GitHub
2. Connect to Vercel
3. Add environment variable: `MONGODB_URI`
4. Husky pre-commit hook for linting

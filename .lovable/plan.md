

# Dry & High Five 🚫🍺 — Full MVP Plan

## Phase 1: Foundation & Design System
- Set up the retro speakeasy design system: Playfair Display + Inter fonts, warm amber/cream/forest green palette, dark mode admin theme with gold accents
- Copy mascot image into project assets
- Configure CSS variables matching the design brief colors (#D97706, #14532D, #C5A059, #FDFBF7, #121212, #1A1A1A)

## Phase 2: Database & Auth (Supabase)
- Enable Lovable Cloud with Supabase
- Create database tables:
  - `profiles` (name, gender, sobriety_start_date, check_in_morning, check_in_evening, onboarding_complete, telegram_chat_id)
  - `user_roles` (admin role system with security definer function)
  - `messages` (user_id, direction, content, timestamp, type: checkin/crisis/ai/milestone)
  - `emotional_logs` (user_id, emotion, timestamp)
  - `milestones` (user_id, milestone_type, reached_at)
  - `mexican_holidays` (name, date, description)
  - `broadcast_campaigns` (title, content, sent_at, sent_by)
  - `telegram_bot_state` + `telegram_messages` (for polling)
- Set up auth with Google + email/password login
- Configure RLS policies

## Phase 3: Admin Dashboard (matching mockup exactly)
- **Header**: D&HF logo with mascot, language toggle (EN|ES), menu
- **Sidebar**: Dashboard, User Accounts, Subscriptions, Reports, Settings, Support navigation
- **Overview cards**: Total Active Users, New Members (Month), Retention Rate — with icons and warm styling
- **User Accounts table**: Name, Email, Join Date, Location, Subscription, Status/Mood (with emoji indicators)
- **Subscription Management table**: User ID, Plan, Status, Start Date, Experience (with emoji)
- **Success Stories sidebar section**
- Dark mode with gold (#C5A059) borders and charcoal (#121212) backgrounds
- All tables with filtering dropdowns ("All groups", "All Inso")
- Microanimations on cards and hover states

## Phase 4: Dashboard Features
- **User detail view**: sobriety streak, emotional trend (emoji chart), last check-in, conversation history
- **Message builder**: Create and send broadcast campaigns to all Telegram users
- **Holiday manager**: Add/edit/remove Mexican holidays for pre-emptive alerts
- **Check-in template editor**: Customize morning/evening message templates
- **CSV export**: Download user progress data
- **Real-time stats**: Active today count, avg sobriety streak, crisis alerts triggered

## Phase 5: Telegram Bot Integration
- Connect Telegram via Lovable's Telegram connector
- Create edge function for receiving messages via `getUpdates` polling (pg_cron every minute)
- Create edge function for sending messages through the connector gateway
- **Onboarding flow**: Warm greeting → collect name, pronoun, sobriety date, check-in times → celebratory confirmation
- Store all user data in Supabase profiles table keyed by Telegram chat ID

## Phase 6: AI Conversation Engine
- Set up Lovable AI Gateway edge function with the Mexican Spanish system prompt:
  - Identity as Dry & High Five companion — empathetic, jovial, Mexican Spanish
  - Dynamic context injection: user name, sobriety days, last emotional state, upcoming holidays
  - Guardrails: no medical advice, recommend professional help for clinical issues
  - Tone: "compa", "hermano", "carnal", "bro", "dale", "tranqui" — never preachy
- Maintain last 10 messages as conversation context per user

## Phase 7: Scheduled Check-ins
- Edge function for cron-based daily check-ins (morning + evening per user's configured times)
- Morning: motivational, energizing ("¡Buenos días, [nombre]! 🌅 Hoy es tu día [X] de libertad...")
- Evening: reflective, calm ("Oye [nombre], ¿cómo te fue hoy? 💪")
- Log responses and detect emotional state
- Auto-celebrate milestones: 1, 7, 14, 30, 60, 100, 180, 365 days with special messages

## Phase 8: Crisis Detection & Support
- Keyword detection in all messages: "tentación", "ansiedad", "caí", "recaída", "quiero tomar", "no puedo más", "quiero beber", "quiero chupar", "me quiero empedar", etc.
- Immediate calm, structured response (presence, not lecture)
- "🆘" / "ayudame" / "necesito ayuda" command triggers grounding exercise (5-4-3-2-1 technique) + Mexico crisis hotline
- Pre-emptive alerts: 48 hours before Mexican holidays/weekends, send preparedness strategies
- Log all crisis events for admin dashboard visibility

## Language & Tone
- All Telegram messages: Mexican Spanish, warm, colloquial
- Admin dashboard: Latin American Spanish
- Error messages: always friendly, never technical


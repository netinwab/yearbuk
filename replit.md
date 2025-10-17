# Yearbuk - Digital Yearbook Platform

## Overview
Yearbuk is a comprehensive digital yearbook web application designed to allow schools to create and manage yearbooks. It also provides a platform for alumni and viewers to access, purchase, and upload memories and photos, aiming to digitize and enrich the traditional yearbook experience.

## User Preferences
- **Optimization**: Minimize agent usage due to trial account limits
- **Focus**: Complete features with testing before moving to next tasks

## System Architecture

### UI/UX Decisions
- Consistent Glassmorphism design aesthetic.
- Mobile-first responsive design approach using Tailwind CSS breakpoints across key pages (e.g., signup, viewer-signup, school-signup, yearbook-viewer).
- Notification bell system with unread counts, detailed dropdowns, and auto-refresh on key management pages.

### Technical Implementations
- **Frontend**: React, Wouter for routing, TanStack Query for data fetching, Tailwind CSS for styling, and shadcn/ui for UI components.
- **Backend**: Node.js with Express.
- **Database**: PostgreSQL, managed with Drizzle ORM. Schema defined in `shared/schema.ts`.
- **Authentication**: Session-based authentication using `express-session` with distinct user roles (viewer, school, super-admin). Email verification system implemented for both viewer and school registration.
- **Two-Factor Authentication (2FA)**: Enhanced security for super admin login with email-based 6-digit verification codes:
  - **Code Generation**: 6-digit codes generated and hashed using bcrypt for secure storage
  - **Expiry**: Codes expire after 5 minutes for security
  - **Smart Code Detection**: New codes only sent if no valid code exists or previous code expired (prevents duplicate codes on repeated login attempts)
  - **Cooldown**: 50-second cooldown enforced between code resend requests
  - **Email Delivery**: Codes sent to super admin email (netonwabuisi83@gmail.com) using Resend
  - **Login Tracking**: All 2FA attempts (success, failure, pending) logged in login activity
  - **Code Lifecycle**: Codes cleared after successful use; resend button invalidates old code and generates fresh one
  - **UI**: Dedicated 2FA verification page (`/two-factor-auth`) with code input, resend button, and countdown timer
- **Environment Variables**: Price constants converted to environment variables for security and flexibility:
  - `SCHOOL_YEAR_PRICE` (default: 16.99 USD)
  - `VIEWER_YEAR_PRICE` (default: 6.99 USD)
  - `BADGE_SLOT_PRICE` (default: 0.99 USD)
  - Fallback values ensure system stability if environment variables are not set
- **School Approval Workflow**: Multi-step approval process with email verification, super-admin review, and automated notifications.
- **PDF Handling**: Automatic assignment of front (page 1) and back (last page) covers upon PDF yearbook upload.
- **Price Management**: UI for schools to manage yearbook pricing, including viewing history, setting prices within a valid range, and enforcing a 30-day cooldown for price increases.
- **Deployment Fixes**: Path alias resolution for TypeScript via `esbuild-plugin-path-alias` and `esbuild.config.js` to ensure consistent builds across development (Replit/Vite) and production (Render/Node.js) environments.
- **Validation**: Robust year parameter validation to prevent database errors from invalid inputs.
- **Yearbook Security**: Comprehensive anti-download protection system to prevent unauthorized image saving:
  - **Backend Security**: All yearbook images served through protected routes (`/api/secure-image/yearbooks/*`) with authentication and purchase verification
  - **Permission Checks**: Multi-layered authorization (super-admin access, school ownership, viewer purchase verification)
  - **Frontend Protection**: Global event listeners blocking right-click, long-press (iOS/Android), and drag-and-drop on yearbook images
  - **CSS Anti-Download**: Classes `.protected-image` and `.yearbook-page-image` with disabled pointer events, user-select, and touch-callout
  - **Alternative Rendering**: `YearbookPageImage` component supports background-image mode for enhanced security vs traditional `<img>` tags
  - **Global Component**: `YearbookProtection` component in App.tsx provides app-wide event listener coverage

### Feature Specifications
- **Core Functionality**: Yearbook creation, management, viewing, purchasing, and memory/photo uploads.
- **User Management**: Email verification flow for new registrations, with token expiration and resend functionality.
- **School Management**: Complete school approval workflow with the following steps:
  1. School registers with admin credentials (stored temporarily)
  2. School receives email verification link (24-hour expiry)
  3. After email verification, super-admin receives notification
  4. Super-admin can approve or reject with password confirmation
  5. Approved schools receive login credentials via email
  6. Rejected schools receive rejection email with reason
  7. Schools can only log in after email verification and approval
- **Public Uploads**: Guest upload functionality via `/memory-upload` or direct links (`/upload/:code`), protected by Google reCAPTCHA v2 (checkbox) verification for guest users. Logged-in users bypass reCAPTCHA verification.
- **Alumni Upload Code Notifications**: Automatic notification system for verified alumni when schools create upload codes:
  - **Auto-Notification**: When a school creates an upload code, all verified alumni for that graduation year automatically receive a notification
  - **Notification UI**: Special notification display with upload code (copy button), live expiry countdown timer, and school/year details
  - **Auto-Cleanup**: Background job runs every 30 minutes to remove expired upload code notifications
  - **Auto-Delete**: Notifications are automatically deleted when schools remove upload codes
  - **Database Fields**: Added `uploadCode`, `expiresAt`, and `link` fields to notifications table for upload code tracking

### System Design Choices
- In-memory storage (`MemStorage` in `server/storage.ts`) is used for all CRUD operations, abstracting data persistence details.
- Deployment is targeted for Render, with specific build and start commands, and environment variable configurations.

## External Dependencies
- **Database**: PostgreSQL (Neon-backed).
- **Email Service**: Resend API for sending verification, password reset, and notification emails. Supports sandbox mode for testing without domain verification.
- **Session Management**: `express-session` for server-side sessions.
- **Google reCAPTCHA**: Integrated reCAPTCHA v2 (checkbox) for guest upload verification. Requires RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY environment variables.

## Email Configuration (Resend)
**Sandbox Mode for Testing** (Currently Active):
- Set `USE_SANDBOX_MODE=true` in environment secrets to enable sandbox testing
- Uses `onboarding@resend.dev` as sender (no domain verification needed)
- All emails appear in Resend dashboard under "Emails" tab
- Perfect for testing verification emails without a verified domain

**Production Mode**:
- Set `USE_SANDBOX_MODE=false` and configure `RESEND_FROM_EMAIL` with your verified domain email
- Requires domain verification in Resend dashboard

**Test Accounts** (Pre-verified):
- Test school account: `test_school` (email verified by default)
- Test viewer account: `test_viewer` (email verified by default)
# SendAm

SendAm is a mobile marketplace and logistics coordination app for same-city errands, market runs, and on-demand delivery. It connects users who need goods sourced or transported with local runners who understand the city, know the markets, and can fulfill errands quickly.

This repository contains the frontend client, built with Expo, React Native, TypeScript, and Expo Router. The backend for this app lives in [backend](/home/kashim/nite-personal/sahara-nomad/backend) and is implemented with FastAPI. Together, the frontend and backend support authentication, runner discovery, errand creation, live tracking, chat, wallet operations, and notifications.

This README is written as both:

- a product overview for someone evaluating the business and user experience
- a portfolio and engineering overview for recruiters, hiring managers, and developers reviewing the codebase

## Why This Project Matters

In many cities, especially dense urban markets, getting something done still depends on fragmented offline coordination. A person may know what they need, but not who to call, where to source it, or how to move it across town efficiently. SendAm turns that informal network into a structured software workflow.

At the product level, the app demonstrates a complete service loop:

1. Acquire demand through onboarding and authentication.
2. Let users discover available supply through runner search and market filters.
3. Convert intent into structured errands with pickup, dropoff, price, and urgency.
4. Keep users engaged during fulfillment through live tracking, messaging, and alerts.
5. Support repeat usage through wallet history, payment methods, and account persistence.

For hiring purposes, this is not just a UI clone or isolated demo screen set. It is a real application-shaped codebase with:

- authenticated routing
- persistent session state
- backend-driven data flows
- real-time messaging via WebSocket
- push notifications
- location-assisted form workflows
- wallet and transaction surfaces
- reusable UI primitives and design tokens

## What This Project Says About Me

This project demonstrates the ability to:

- design and ship an end-to-end product, not just isolated components
- build production-shaped mobile interfaces in React Native
- work with authenticated APIs and session lifecycle management
- connect frontend state to real backend workflows
- implement route guards and protected navigation flows
- integrate mobile capabilities such as notifications, secure storage, and location
- structure a codebase around reusable UI and shared context
- think in terms of user journey, platform behavior, and business logic at the same time

If you are a recruiter or hiring manager, the strongest signal here is that this app combines product thinking with implementation depth. It is not only visually designed, it is operationally wired.

## Elevator Pitch

SendAm helps people get things done across the city by turning local runner networks into a structured marketplace. Users can post errands, discover nearby runners, track live delivery progress, chat in context, manage payment methods, and receive status updates throughout the transaction.

## Core Product Value

### For users

- Post errands for packages, market sourcing, food delivery, or custom requests
- Discover nearby runners using location and market-aware search
- Track active errands through clear fulfillment steps
- Chat directly with runners within the context of an errand
- Receive alerts for operational updates
- Manage wallet balance and transaction history

### For runners

- Gain access to demand from nearby users
- Turn local knowledge into income
- Operate within a structured fulfillment flow instead of ad hoc coordination

### For the platform

- Structured demand capture
- Repeatable order lifecycle
- In-app communication
- Financial activity surfaces
- Retention hooks via notifications, chats, and history

## Product Features

### Authentication and onboarding

- Branded splash screen
- Multi-step onboarding experience
- Login and signup
- OTP verification support
- Session persistence using secure device storage
- Protected route guards that separate public and authenticated navigation

### Marketplace home dashboard

- Personalized greeting
- Active errand overview
- Nearby runner discovery
- Unread notification count
- Fast navigation to profile and activity surfaces
- Pull-to-refresh interaction

### Runner discovery

- Search by market and free text
- Filter by availability, proximity, and rating-related states
- Trending and recent search behavior
- Runner profile deep-links

### Errand creation

- Category selection
- Pickup and dropoff entry
- Location autofill using device GPS
- Base fee and urgency logic
- Payload structure that supports targeted runner assignment

### Errand tracking

- Step-based progress mapping
- Live status card
- Runner summary
- Cancellation handling
- Route and price visibility

### Messaging

- Conversation list
- Unread filtering
- HTTP-backed send and history
- WebSocket-backed live updates
- Errand-aware chat context

### Notifications

- Expo push token registration
- Android notification channel setup
- Push-token sync to backend
- In-app alerts inbox
- Mark-as-read and clear-all behavior
- Deep-link style navigation from alerts

### Wallet and profile tools

- Wallet balance view
- Funding flow
- Payment method management
- Transaction history
- Transaction detail screens
- Settings, support, safety, language, and profile update screens

## Screenshots

The sections below use the provided placeholder image. Replace them with real product screenshots when available.

### Onboarding

![Onboarding placeholder](assets/images/tutorial-web.png)

### Authentication

![Authentication placeholder](assets/images/tutorial-web.png)

### Home Dashboard

![Home dashboard placeholder](assets/images/tutorial-web.png)

### Runner Search

![Runner search placeholder](assets/images/tutorial-web.png)

### Errand Creation

![Errand creation placeholder](assets/images/tutorial-web.png)

### Live Tracking

![Live tracking placeholder](assets/images/tutorial-web.png)

### Messaging

![Messaging placeholder](assets/images/tutorial-web.png)

### Wallet and Payments

![Wallet placeholder](assets/images/tutorial-web.png)

## User Journey

The app flow, as implemented today, looks like this:

1. The user lands on a branded splash route.
2. They move through onboarding and into authentication.
3. Auth state is loaded from secure storage and route guards decide access.
4. Authenticated users enter a tab-based dashboard.
5. The user can search runners, view profiles, or post a new errand.
6. Once an errand exists, they can track progress and communicate with the runner.
7. Notifications, wallet state, and transaction history remain available through the account area.

This is important in a portfolio context because it shows complete flow thinking, not isolated page-building.

## Tech Stack

- Expo SDK `55`
- React `19`
- React Native `0.83`
- TypeScript
- Expo Router
- Expo Secure Store
- AsyncStorage
- Expo Notifications
- Expo Location
- Expo Image
- Moti
- Lucide React Native

## Architecture Overview

### Frontend

The frontend is organized around file-based routing under `src/app`, with context-based global state and shared design primitives.

Main architecture pieces:

- `src/app`
  File-based screens and layouts using Expo Router
- `src/context/AuthContext.tsx`
  Central auth/session logic, token persistence, user hydration, route protection, and push sync
- `src/context/ThemeContext.tsx`
  Theme selection driven by user preference
- `src/constants/api.ts`
  Central API endpoint definitions
- `src/constants/design.ts`
  Shared design tokens for color, spacing, typography, borders, and shadows
- `src/components/ui`
  Shared visual building blocks such as buttons, alerts, cards, inputs, refresh controls, and custom tab behavior

### Backend

The backend lives in [backend](/home/kashim/nite-personal/sahara-nomad/backend) and is a FastAPI application. The frontend is designed to work with that service for:

- auth and token refresh
- user profile reads and updates
- runner discovery
- errand creation and tracking
- wallet operations
- payment method handling
- notifications
- messaging and WebSocket chat

### Data and state strategy

- Tokens are stored in `expo-secure-store`
- Cached user data and recent searches use `AsyncStorage`
- Screen-specific UI state is kept local to route components
- Cross-cutting state like auth and theme is stored in React context
- Real-time chat updates are handled through WebSocket alongside standard REST fetches

## Important Engineering Decisions

### 1. Centralized auth and navigation control

`src/context/AuthContext.tsx` is the most important architectural file in the app.

It is responsible for:

- loading tokens on app boot
- caching and restoring user data
- refreshing tokens when needed
- exposing `signIn`, `signOut`, and `refreshUser`
- redirecting users based on authentication state
- syncing push tokens after login

Why this matters:

- It prevents auth logic from leaking into every screen
- It keeps the route protection strategy consistent
- It makes the app easier to reason about during onboarding or debugging

### 2. Hybrid real-time messaging approach

Messaging is implemented with both REST and WebSocket:

- REST for history and sends
- WebSocket for incoming real-time events

Why this matters:

- history stays easy to fetch and persist
- live updates remain responsive
- the architecture avoids forcing every interaction through one protocol

### 3. Mobile-native capability integration

The app uses mobile platform features in meaningful ways:

- secure credential storage
- push notification registration
- Android notification channel configuration
- location permission and reverse geocoding

Why this matters:

- it shows comfort with mobile runtime constraints
- it demonstrates work beyond ordinary CRUD screens

### 4. Shared design tokens and UI primitives

The visual system is not improvised per screen. The app uses shared tokens and reusable components to keep the UI coherent.

Why this matters:

- faster iteration on product surfaces
- more consistent theming
- lower UI duplication across a growing app

## Route and Screen Map

### Public routes

- `src/app/index.tsx`
  Splash route that transitions to onboarding
- `src/app/onboarding.tsx`
  Product intro and conversion into auth
- `src/app/auth.tsx`
  Login, signup, OTP verification, and resend flow

### Protected tabs

- `src/app/(tabs)/index.tsx`
  Dashboard, active errands, nearby runners, and notification awareness
- `src/app/(tabs)/search.tsx`
  Runner discovery, filters, markets, recent searches, and trending behavior
- `src/app/(tabs)/messages.tsx`
  Conversation list and unread filtering
- `src/app/(tabs)/profile.tsx`
  Profile summary, wallet snapshot, settings entry, and account navigation

### Protected stack routes

- `src/app/new-errand.tsx`
  Errand creation and broadcast submission
- `src/app/waka/[id].tsx`
  Live errand status, price, route, and cancellation
- `src/app/waka/history.tsx`
  Historical errands
- `src/app/runner/[id].tsx`
  Runner profile, rating, reviews, and hire entry
- `src/app/runners/all.tsx`
  Expanded runner listing
- `src/app/conversation/[id].tsx`
  Live chat thread
- `src/app/notifications.tsx`
  Notification inbox
- `src/app/notification/[id].tsx`
  Notification detail route
- `src/app/profile/*`
  Wallet, settings, support, payments, disputes, and account tools
- `src/app/dispute/create.tsx`
  Dispute entry workflow
- `src/app/privacy.tsx`
  Privacy policy
- `src/app/terms.tsx`
  Terms of service

## Key Screens and What They Demonstrate

### `src/app/(tabs)/index.tsx`

Demonstrates:

- pulling together multiple backend resources on one dashboard
- unread state handling
- active marketplace state
- pull-to-refresh UX
- authenticated app shell behavior

### `src/app/(tabs)/search.tsx`

Demonstrates:

- search UX
- filter application
- persisted recent searches
- backend query integration
- marketplace discovery thinking

### `src/app/new-errand.tsx`

Demonstrates:

- complex form management
- mobile permission handling
- reverse geocoding
- pricing logic
- backend payload construction
- conversion-focused product flow

### `src/app/waka/[id].tsx`

Demonstrates:

- turning backend state into a user-readable progress experience
- cancellation flow integration
- operational trust-building UI

### `src/app/conversation/[id].tsx`

Demonstrates:

- real-time updates
- hybrid REST and WebSocket communication
- errand-contextual messaging

### `src/app/profile/payment.tsx`

Demonstrates:

- multi-endpoint aggregation
- financial UI presentation
- CRUD operations on saved payment methods

## Backend Integration Surface

The frontend currently points to a local API host defined in `src/constants/api.ts`.

The API surface represented in the client includes:

- `AUTH`
- `WAKA`
- `WALLET`
- `PAYMENT_METHODS`
- `MESSAGES`
- `NOTIFICATIONS`
- `RUNNER`
- `SEARCH`

From the frontend code, the FastAPI backend is expected to support:

- login and signup
- OTP verification
- refresh token flow
- authenticated profile retrieval and updates
- errand creation, retrieval, cancellation, and completion
- wallet balance and transaction retrieval
- payment method listing, creation, and deletion
- notification listing, unread count, read state, and clear-all
- conversation listing, history, send, unread count, and WebSocket delivery
- runner discovery and search recording

## Developer Setup

### Prerequisites

- Node.js 18 or newer
- npm
- Expo-compatible simulator or physical device
- Access to the matching FastAPI backend in [backend](/home/kashim/nite-personal/sahara-nomad/backend)

### Install

```bash
npm install
```

### Run

```bash
npm run start
```

Useful commands:

```bash
npm run android
npm run ios
npm run web
npm run lint
```

## What To Read First As A Reviewer

If you want the fastest understanding of the codebase, start here:

- `src/context/AuthContext.tsx`
- `src/constants/api.ts`
- `src/app/_layout.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/new-errand.tsx`
- `src/app/waka/[id].tsx`
- `src/app/conversation/[id].tsx`
- `src/app/profile/payment.tsx`
- `src/constants/design.ts`

## Design System

The app uses a bold, neobrutalist-inspired interface language.

Defined in `src/constants/design.ts`, it includes:

- high-contrast color palettes for light and dark mode
- square corners
- heavy borders
- hard shadows
- `Outfit` for headings
- `Plus Jakarta Sans` for body text

This is relevant in a hiring context because it shows that the project is not only technically wired but visually intentional.

## Challenges Solved In This Project

This codebase demonstrates practical solutions to common product engineering problems:

- keeping users authenticated across app restarts
- redirecting users correctly between public and protected routes
- handling token refresh without collapsing the user session
- combining REST and WebSocket communication in a single feature area
- using device location to reduce form friction
- syncing push tokens to backend user state
- structuring a growing app around reusable UI instead of duplicated screen code
- aggregating multiple backend resources into one operational dashboard

## Resume-Ready Summary

If you want short bullets that describe this project well, these are accurate to the codebase:

- Built a full-stack logistics marketplace app with an Expo React Native frontend and FastAPI backend for runner discovery, errand posting, live tracking, messaging, wallet flows, and notifications.
- Implemented authenticated mobile navigation with secure token persistence, refresh-token recovery, protected routes, and user session restoration.
- Integrated real-time chat using a hybrid REST plus WebSocket architecture for conversation history, message send, and live delivery.
- Added mobile-native platform features including push notification registration, Android notification channels, secure storage, and GPS-assisted location autofill.
- Designed a reusable UI system with shared tokens, brutalist-inspired components, and a scalable Expo Router screen architecture.

## How To Talk About This In Interviews

If you discuss this project in an interview, the strongest angles are:

- product thinking
  You built around a real operational workflow, not just isolated screens.
- architecture
  You centralized auth, route protection, and API integration in ways that scale.
- mobile experience
  You used secure storage, notifications, and location in meaningful ways.
- systems thinking
  You integrated frontend flows with a FastAPI backend and a WebSocket-based real-time channel.
- UX pragmatism
  You designed around trust, transparency, and friction reduction in a logistics product.

## Current Gaps and Next Steps

The project is already substantial, but there are clear next improvements:

- move API configuration to environment-based settings
- add automated tests for auth, routing, and critical flows
- document backend response contracts more formally
- tighten the targeted runner hire path end-to-end
- add production analytics, error tracking, and stronger offline handling

These are normal next-stage improvements for a real app, and calling them out directly helps communicate engineering maturity.

## Bottom Line

SendAm is a strong portfolio project because it shows end-to-end product engineering: mobile UI, backend integration, authenticated state management, location-aware workflows, real-time communication, notifications, and financial surfaces inside one coherent experience.

For a hiring manager, the key takeaway should be simple: this repository reflects someone who can build more than screens. It reflects someone who can shape a product, wire it to a backend, make the experience feel intentional, and handle the messy parts of application development that usually separate demos from real software.

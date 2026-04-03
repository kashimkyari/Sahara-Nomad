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

The strongest hiring signal in this project is that it combines product thinking with implementation depth. It is not only visually designed, it is operationally wired.

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

The fastest way to understand the codebase is to start here:

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

The short bullets below describe the project accurately:

- Built a full-stack logistics marketplace app with an Expo React Native frontend and FastAPI backend for runner discovery, errand posting, live tracking, messaging, wallet flows, and notifications.
- Implemented authenticated mobile navigation with secure token persistence, refresh-token recovery, protected routes, and user session restoration.
- Integrated real-time chat using a hybrid REST plus WebSocket architecture for conversation history, message send, and live delivery.
- Added mobile-native platform features including push notification registration, Android notification channels, secure storage, and GPS-assisted location autofill.
- Designed a reusable UI system with shared tokens, brutalist-inspired components, and a scalable Expo Router screen architecture.

## How To Talk About This In Interviews

The strongest interview angles for this project are:

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

---

# Extended Portfolio Dossier

The sections below intentionally go deeper than a typical repository README.

They are here for three reasons:

- to help a recruiter or hiring manager quickly understand the real scope of the project
- to help an engineer reviewing the repository understand architectural decisions without reverse-engineering everything from scratch
- to help me use this repository as a strong portfolio artifact during interviews, outreach, applications, and technical discussions

## Table of Contents

- [Portfolio Positioning](#portfolio-positioning)
- [Who This README Is For](#who-this-readme-is-for)
- [One-Minute Project Summary](#one-minute-project-summary)
- [Two-Minute Project Summary](#two-minute-project-summary)
- [What Makes This Project Strong](#what-makes-this-project-strong)
- [Detailed Feature Inventory](#detailed-feature-inventory)
- [Route By Route Breakdown](#route-by-route-breakdown)
- [Profile and Finance Area Breakdown](#profile-and-finance-area-breakdown)
- [Component System Breakdown](#component-system-breakdown)
- [State Management Breakdown](#state-management-breakdown)
- [Networking and API Strategy](#networking-and-api-strategy)
- [Authentication Deep Dive](#authentication-deep-dive)
- [Messaging Deep Dive](#messaging-deep-dive)
- [Notifications Deep Dive](#notifications-deep-dive)
- [Location and Mobility Deep Dive](#location-and-mobility-deep-dive)
- [Wallet and Payments Deep Dive](#wallet-and-payments-deep-dive)
- [Design System Deep Dive](#design-system-deep-dive)
- [Frontend Engineering Decisions](#frontend-engineering-decisions)
- [FastAPI Backend Relationship](#fastapi-backend-relationship)
- [How The Frontend Maps To The Business](#how-the-frontend-maps-to-the-business)
- [Hiring Manager Highlights](#hiring-manager-highlights)
- [Recruiter-Friendly Talking Points](#recruiter-friendly-talking-points)
- [Interview Stories](#interview-stories)
- [STAR Story Seeds](#star-story-seeds)
- [Problem Solving Examples](#problem-solving-examples)
- [System Design Discussion Prompts](#system-design-discussion-prompts)
- [Scalability Considerations](#scalability-considerations)
- [Reliability Considerations](#reliability-considerations)
- [Security Considerations](#security-considerations)
- [Accessibility Considerations](#accessibility-considerations)
- [Testing Strategy](#testing-strategy)
- [What I Would Improve Next](#what-i-would-improve-next)
- [Production Readiness Gap Analysis](#production-readiness-gap-analysis)
- [Roadmap](#roadmap)
- [Route Reference Appendix](#route-reference-appendix)
- [File Reference Appendix](#file-reference-appendix)
- [Glossary](#glossary)
- [Resume and LinkedIn Copy](#resume-and-linkedin-copy)
- [Interview Cheat Sheet](#interview-cheat-sheet)

## Portfolio Positioning

I see this project as a substantial applied product engineering project.

It is not:

- a static marketing site
- a template-generated demo with minor edits
- a set of disconnected UI experiments
- a tutorial project copied without adaptation

It is:

- a multi-screen mobile app
- connected to a FastAPI backend
- built around a real operational user journey
- designed to support transactions, communication, fulfillment, and account state
- strong enough to discuss in frontend, mobile, and full-stack interviews

In a portfolio review, I would position it as:

- a marketplace app
- a logistics coordination app
- a mobile product engineering case study
- a proof of ability to build across frontend UX, backend integration, and product systems

## Who This README Is For

### Recruiters

For recruiters, the key point is that this project shows more than component styling.

It includes:

- login flows
- protected app navigation
- persistent session handling
- push notifications
- real-time chat
- payments-related interfaces
- data-driven operational screens

### Hiring managers

For hiring managers, the key point is that this codebase demonstrates the ability to work on a real product surface area:

- user acquisition
- identity
- search
- conversion
- operations
- messaging
- notifications
- finance

### Engineers

For engineers, the key point is that there is real technical material here:

- Expo Router architecture
- React context-based state boundaries
- secure storage usage
- REST plus WebSocket integration
- route protection logic
- shared design primitives
- backend contract surface with a FastAPI service

### Me, in interviews

If I am using this in an interview, the key point is that it gives me concrete material to talk through:

- product decisions
- architecture tradeoffs
- debugging stories
- mobile integration details
- system evolution ideas

## One-Minute Project Summary

SendAm is a mobile marketplace for local errands and urban logistics. Users can sign up, discover runners, create jobs, track fulfillment, chat with runners, receive alerts, and manage wallet activity. I built the client in Expo and React Native, connected it to a FastAPI backend, and structured it around persistent auth, protected navigation, reusable UI, mobile-native capabilities, and real operational workflows.

## Two-Minute Project Summary

This project started from a straightforward product need: in many cities, people need help sourcing items, moving packages, or coordinating small jobs, but the process is still fragmented and trust-heavy. SendAm turns that into software. On the frontend, I built a mobile app that supports onboarding, authentication, runner discovery, errand posting, wallet and payment surfaces, notifications, and messaging. On the backend side, the app integrates with a FastAPI service that handles user sessions, runners, chat, wallet endpoints, and the errand lifecycle. From an engineering perspective, the interesting parts are the auth and route guard design, the REST plus WebSocket messaging strategy, the location-assisted errand flow, and the fact that the UI is organized as a coherent product system rather than a bundle of disconnected screens.

## What Makes This Project Strong

### It solves a real workflow

The app is built around a job-to-be-done that people actually understand.

The user wants something moved, sourced, or delivered.

The app gives them a runner marketplace and an operational workflow.

That makes the project easier to explain and more credible than abstract demos.

### It covers multiple feature classes

This single app includes:

- auth
- search
- messaging
- notifications
- finance
- profile settings
- data refresh
- location
- real-time updates

That breadth matters because strong product engineers rarely work on only one surface.

### It has business logic

The app includes more than rendering.

It includes:

- route access logic
- session restoration
- token refresh behavior
- errand pricing logic
- unread state logic
- filter mapping logic
- targeted runner support in request payloads

### It integrates mobile-native features

There is meaningful use of:

- secure credential storage
- push notifications
- reverse geocoding
- device permissions

That is a stronger signal than ordinary web-only CRUD work.

### It is explainable

A strong portfolio project is not only functional.

It is explainable.

This project is easy to walk through in terms of:

- user goals
- feature boundaries
- file organization
- architectural decisions
- technical tradeoffs

## Detailed Feature Inventory

### Public entry features

- branded splash screen
- onboarding slides
- login form
- signup flow
- OTP verification view
- OTP resend behavior
- auth error display

### Session features

- secure access token storage
- secure refresh token storage
- cached user data
- boot-time session restoration
- refresh-token retry on unauthorized profile request
- sign-out state reset
- centralized auth provider

### Dashboard features

- greeting based on time of day
- nearby runner feed
- active errand feed
- unread notification indicator
- profile quick access
- custom pull-to-refresh interaction

### Search features

- query input
- search debounce behavior
- persistent recent searches
- backend trend recording
- market chip selection
- filter chip mapping
- navigation to runner profile

### Runner features

- runner profile fetch
- rating display
- active trip and review display
- review cards
- verification badge area
- CTA to hire or start an errand

### Errand creation features

- item category selection
- pickup address entry
- dropoff address entry
- GPS location autofill
- price slider
- urgency toggle
- flash incentive logic
- targeted runner field in payload
- errand creation submission

### Errand tracking features

- live status label mapping
- stepper visualization
- runner card
- route information
- price display
- cancellation flow
- completed and cancelled states

### Messaging features

- conversation list fetch
- unread count rollup
- search inside conversations
- message history fetch
- send message action
- live inbound WebSocket messages
- errand context banner in chat

### Notification features

- push registration
- Android notification channel setup
- unread notification count
- in-app inbox
- read action
- clear-all action
- deep-link style navigation

### Wallet features

- wallet balance view
- funding entry point
- payment method list
- payment method delete
- transaction history
- transaction detail route
- dispute entry point

### Account features

- theme preference
- push notification preference
- location preference
- language placeholder surface
- region preference
- profile editing
- password change
- phone number change
- logout
- account deletion flow

## Route By Route Breakdown

### `src/app/index.tsx`

Purpose:

- present the brand
- create a polished initial loading impression
- transition the user into onboarding

Why it matters:

- first impressions matter in portfolio projects
- it shows intentional UX even before auth

What it demonstrates:

- animation basics
- simple timed route transition
- theme-aware visual rendering

### `src/app/onboarding.tsx`

Purpose:

- explain the product quickly
- create momentum toward auth

Why it matters:

- it shows that the app is designed as a product, not just as screens after login

What it demonstrates:

- scroll-based slide UI
- brand messaging
- onboarding conversion logic

### `src/app/auth.tsx`

Purpose:

- combine login and signup
- handle OTP completion

Why it matters:

- auth is often where apps stop being demos and start becoming products

What it demonstrates:

- async request handling
- error state handling
- auth provider integration
- multi-state auth UI

### `src/app/(tabs)/index.tsx`

Purpose:

- central dashboard after authentication

What it demonstrates:

- fetching multiple data sources
- unread count integration
- active marketplace state
- pull-to-refresh
- home information architecture

### `src/app/(tabs)/search.tsx`

Purpose:

- help users discover runners quickly

What it demonstrates:

- local state plus remote state coordination
- filter mapping
- persistence of recent searches
- search UX

### `src/app/(tabs)/messages.tsx`

Purpose:

- show conversation overview

What it demonstrates:

- derived filtering
- unread aggregations
- operational messaging entry point

### `src/app/(tabs)/profile.tsx`

Purpose:

- user identity hub
- wallet snapshot
- access to settings and payment tools

What it demonstrates:

- profile composition
- account navigation
- wallet visibility

### `src/app/new-errand.tsx`

Purpose:

- convert user intent into a structured job

What it demonstrates:

- complex screen state
- mobile geolocation integration
- pricing interaction
- payload construction

### `src/app/waka/[id].tsx`

Purpose:

- live errand monitoring

What it demonstrates:

- mapping backend state to human-readable UI
- multi-state rendering
- cancellation action
- operational trust UX

### `src/app/runner/[id].tsx`

Purpose:

- runner trust and profile details

What it demonstrates:

- profile fetch
- review rendering
- service-provider presentation

### `src/app/conversation/[id].tsx`

Purpose:

- live runner-user conversation

What it demonstrates:

- WebSocket integration
- HTTP history sync
- live UI updates

### `src/app/notifications.tsx`

Purpose:

- give users a place to review operational alerts

What it demonstrates:

- alert management
- unread behavior
- task-specific navigation

### `src/app/notification/[id].tsx`

Purpose:

- show the detail of a single notification

What it demonstrates:

- route-specific detail fetching
- navigation branching from different notification types

### `src/app/waka/history.tsx`

Purpose:

- historical errands overview

What it demonstrates:

- historical activity surfacing
- continuity beyond just active flows

### `src/app/runners/all.tsx`

Purpose:

- expanded runner discovery list

What it demonstrates:

- marketplace browsing beyond primary dashboard constraints

### `src/app/profile/edit.tsx`

Purpose:

- profile updates

What it demonstrates:

- profile edit UX
- optimistic or explicit refresh patterns

### `src/app/profile/settings.tsx`

Purpose:

- user settings, sign-out, and account deletion

What it demonstrates:

- preference updates
- account risk actions
- long-lived account management surfaces

### `src/app/profile/payment.tsx`

Purpose:

- wallet and payment center

What it demonstrates:

- multi-resource fetch aggregation
- finance-oriented UI

### `src/app/profile/fund-wallet.tsx`

Purpose:

- funding flow

What it demonstrates:

- top-up UX
- wallet integration

### `src/app/profile/add-method.tsx`

Purpose:

- add a new saved payment method

What it demonstrates:

- payment setup workflow

### `src/app/profile/card/[id].tsx`

Purpose:

- inspect a payment method

What it demonstrates:

- details route handling

### `src/app/profile/transaction/history.tsx`

Purpose:

- extended financial history

What it demonstrates:

- list management
- transaction browsing

### `src/app/profile/transaction/[id].tsx`

Purpose:

- individual transaction inspection

What it demonstrates:

- finance detail rendering
- routing into dispute creation

### `src/app/dispute/create.tsx`

Purpose:

- support escalation flow

What it demonstrates:

- downstream issue-handling thoughtfulness in product design

### `src/app/profile/become-runner.tsx`

Purpose:

- role expansion

What it demonstrates:

- future supply-side product thinking

### `src/app/profile/support.tsx`

Purpose:

- user support access

What it demonstrates:

- product completeness beyond primary success path

### `src/app/profile/safety.tsx`

Purpose:

- trust and safety communication

What it demonstrates:

- platform trust considerations

### `src/app/profile/language.tsx`

Purpose:

- language preference surface

What it demonstrates:

- internationalization or localization awareness

### `src/app/privacy.tsx`

Purpose:

- privacy information

Why it matters:

- serious apps need policy surfaces

### `src/app/terms.tsx`

Purpose:

- terms of service surface

Why it matters:

- this contributes to the product feeling complete and business-realistic

## Profile and Finance Area Breakdown

The profile section is worth calling out because many portfolio apps stop at feed screens.

This project goes further.

The profile area includes:

- identity
- wallet summary
- payment methods
- transaction history
- settings
- safety
- support
- language
- role expansion

This matters because it shows product completeness.

Users do not only need a core action.

They also need:

- account confidence
- financial visibility
- support paths
- preference controls

From a hiring perspective, this is a strong sign that I think beyond the happy path.

## Component System Breakdown

### Why a component system matters

Strong mobile apps become hard to maintain if every screen invents its own visual language.

This project uses shared primitives so the UI stays coherent.

### Key shared components

#### `Button.tsx`

Used for:

- primary actions
- clear CTA consistency
- reusable pressed-state behavior

#### `Input.tsx`

Used for:

- auth fields
- structured forms
- validation display

#### `Card.tsx`

Used for:

- content grouping
- elevated blocks
- reusable visual structure

#### `BrutalistAlert.tsx`

Used for:

- confirmations
- destructive action warnings
- feedback messaging

Why it matters:

- destructive and important actions deserve consistent handling

#### `BrutalistRefreshControl.tsx`

Used for:

- a branded pull-to-refresh experience

Why it matters:

- it creates a more intentional feel than relying solely on default platform behavior

#### `CustomTabBar.tsx`

Used for:

- app-wide navigation identity

Why it matters:

- navigation is part of the product feel

### What this says about engineering approach

I am not only comfortable composing screens.

I also think in terms of:

- reusable primitives
- consistency
- maintainability
- UI scaling

## State Management Breakdown

This project intentionally keeps state management simple and pragmatic.

### Global state

Global state is used for:

- authentication
- current user profile
- theme preference

Why this is a good fit:

- these concerns affect many screens
- they should be centralized
- React context is enough for this scale

### Local screen state

Local state is used for:

- form input
- loading flags
- filters
- route-specific data
- temporary UI transitions

Why this is a good fit:

- it avoids over-abstracting too early
- it keeps each screen understandable
- it reduces unnecessary shared complexity

### Persisted local state

Persisted local state is used for:

- cached user profile
- recent searches

Why this is a good fit:

- it improves continuity between sessions
- it reduces repeated friction

### Real-time state

Real-time state is used in:

- chat

Why this is a good fit:

- chat requires fresh UI updates
- WebSockets are appropriate for inbound event delivery

## Networking and API Strategy

The app uses a direct fetch-based approach with centralized endpoint definitions.

### Why this approach works here

- the project is still readable
- endpoint usage is straightforward
- indirection is kept low
- most logic remains close to the feature that uses it

### Benefits

- easy to inspect network behavior
- low abstraction overhead
- clear contract surface in one file

### Tradeoffs

- no centralized client wrapper for retries, logging, and normalization yet
- endpoint-level response typing is still limited
- errors are handled locally more often than through a shared network layer

### What I would add later

- typed response interfaces
- shared request utility
- global error normalization
- analytics and tracing hooks

## Authentication Deep Dive

Authentication is one of the strongest parts of the architecture.

### What the auth layer does

- loads secure tokens on startup
- restores cached user data
- exposes sign-in and sign-out methods
- fetches the current user profile
- attempts refresh-token recovery after unauthorized responses
- drives route redirection

### Why this matters

Bad auth architecture creates:

- duplicate logic
- route confusion
- broken session restoration
- hard-to-debug UI states

Centralizing auth helps prevent those issues.

### Why `SecureStore` is important

Mobile auth should not rely on plain in-memory state alone.

Using secure storage demonstrates awareness of:

- mobile security expectations
- persistent app sessions
- cross-launch continuity

### Interview angle

If asked about a non-trivial part of the app, auth is a great answer because it touches:

- storage
- async boot logic
- navigation
- backend recovery
- user experience

## Messaging Deep Dive

Messaging is another strong portfolio area because it combines persistence and real-time behavior.

### Current architecture

- fetch conversations over REST
- fetch history over REST
- send messages over REST
- receive new messages over WebSocket

### Why I like this approach

- history retrieval remains simple
- send logic stays backend-authoritative
- real-time behavior is still present
- duplication risk is manageable with simple guards

### What this says about engineering maturity

I am comfortable choosing a hybrid solution when it makes product and operational sense.

I am not forcing every concern into one transport model just because it sounds more advanced.

### Potential next improvements

- connection retry strategy
- heartbeat handling
- presence/typing events
- optimistic message states
- attachment upload flow

## Notifications Deep Dive

Notifications matter because they connect mobile product experience with re-engagement.

### What is already implemented

- permission request
- push token acquisition
- Android channel registration
- token sync to backend
- in-app inbox
- routing from alert context

### Why this matters

This turns the app from something passive into something event-driven.

It improves:

- re-engagement
- trust
- operational awareness

### Interview angle

Notifications are useful to discuss because they show knowledge of:

- platform-specific setup
- backend coordination
- user lifecycle beyond the current session

## Location and Mobility Deep Dive

Location is a meaningful part of the errand flow.

### Where it is used

- pickup location autofill
- dropoff location autofill
- nearby runner discovery

### Why it matters

Location reduces friction in a logistics product.

Without it, the app would feel less helpful and less operationally grounded.

### What this demonstrates

- permission handling
- geolocation usage
- reverse geocoding
- blending device capabilities with product UX

## Wallet and Payments Deep Dive

Payments-related UI often distinguishes toy apps from serious product thinking.

### What is already present

- wallet balance
- payment methods
- funding route
- recent transactions
- detailed transactions
- dispute entry

### Why this matters

Even if payment processing itself is backend-driven, the frontend still has to communicate:

- trust
- clarity
- status
- recordkeeping

### Hiring signal

Building finance-related interfaces shows comfort with:

- data density
- precision
- account confidence
- user trust concerns

## Design System Deep Dive

The design system reflects deliberate product identity.

### Visual characteristics

- bold, neobrutalist structure
- high contrast
- visible borders
- hard shadows
- expressive typography

### Why this matters in a portfolio

Hiring managers often see projects that are technically functional but visually generic.

This app avoids that problem.

It has:

- a distinct feel
- coherent use of tokens
- repeated visual motifs

### Engineering significance

A design system is not just aesthetic.

It also improves:

- consistency
- maintainability
- implementation speed
- readability across screens

## Frontend Engineering Decisions

### Decision: use Expo Router

Reason:

- clear file-based route organization
- good fit for multi-screen app structure
- easy mental model for readers

Tradeoff:

- route complexity still needs discipline as the app grows

### Decision: use React context instead of heavier state libraries

Reason:

- current global state needs are limited and clear
- auth and theme are natural context boundaries

Tradeoff:

- future scaling may benefit from dedicated server state tooling

### Decision: keep network logic near screens

Reason:

- readable in a small-to-mid-sized product
- makes feature ownership obvious

Tradeoff:

- cross-cutting concerns like retries and error normalization are less centralized

### Decision: use REST plus WebSocket in chat

Reason:

- simpler persistence model
- still supports real-time updates

Tradeoff:

- requires duplicate-protection and two transport paths

### Decision: use AsyncStorage for lightweight persistence

Reason:

- recent searches and cached user data do not require more complex storage

Tradeoff:

- data invalidation strategy must stay clear

## FastAPI Backend Relationship

The backend lives in [backend](/home/kashim/nite-personal/sahara-nomad/backend) and is implemented with FastAPI.

That relationship matters for this repository because the frontend is not self-contained.

It is designed to work with backend capabilities such as:

- token issuing
- token refresh
- profile updates
- errand creation
- runner retrieval
- wallet balances
- transaction history
- messaging
- notification counts

### Why FastAPI is a good match here

FastAPI is a strong fit for:

- structured JSON APIs
- typed request and response modeling
- auth flows
- WebSocket support

From a portfolio standpoint, Expo frontend plus FastAPI backend is a credible full-stack pairing that many startups and product teams use in practice.

## How The Frontend Maps To The Business

### Acquisition

Mapped to:

- splash screen
- onboarding
- auth

### Activation

Mapped to:

- home dashboard
- runner search
- new errand flow

### Retention

Mapped to:

- notifications
- message threads
- activity history
- wallet visibility

### Trust

Mapped to:

- live status tracking
- runner reviews
- transaction detail
- safety and support screens

### Monetization

Mapped to:

- wallet
- payments
- errand pricing
- transaction flows

## Hiring Manager Highlights

The clearest takeaways for a hiring manager skimming the project are:

- I can build multi-screen React Native apps with real navigation complexity.
- I understand authentication beyond just form submission.
- I can integrate mobile-native capabilities like secure storage, notifications, and location.
- I can work against a real backend contract instead of hardcoded local-only mock state.
- I can structure a project so it remains explainable as it grows.
- I can think in product terms, not just implementation terms.

## Recruiter-Friendly Talking Points

Short accurate ways to describe the project include:

- It is a mobile logistics marketplace app.
- It connects customers with local runners for errands and deliveries.
- It includes onboarding, authentication, errand posting, tracking, chat, wallet, and notifications.
- The frontend is built with Expo and React Native.
- The backend lives in the repo as a FastAPI service.
- It is a strong example of end-to-end product engineering.

## Interview Stories

### Story 1: Building session persistence

Problem:

- mobile users should not need to log in every time the app opens

Approach:

- stored access and refresh tokens securely
- restored cached user data on boot
- fetched profile data after restoring session

Value:

- improved continuity and made the app feel real rather than demo-like

### Story 2: Designing protected navigation

Problem:

- public and authenticated routes should behave consistently

Approach:

- centralized route guard logic in the auth provider
- redirected users based on token state and route segment

Value:

- reduced routing bugs and kept access control logic readable

### Story 3: Handling chat in a pragmatic way

Problem:

- needed persistence and real-time updates in messaging

Approach:

- used REST for history and sends
- used WebSocket for inbound updates

Value:

- kept implementation practical while preserving a real-time user experience

### Story 4: Reducing friction in errand creation

Problem:

- address entry can be tedious on mobile

Approach:

- added location permission flow and reverse geocoding autofill

Value:

- improved usability and tied the app more closely to its logistics purpose

### Story 5: Making the app feel like a product

Problem:

- many technical demos feel generic and unfinished

Approach:

- invested in design tokens, consistent brutalist styling, shared UI, and end-to-end flows

Value:

- made the app more believable as a product and stronger as a portfolio artifact

## STAR Story Seeds

These work well as behavioral interview story seeds.

### Situation

- I wanted a portfolio project that looked like real product work, not a toy clone.

### Task

- Build a mobile app with real backend integration and product-shaped workflows.

### Action

- Designed route architecture with Expo Router.
- Built centralized auth with secure storage and token refresh behavior.
- Integrated FastAPI endpoints for search, errands, wallet, notifications, and chat.
- Added location-assisted job posting and push notification support.

### Result

- Produced a project strong enough to discuss across frontend, mobile, and full-stack interview settings.

## Problem Solving Examples

### Example: avoiding auth logic duplication

Bad path:

- handle sign-in state separately in every screen

Better path:

- centralize auth state and navigation guard behavior

### Example: keeping chat architecture understandable

Bad path:

- force all messaging through a complex abstraction too early

Better path:

- use simple REST plus WebSocket separation

### Example: scaling visual consistency

Bad path:

- duplicate button and card styles in every route

Better path:

- use design tokens and UI primitives

## System Design Discussion Prompts

These are the system design directions I would use if the conversation shifted toward evolution and scaling.

### How would you scale notifications?

I would discuss:

- event sources from backend operations
- push delivery pipeline
- user notification preferences
- unread count caching
- deep-link routing consistency

### How would you scale messaging?

I would discuss:

- connection management
- retry and reconnect strategy
- optimistic UI
- read receipts
- typing indicators
- attachment uploads
- conversation pagination

### How would you scale search?

I would discuss:

- indexed queries
- geo-aware ranking
- popular market aggregation
- caching
- analytics-informed default sort

### How would you scale auth?

I would discuss:

- token rotation
- refresh expiry
- device session management
- forced logout
- server-driven risk controls

## Scalability Considerations

### Frontend scalability

As the app grows, I would likely add:

- a shared API client wrapper
- stronger response typing
- dedicated server state tooling
- better request retry policies
- analytics instrumentation

### Feature scalability

For product growth, I would consider:

- runner availability maps
- richer pricing models
- delivery ETA predictions
- image attachments in chats
- proof-of-delivery workflows
- promo and referral features

### Team scalability

For team growth, I would consider:

- clearer domain modules
- stricter shared types between frontend and backend
- visual regression coverage
- screen-level ownership conventions

## Reliability Considerations

### Current strengths

- auth state is centralized
- critical flows have visible loading states
- some destructive actions use confirmations
- messaging avoids pure optimistic dependence

### Gaps

- request retry strategy is inconsistent
- there is limited centralized error normalization
- offline mode is not fully formalized
- WebSocket reconnect logic is minimal

### Next reliability steps

- add network error handling utility
- add request timeout strategy
- add retry for safe GET requests
- add reconnect backoff for chat
- add better user-facing error surfaces

## Security Considerations

### Positive signals already present

- secure token storage
- authenticated requests via bearer tokens
- route gating based on auth state
- account deletion and logout flows

### Improvements I would add next

- stricter token lifecycle controls
- stronger input validation surface
- better secrets and environment handling
- device session visibility
- audit-friendly destructive actions

### Why this matters in interviews

Even on frontend-heavy roles, security awareness is a useful differentiator.

## Accessibility Considerations

Areas already somewhat aligned:

- large touch targets in many places
- readable typography
- high-contrast style language

Areas to improve:

- explicit accessibility labels
- improved screen reader support
- semantic role clarity where possible
- better dynamic type handling
- reduced motion support

Mentioning these tradeoffs helps show engineering maturity.

## Testing Strategy

This repository does not yet include a formal automated test suite, but a sensible test strategy would look like this.

### Unit tests

Good candidates:

- auth helper logic
- route guard conditions
- pricing calculations
- filter mapping logic
- status label mapping

### Integration tests

Good candidates:

- sign in and session restoration
- sign out redirect behavior
- errand creation flow
- notification read and clear behavior
- payment method deletion flow

### End-to-end tests

Good candidates:

- onboarding to authenticated dashboard
- create errand and land on tracking
- open conversation and send message
- navigate from notification to relevant screen

### Why this section matters

Even when a project lacks full automated tests, a strong engineer should be able to articulate what should be tested and why.

## What I Would Improve Next

### Developer experience

- move API configuration into environment-based settings
- add typed API contracts
- add a lightweight service layer
- add linting and formatting enforcement if needed

### Product experience

- targeted runner hire path completion
- better empty states and retry states
- richer status detail and ETA surfaces
- attachments in messaging
- stronger wallet funding UX

### Operational tooling

- analytics
- crash reporting
- performance monitoring
- admin-oriented event visibility

## Production Readiness Gap Analysis

### Already product-shaped

- navigation
- auth
- data flows
- mobile capability use
- finance surface
- notifications
- messaging

### Not yet fully production-ready

- environment management
- full error instrumentation
- comprehensive test coverage
- offline strategy
- typed API contracts across boundaries
- observability

This is an honest and useful framing in job conversations.

It shows I know the difference between:

- “built”
- “usable”
- “production-ready”

## Roadmap

### Near-term roadmap

- environment-based API config
- stronger typing for backend payloads
- cleaner network abstraction
- better chat resiliency
- more polished direct-runner hiring

### Mid-term roadmap

- background refresh strategies
- analytics
- improved notifications UX
- better transaction dispute flows
- richer runner profile detail

### Long-term roadmap

- proof of delivery
- image and voice attachments
- live map tracking
- referral systems
- pricing engine evolution
- richer supply-side runner tooling

## Route Reference Appendix

### Root and layout routes

- `src/app/_layout.tsx`
- `src/app/index.tsx`
- `src/app/onboarding.tsx`
- `src/app/auth.tsx`

### Tab routes

- `src/app/(tabs)/_layout.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/search.tsx`
- `src/app/(tabs)/messages.tsx`
- `src/app/(tabs)/profile.tsx`

### Errand and runner routes

- `src/app/new-errand.tsx`
- `src/app/waka/[id].tsx`
- `src/app/waka/history.tsx`
- `src/app/runner/[id].tsx`
- `src/app/runners/all.tsx`

### Messaging and notification routes

- `src/app/conversation/[id].tsx`
- `src/app/notifications.tsx`
- `src/app/notification/[id].tsx`

### Profile routes

- `src/app/profile/_layout.tsx`
- `src/app/profile/edit.tsx`
- `src/app/profile/settings.tsx`
- `src/app/profile/payment.tsx`
- `src/app/profile/fund-wallet.tsx`
- `src/app/profile/add-method.tsx`
- `src/app/profile/card/[id].tsx`
- `src/app/profile/transaction/_layout.tsx`
- `src/app/profile/transaction/history.tsx`
- `src/app/profile/transaction/[id].tsx`
- `src/app/profile/change-password.tsx`
- `src/app/profile/change-phone.tsx`
- `src/app/profile/language.tsx`
- `src/app/profile/support.tsx`
- `src/app/profile/safety.tsx`
- `src/app/profile/become-runner.tsx`

### Utility and policy routes

- `src/app/dispute/create.tsx`
- `src/app/privacy.tsx`
- `src/app/terms.tsx`

## File Reference Appendix

### Context files

- `src/context/AuthContext.tsx`
- `src/context/ThemeContext.tsx`

### Constants

- `src/constants/api.ts`
- `src/constants/design.ts`
- `src/constants/theme.ts`

### Hooks

- `src/hooks/use-theme.ts`
- `src/hooks/use-color-scheme.ts`
- `src/hooks/use-color-scheme.web.ts`

### Utilities

- `src/utils/notifications.ts`

### Shared UI files

- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/BrutalistAlert.tsx`
- `src/components/ui/BrutalistRefreshControl.tsx`
- `src/components/ui/CustomTabBar.tsx`
- `src/components/ui/VerifiedBadge.tsx`

## Glossary

### Waka

In the app, a waka represents an errand or delivery job moving through a lifecycle.

### Runner

A runner is the service provider who fulfills errands.

### Flash

A faster or more urgent errand mode with extra incentive attached.

### Active errand

A waka that is currently being fulfilled or is still in progress.

### Unread count

A numeric signal showing pending messages or notifications the user has not reviewed.

## Resume and LinkedIn Copy

### Resume version 1

Built a mobile logistics marketplace app using Expo, React Native, TypeScript, and FastAPI, featuring secure authentication, protected navigation, location-assisted errand creation, wallet and payment flows, push notifications, and REST plus WebSocket messaging.

### Resume version 2

Developed a full-stack mobile app for urban errand fulfillment and runner discovery, implementing session persistence, real-time chat, notification flows, profile and wallet management, and a reusable design system across a multi-screen Expo Router architecture.

### LinkedIn project description

SendAm is a mobile marketplace app I built for same-city errands and delivery coordination. The frontend is built with Expo and React Native, while the backend is a FastAPI service in the same repository. The app includes onboarding, authentication, runner search, errand posting, live tracking, chat, notifications, wallet flows, and account management. I used the project to demonstrate product-oriented mobile engineering across UI, backend integration, and operational workflows.

## Interview Cheat Sheet

### If asked “What was the hardest part?”

A concise answer:

- balancing product breadth with architecture simplicity
- centralizing auth correctly
- making messaging practical without overengineering

### If asked “What are you most proud of?”

A concise answer:

- that the app feels like a product, not just a collection of screens

### If asked “What would you improve?”

A concise answer:

- environment config
- stronger typed contracts
- testing
- analytics
- production observability

### If asked “What did you learn?”

A concise answer:

- how much product quality depends on infrastructure details like auth, storage, notifications, and route handling, not just screen design

### If asked “Why this project?”

A concise answer:

- it let me work on a realistic mix of UX, business logic, backend integration, and mobile-native capability work

## Additional Talking Points By Role

### For frontend roles

The strongest emphasis is on:

- component structure
- route architecture
- design system consistency
- state management choices
- async UI handling

### For mobile roles

The strongest emphasis is on:

- secure storage
- notifications
- location permissions
- React Native screen design
- Expo ecosystem usage

### For full-stack roles

The strongest emphasis is on:

- frontend-backend contract design
- FastAPI integration
- REST and WebSocket mix
- end-to-end user flow ownership

### For startup roles

The strongest emphasis is on:

- breadth
- product sense
- ability to ship practical features
- willingness to own multiple layers

## Final Hiring Summary

If only one part of this extended dossier gets read, it should be this:

SendAm shows that I can take a real-world problem, translate it into a product workflow, design a mobile user experience around it, connect that experience to a FastAPI backend, and implement the glue that makes the app behave like real software: authentication, persistence, route protection, notifications, messaging, payments-related surfaces, and operational state handling.

That is the core reason this project is valuable in my portfolio.

## Long-Form Portfolio Narrative

I wanted a project that would prove more than UI taste.

I wanted something that would demonstrate that I can reason about a product end-to-end.

That meant choosing a problem space with real operational complexity.

Local errands and city logistics were a strong fit.

They involve urgency.

They involve trust.

They involve coordination.

They involve communication.

They involve payment.

They involve state transitions.

That made SendAm a useful project because the software requirements are naturally rich.

Once I chose the product space, the next challenge was shaping the app so it felt coherent.

I did not want it to feel like separate disconnected samples.

I wanted it to feel like one product with:

- a brand
- a user journey
- a business model
- meaningful backend dependencies
- a distinct visual language

So the app starts with a splash route and onboarding.

That is not just polish.

It frames the product for the user.

Then the auth flow takes over.

That is where the app starts earning credibility.

I used secure storage because a mobile app should preserve sessions responsibly.

I built route guards because logged-in and logged-out experiences should not bleed into each other.

I supported token refresh because sessions should survive ordinary backend expiration behavior.

After that, the dashboard becomes the operational hub.

I wanted the dashboard to feel alive.

So it pulls in active errands, nearby runners, and notification counts.

That gives the user a reason to return.

It also gives the codebase a stronger shape.

From there, search supports discovery.

That matters because marketplaces live or die on the quality of discovery.

The runner search flow includes filters, markets, recent search persistence, and backend recording of queries.

Those details make the experience feel closer to a real product than a static listing page.

Then there is errand creation.

That is the conversion surface.

It is also one of the best examples of product engineering in the app.

The screen combines:

- form state
- location permission handling
- reverse geocoding
- pricing
- urgency
- backend payload assembly

That kind of screen is valuable in a portfolio because it shows more than display logic.

It shows workflow logic.

After errand creation, the app does not stop.

That is another strength.

The user can track the errand.

They can see status.

They can see whether a runner is assigned.

They can message the runner.

They can view notifications.

They can inspect wallet and payment data.

They can edit account preferences.

That breadth matters.

It shows I can think about systems that persist over time.

Messaging is another important signal.

I chose a hybrid architecture.

History and sends go through HTTP.

Inbound real-time updates go through WebSocket.

That is a practical choice.

It is not trying to be clever.

It is trying to be useful.

That is usually what product engineering requires.

The wallet and payment surfaces also matter.

Even though the project is not a full payment processor, those screens show that I understand the importance of transaction visibility and trust in user-facing products.

People want to know:

- what happened
- what they paid
- what methods are saved
- what their balance is

Surfacing that well is part of good product work.

The design system is also part of the story.

I did not want the app to feel anonymous.

So I used strong colors, heavy borders, hard shadows, and a deliberate typographic setup.

That made the app look more like a product with conviction.

A hiring manager may not care about the exact aesthetic direction.

But they usually do notice when a project feels intentional.

This one does.

Finally, this project is useful because it creates many interview paths.

I can discuss:

- how I structured navigation
- how I handled auth restoration
- why I used secure storage
- why the backend is a FastAPI service
- how I approached chat
- how I thought about trust and operational UX
- what I would improve for production

That makes the project more than something to show.

It becomes something to talk through.

And that is what a strong job-seeking portfolio project should do.

## Additional Resume Bullet Variants

- Built a React Native marketplace app for urban errands and delivery coordination with Expo Router, secure auth persistence, runner discovery, live errand tracking, and integrated wallet and notification flows.
- Created a mobile frontend integrated with a FastAPI backend, implementing login, OTP flows, protected routing, profile settings, financial activity views, and real-time messaging.
- Engineered a multi-surface mobile product with geolocation-assisted forms, push notifications, reusable UI primitives, and a branded design system for a logistics marketplace use case.
- Designed and implemented frontend architecture for a product-oriented mobile app with context-driven auth, REST and WebSocket integration, reusable components, and operationally meaningful user journeys.

## Additional Interview Answer Fragments

### On product sense

I wanted the project to demonstrate that I think about the user journey as a system, not just as isolated screens. That is why the app includes onboarding, auth, search, conversion, fulfillment, communication, notifications, and finance-related follow-through.

### On tradeoffs

I made several pragmatic choices. I kept server interactions fetch-based instead of over-abstracting early. I used context for auth and theme because the global state surface was still clear and bounded. I used REST plus WebSocket for chat because it kept persistence and real-time behavior simple to reason about.

### On next steps

The next major improvements would be typed API contracts, environment-based config, better error normalization, automated tests for auth and critical flows, and stronger observability.

### On why this is meaningful

This project is meaningful because it forced me to work across product definition, mobile UX, backend integration, state management, and real-world app concerns like notifications, secure storage, and navigation edge cases.

## Long Tail Review Notes

These are additional notes that can help a reviewer understand the seriousness of the project.

### The app has a business thesis

It is not a generic marketplace.

It is specifically shaped around local errands and urban logistics.

### The app has role awareness

There is a clear distinction between customer behavior and runner-related surfaces.

### The app has lifecycle awareness

The app does not stop at job creation.

It follows the errand through progress and communication.

### The app has trust surfaces

Reviews, safety screens, notifications, transaction history, and status tracking all contribute to user trust.

### The app has retention surfaces

Messages, alerts, wallet history, and persisted state all create reasons to return.

### The app has growth surfaces

Runner discovery, search recording, and potential role expansion suggest room for marketplace evolution.

## Final Notes For Reviewers

The most useful reading path for a hiring review is:

1. scan `src/context/AuthContext.tsx`
2. scan `src/constants/api.ts`
3. open the dashboard, errand creation, errand tracking, and conversation routes
4. review the profile and payment area
5. compare the frontend flows to the FastAPI backend folder

That sequence will show the project’s product, architectural, and operational depth fastest.

# Property WhatsApp AI Agent — Full Implementation Plan
### Standalone Monorepo | `property-agent` repo

---

## Table of Contents
1. [The Real Problem](#1-the-real-problem)
2. [What We Are Building](#2-what-we-are-building)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Tech Stack](#4-tech-stack)
5. [How It Works — Full Flow](#5-how-it-works--full-flow)
6. [AI Agent Design](#6-ai-agent-design)
7. [Daily Digest System](#7-daily-digest-system)
8. [Push Notifications — Mobile App](#8-push-notifications--mobile-app)
9. [Database Schema](#9-database-schema)
10. [Backend Implementation — apps/backend](#10-backend-implementation--appsbackend)
11. [Mobile App — All Screens](#11-mobile-app--all-screens)
12. [Environment Variables](#12-environment-variables)
13. [WhatsApp Setup Guide](#13-whatsapp-setup-guide)
14. [Phase 2 — SaaS Product](#14-phase-2--saas-product)
15. [Market Opportunity](#15-market-opportunity)
17. [Task Status Tracking](#17-task-status-tracking)

---

## 1. The Real Problem

**The situation:**

Your co-founder is currently living in Ireland in a rented flat. He is moving back to India permanently. Before he leaves, he needs to find someone to take over his flat — either a sub-let or a lease transfer with the landlord's permission.

He is running ads on Facebook Marketplace, Daft.ie, and WhatsApp groups. People are messaging him. The problems:

| Problem | Impact |
|---------|--------|
| He is **busy at work in Ireland** during the day | Cannot reply to WhatsApp messages 9am–6pm |
| **Same 10 questions** from every person | "Still available? How many rooms? Bills included?" — exhausting |
| **Negotiation is stressful** while working | Someone offers €1,600, he needs €1,950 — arguing while doing his job |
| **Perfect tenants move on** while he is in a meeting | Serious renters give up after 2 hours of no reply |
| **Time pressure** — he has a departure date | Every week he delays = another month's rent he pays |
| **No overview** at end of day | Doesn't know who messaged, what was discussed, who is serious |

**What he needs:**
> An AI agent on his WhatsApp Business number that handles ALL inquiries 24/7, knows everything about the flat, never reveals his minimum price, qualifies prospects automatically, escalates only the hot leads, and sends him one clean summary every evening — so he can focus on work and only act on real leads.

---

## 2. What We Are Building

### Phase 1 — For Co-Founder (Personal MVP)

A complete product in a **new standalone monorepo** with three apps:

#### `apps/backend` — Fastify API + AI Engine
- WhatsApp webhook listener (Meta Cloud API)
- Gemini Flash AI replies about the flat
- Lead qualification + scoring engine
- Escalation detection and instant pings
- Daily digest cron job (9pm IST)
- Property config CRUD APIs
- Conversation + message storage (MongoDB)

#### `apps/web` — ~~REMOVED — Web Admin Not Needed for Phase 1~~
> Everything the co-founder needs is on his phone. The Expo app handles all management.
> Web admin may be added in Phase 2 for SaaS multi-landlord management.

#### `apps/mobile` — Expo App (Co-Founder's Phone)
- Login screen
- Today's summary (hot leads count, escalations, activity)
- Lead list (filterable, with score badges)
- Conversation detail (read chat, tap-to-WhatsApp)
- Push notifications for instant escalation alerts
- Deep links: tap notification → open that conversation

### What Phase 1 Is NOT
- ❌ No multi-landlord / multi-property
- ❌ No shared WhatsApp number
- ❌ No billing / subscriptions
- ❌ Not inside Singers AI codebase (separate repo)

### Phase 2 — SaaS Product ("RentBot" / "FlatPass")
Same system, productised for any landlord. See [Section 15](#15-phase-2--saas-product).

---

## 3. Monorepo Structure

```
property-agent/                   ← New GitHub repo
├── apps/
│   ├── backend/                  ← Fastify 5 + TypeScript + MongoDB + Gemini
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── whatsapp/     ← WhatsApp send/receive helpers
│   │   │   │   ├── property/     ← Property config CRUD
│   │   │   │   ├── ai-agent/     ← Gemini prompt + reply pipeline
│   │   │   │   ├── digest/       ← Daily digest cron
│   │   │   │   └── push/         ← Expo push notifications
│   │   │   ├── models/           ← MongoDB Mongoose schemas
│   │   │   ├── config/           ← Env validation (Zod)
│   │   │   ├── plugins/          ← Fastify plugins (mongo, auth)
│   │   │   └── app.ts            ← Entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env
│   │
│   │   (no web app — co-founder manages everything via Expo mobile app)
│   │
│   └── mobile/                   ← Expo SDK 52 + React Native
│       ├── app/
│       │   ├── (auth)/
│       │   │   └── login.tsx
│       │   ├── (tabs)/
│       │   │   ├── index.tsx     ← Today's summary
│       │   │   ├── leads.tsx     ← Lead list
│       │   │   └── settings.tsx
│       │   └── conversation/
│       │       └── [id].tsx      ← Conversation detail
│       ├── components/
│       ├── services/
│       │   └── api.ts
│       ├── package.json
│       ├── app.json
│       └── .env
│
├── packages/
│   └── types/                    ← Shared TypeScript interfaces
│       ├── src/
│       │   ├── property.ts       ← PropertyConfig, PropertyImage
│       │   ├── conversation.ts   ← Conversation, Message, LeadScore
│       │   ├── digest.ts         ← DailyDigest, DigestStats
│       │   └── index.ts
│       └── package.json
│
├── package.json                  ← Yarn workspaces root
├── turbo.json                    ← Turborepo config
├── .gitignore
└── README.md
```

---

## 4. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend framework | Fastify 5 + TypeScript | Fast, familiar from Singers AI |
| Database | MongoDB + Mongoose | No-SQL fits conversation/message structure |
| AI | Google Gemini 1.5 Flash | Cheap ($0.075/1M tokens), fast, already used in Singers AI |
| WhatsApp | Meta Cloud API (co-founder's own Business account) | Free, official, webhook-based |
| Scheduler | node-cron | Already in Singers AI, simple, no Redis needed |
| Admin frontend | ~~Next.js~~ — **Expo mobile app only** | Co-founder manages from phone, not desktop |
| Mobile app | Expo SDK 52 + Expo Router | Same stack as Singers AI Expo app |
| Mobile styling | NativeWind (Tailwind RN) | Same as Singers AI |
| Push notifications | Expo Push Notifications | Cross-platform, simple SDK |
| Image storage | AWS S3 | Flat photos upload/serve |
| Auth | Supabase | Same pattern as Singers AI, works with both web + mobile |
| Monorepo tooling | Yarn Workspaces + Turborepo | Share types, run builds in parallel |
| Deployment | Railway (backend) + EAS (mobile) | Quick, cheap for MVP — no web server needed |

---

## 5. How It Works — Full Flow

### Tenant Flow (Person Looking for a Flat)

```
1. Tenant sees ad on Daft.ie / Facebook / WhatsApp group
          ↓
2. Taps "Message on WhatsApp" or scans QR code in the ad
          ↓
3. Types: "Hi, is the flat still available?"
          ↓
4. Meta Cloud API → webhook → POST /webhook on apps/backend
          ↓
5. Backend:
   a. Parse phone number + message from webhook payload
   b. Load PropertyConfig from MongoDB (flat details, rules, min rent)
   c. Load or create Conversation record for this phone number
   d. Load last 10 messages from this conversation
   e. Build Gemini system prompt (flat details + negotiation rules injected)
   f. Call Gemini Flash with history + new message
   g. Gemini returns: reply text + JSON (lead score, extracted qualification data)
   h. Save inbound message to DB
   i. Send reply via WhatsApp Cloud API
   j. Save outbound message to DB
   k. Update conversation: lead score, qualification data, lastMessageAt
   l. Check escalation triggers
          ↓
6. If escalation triggered:
   a. Set conversation.needsHumanReview = true
   b. Send instant WhatsApp ping to co-founder's personal number
   c. Send Expo push notification to co-founder's phone
          ↓
7. Tenant receives AI reply within 3-5 seconds
```

### Co-Founder Flow (Evening)

```
9:00 PM IST every day:
1. node-cron fires daily digest job
2. Fetch all conversations from last 24 hours
3. Fetch stats: total, hot, warm, cold, escalations
4. Call Gemini: "Generate a WhatsApp summary of today's rental inquiries"
5. Send WhatsApp template message to co-founder's personal number
6. Save digest record to DB
          ↓
Co-founder reads summary in WhatsApp:
- 6 inquiries today, 2 hot leads, 1 needs attention
- Top lead: Sarah O'Brien — nurse, couple, moving April 1
- Escalation: Ahmed offered €1,800 — needs your response
- Tip: 4 people asked about parking today
          ↓
Co-founder opens mobile app to:
- See full details of hot leads
- Reply directly to Ahmed by opening his WhatsApp
- Update lead statuses (hot → rented, cold → reject)
```

### Example AI Conversation

```
Tenant: "Hi, is the flat still available?"

AI (Aidan): "Hi! Yes it is 😊 It's a 2-bed apartment in Rathmines, Dublin 6.
             Rent is €1,850/month, available from April 1.
             Can I ask — when are you looking to move in?"

Tenant: "Around April 10. How much is the deposit?"

AI (Aidan): "Deposit is €3,700 (2 months rent), paid upfront.
             The apartment is fully furnished — kitchen, living room, beds, everything.
             Are you moving in solo or with someone?"

Tenant: "With my partner. Do you allow pets?"

AI (Aidan): "It's a couple — perfect! Unfortunately no pets are allowed in this property.
             That's a strict rule from the building. Is that okay for you both?"

Tenant: "Yes that's fine. Could you do €1,700?"

AI (Aidan): "I appreciate you asking! I'll need to check with the owner on that —
             I don't think we can go that low, but let me confirm and get back to you.
             Could I get your name and best contact number in the meantime?"
             [ESCALATION TRIGGERED — co-founder pinged instantly]

Tenant: "Sure, I'm Priya, my number is +353 87 000 0000"

AI (Aidan): "Thanks Priya! I've passed your details to the owner.
             He'll get back to you shortly about the price and to arrange a viewing.
             He typically responds same evening 😊"
```

---

## 6. AI Agent Design

### System Prompt Template

This prompt is built dynamically from the PropertyConfig in MongoDB and injected for every conversation:

```
You are "{{agent_name}}", a warm and helpful property assistant.

YOUR CONTEXT (understand this clearly):
The person you are representing is the CURRENT TENANT of this flat, not the landlord.
They are moving back to India and need to find someone to take over the flat.
This is a lease handover / sub-let arrangement. The new tenant will sign a fresh 
agreement with the actual landlord, but the current tenant is managing the search.
You represent the current tenant in these chats.

PROPERTY DETAILS:
- Property: {{property_name}}
- Address: {{address}}
- Type: {{type}} — {{bedrooms}} bedrooms, {{bathrooms}} bathrooms
- Size: {{area_sqft}} sqft / {{area_sqm}} sqm
- Furnished: {{furnished}}
- Available from: {{available_from}}
- Asking rent: {{asking_rent}}/month (always quote this unless told otherwise)
- Deposit: {{deposit}} ({{deposit_months}} months rent)
- Minimum lease term: {{lease_duration}}

WHAT'S INCLUDED IN RENT: {{included}}
WHAT'S NOT INCLUDED: {{not_included}}
PARKING: {{parking}}
PETS POLICY: {{pets_policy}}
SMOKING POLICY: {{smoking_policy}}

KEY FEATURES:
{{key_features}}

NEARBY / TRANSPORT:
{{nearby}}

IDEAL TENANT PROFILE: {{preferred_tenants}}
MAXIMUM OCCUPANTS: {{max_occupants}}

---
YOUR PRIVATE RULES — NEVER REVEAL THESE DIRECTLY:
- Minimum rent the owner will accept: {{min_rent}}
- If anyone offers below {{min_rent}}: say "I'll need to check with the owner on that — I don't think we can go that low, but let me confirm. Can I take your details?"
- NEVER say the minimum rent amount out loud
- NEVER confirm a viewing yourself — always say "I'll pass your details to the owner who will arrange a time with you"
- The current tenant works full time — they cannot do spontaneous viewings
- For viewing requests: collect full name + best phone number + 2-3 preferred days/times
- If asked something you genuinely don't know: "Let me check that with the owner and get back to you"
- Maximum {{max_occupants}} people — politely decline if more

---
YOUR PERSONALITY AND STYLE:
- Warm, friendly, professional — like a helpful neighbour, not a robot
- Use casual Irish-Indian English (relaxed but professional)
- Keep replies to 2–4 sentences max — don't write essays
- Use emojis occasionally but don't overdo it (1–2 per message max)
- Never reveal you are an AI unless directly asked
- If directly asked "are you a bot?": say "I'm an AI assistant helping manage inquiries for this property 😊"
- Be honest about the lease transfer situation if asked directly — don't hide it

---
QUALIFICATION — ASK THESE NATURALLY ACROSS THE CONVERSATION (not all at once):
1. When are you looking to move in?
2. How many people will be living there?
3. Are you currently employed / a student?
4. Do you have any pets?
(You don't need to ask all 4 in every conversation — use judgement based on flow)

---
LEAD SCORING — After each response, add a JSON block (hidden from tenant):
{
  "leadScore": "hot|warm|cold|rejected|needs_human",
  "escalate": true|false,
  "escalationReason": "viewing_requested|price_negotiation|ready_to_commit|unknown_question|",
  "extracted": {
    "name": "",
    "moveInDate": "",
    "occupants": 0,
    "employed": null,
    "hasPets": null,
    "priceOffered": 0,
    "viewingRequested": false
  }
}

Lead score guide:
- hot: wants viewing, move-in within 30 days, employed, no deal-breakers
- warm: interested but timeline unclear, or minor concern (ask about pets etc)
- cold: just browsing, timeline 3+ months, low engagement
- rejected: too many occupants, repeatedly below min rent, deal-breaker violation
- needs_human: price negotiation, viewing request, ready to commit, AI can't answer

---
NEVER:
- Give out the owner's personal phone number or personal WhatsApp
- Confirm a viewing time yourself
- Say the minimum acceptable rent out loud
- Promise anything about the landlord's decision (deposit flexibility, lease length changes)
- Misrepresent this as a direct landlord listing — it's a lease handover arrangement
```

### How the Backend Parses the AI Response

The AI returns two sections in every response:
1. The visible reply text (sent to tenant via WhatsApp)
2. A hidden JSON block (parsed by backend, never sent to tenant)

```typescript
// ai-agent.service.ts

async function parseGeminiResponse(rawResponse: string): Promise<{
  replyText: string;
  leadData: LeadScoreData;
}> {
  // Extract JSON block if present
  const jsonMatch = rawResponse.match(/\{[\s\S]*"leadScore"[\s\S]*\}/);
  const replyText = rawResponse.replace(/\{[\s\S]*"leadScore"[\s\S]*\}/, '').trim();
  
  let leadData: LeadScoreData = { leadScore: 'cold', escalate: false };
  if (jsonMatch) {
    try {
      leadData = JSON.parse(jsonMatch[0]);
    } catch {}
  }
  
  return { replyText, leadData };
}
```

### Escalation Triggers

When `escalate: true` in the AI JSON, the backend:
1. Sets `conversation.needsHumanReview = true` in MongoDB
2. Sends an instant WhatsApp message to the co-founder's personal number:

```
�� *Action Needed — Flat Inquiry*

Prospect: {{name or "Unknown"}}
Phone: +353 87 XXX XXXX
Reason: {{escalationReason}}

Last message from them:
"{{last_inbound_message}}"

👉 Open WhatsApp: wa.me/+353870000000
👉 View full chat: {{dashboard_link}}/conversations/{{id}}
```

3. Sends an Expo push notification to the mobile app.

---

## 7. Daily Digest System

### Cron Job Schedule

- **Runs:** Every day at 21:00 IST (15:30 UTC)
- **cron expression:** `30 15 * * *`
- **Sends to:** Co-founder's personal WhatsApp number (from PropertyConfig)

### What It Does

```typescript
// digest.service.ts

async function generateDailyDigest(propertyId: string): Promise<void> {

  // 1. Fetch today's conversations (last 24 hours)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const conversations = await Conversation.find({
    propertyId,
    lastMessageAt: { $gte: today }
  }).populate('messages');
  
  // 2. Compute stats
  const stats = {
    total: conversations.length,
    hot: conversations.filter(c => c.leadScore === 'hot').length,
    warm: conversations.filter(c => c.leadScore === 'warm').length,
    cold: conversations.filter(c => c.leadScore === 'cold').length,
    escalations: conversations.filter(c => c.needsHumanReview).length,
    viewingRequests: conversations.filter(c => c.qualificationData?.viewingRequested).length,
  };
  
  // 3. Call Gemini for natural language summary
  const summary = await callGeminiForDigest(conversations, stats);
  
  // 4. Build WhatsApp message
  const message = buildDigestMessage(property, stats, summary, date);
  
  // 5. Send via WhatsApp to co-founder's personal number
  await whatsappService.sendText(property.ownerPhone, message);
  
  // 6. Save digest to DB
  await DailyDigest.create({ propertyId, date: today, stats, aiSummaryText: summary });
}
```

### Gemini Digest Prompt

```
You are summarising today's rental inquiry conversations for a busy professional.

Property: {{property_name}}, {{address}}
Date: {{date}}
Stats: {{stats_json}}
Conversations today: {{conversations_json}}

Write a WhatsApp summary for the property owner. Requirements:
- Max 200 words
- Casual but professional tone
- Highlight: who the hot leads are (name + key facts + why they're good)
- Highlight: anything that needs the owner's attention (escalations, negotiations)
- Mention any patterns you noticed (common questions, concerns, objections)
- End with a one-line recommendation if relevant
- Do NOT use markdown (no **, no #) — this is a WhatsApp message
- Use emojis sparingly (2-3 max)
```

### Example Digest Output

```
📊 Rathmines Flat — Daily Summary, March 22

Today: 7 new inquiries | 2 hot | 1 needs your attention

Hot leads:
• Sarah O'Brien — nurse, moving in with partner April 1, no pets, loved the flat ✅
• Raj Sharma — IT contractor, solo, moving April 10, asked about parking ✅

Needs your attention:
• Ahmed Hassan (+353 87 111 2222) offered €1,700. I told him I'd check with you. He seemed genuinely interested otherwise.

Patterns today: 5 out of 7 people asked about parking. Worth adding it more prominently to the ad.

Overall: Strong demand. Recommend not dropping below €1,800 — multiple people interested at asking price.

👉 Full dashboard: https://property-agent.app/admin
```

---

## 8. Push Notifications — Mobile App

### Flow

```
Escalation triggered (viewing request, price negotiation, ready to commit)
          ↓
backend: push.service.ts → Expo Push Notifications API
          ↓
Mobile app: notification received
          ↓
User taps notification → deep link opens conversation/[id] screen
```

### Backend Push Service

```typescript
// push.service.ts

import Expo, { ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendEscalationNotification(
  pushToken: string,
  conversationId: string,
  tenantName: string,
  reason: string
): Promise<void> {
  
  if (!Expo.isExpoPushToken(pushToken)) return;
  
  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title: '🔔 Flat Inquiry Needs You',
    body: `${tenantName || 'A prospect'}: ${reasonToText(reason)}`,
    data: { 
      conversationId,
      screen: 'conversation'
    },
  };
  
  await expo.sendPushNotificationsAsync([message]);
}

function reasonToText(reason: string): string {
  const map: Record<string, string> = {
    viewing_requested: 'Wants to arrange a viewing',
    price_negotiation: 'Negotiating price — needs your input',
    ready_to_commit: 'Ready to take the flat!',
    unknown_question: 'Has a question I couldn\'t answer',
  };
  return map[reason] || 'Needs your attention';
}
```

### Mobile App: Register Push Token

```typescript
// apps/mobile — on login

import * as Notifications from 'expo-notifications';

async function registerPushToken(userId: string): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Send to backend
  await api.post('/push/register', { token });
}
```

---

## 9. Database Schema

### MongoDB Collections (Mongoose)

#### `property_configs`
```typescript
{
  _id: ObjectId,
  
  // Property info
  name: string,               // "2-bed apartment, Rathmines"
  address: string,
  type: string,               // "apartment" | "house" | "room" | "studio"
  bedrooms: number,
  bathrooms: number,
  areaSqft: number,
  areaSqm: number,
  furnished: boolean,
  
  // Pricing (PRIVATE fields never sent to tenants)
  askingRent: number,         // shown in AI responses
  minimumRent: number,        // PRIVATE — only in system prompt, never in reply
  deposit: number,
  depositMonths: number,
  leaseDuration: string,      // "12 months minimum"
  
  // Details
  included: string,           // "WiFi, water, refuse" 
  notIncluded: string,        // "electricity, gas"
  parking: string,
  petsPolicy: string,
  smokingPolicy: string,
  keyFeatures: string,        // free text, injected into AI prompt
  nearby: string,
  preferredTenants: string,
  maxOccupants: number,
  availableFrom: Date,
  
  // Images (S3)
  images: [{
    key: string,              // S3 key
    label: string,            // "Living Room", "Kitchen", etc.
    url: string,              // S3 public URL
    order: number,
  }],
  
  // Agent config
  agentName: string,          // "Aidan"
  agentPhone: string,         // WhatsApp number tenants message (Meta phone number ID)
  ownerPhone: string,         // co-founder's personal number for digests + escalations
  digestTime: string,         // "21:00" (IST)
  digestTimezone: string,     // "Asia/Kolkata"
  language: string,           // "en"
  escalationSensitivity: string, // "low" | "medium" | "high"
  
  // Status
  isActive: boolean,          // AI replies when true
  isRented: boolean,          // set when flat is taken
  
  // Push notifications (mobile app)
  ownerPushToken: string,
  
  // Future SaaS
  ownerUserId: string,
  
  createdAt: Date,
  updatedAt: Date,
}
```

#### `property_conversations`
```typescript
{
  _id: ObjectId,
  propertyId: ObjectId,       // ref: property_configs
  
  tenantPhone: string,        // "+353871234567" — unique per property
  tenantName: string,         // extracted by AI from conversation
  
  messageCount: number,
  lastMessageAt: Date,
  
  // Lead management
  leadScore: "hot" | "warm" | "cold" | "rejected" | "needs_human",
  needsHumanReview: boolean,
  humanReviewReason: string,
  isHandedOff: boolean,       // co-founder took over manually
  
  // Qualification data (extracted by AI)
  qualification: {
    moveInDate: Date,
    occupants: number,
    employed: boolean,
    hasPets: boolean,
    priceOffered: number,
    viewingRequested: boolean,
    preferredViewingTimes: string[],
  },
  
  // Admin notes (co-founder can add)
  notes: string,
  
  createdAt: Date,
  updatedAt: Date,
}
```

#### `property_messages`
```typescript
{
  _id: ObjectId,
  conversationId: ObjectId,   // ref: property_conversations
  propertyId: ObjectId,
  tenantPhone: string,
  
  direction: "inbound" | "outbound",
  content: string,
  messageType: "text" | "image" | "template",
  
  waMessageId: string,        // Meta message ID for delivery tracking
  status: "sent" | "delivered" | "read" | "failed",
  
  // Raw webhook payload (for debugging)
  rawPayload: object,
  
  sentAt: Date,
  createdAt: Date,
}
```

#### `property_daily_digests`
```typescript
{
  _id: ObjectId,
  propertyId: ObjectId,
  
  date: string,               // "2025-03-22"
  
  stats: {
    totalInquiries: number,
    hotLeads: number,
    warmLeads: number,
    coldLeads: number,
    escalations: number,
    viewingRequests: number,
  },
  
  hotLeadSummaries: [{
    tenantPhone: string,
    tenantName: string,
    keyFacts: string,
  }],
  
  escalationSummaries: [{
    tenantPhone: string,
    tenantName: string,
    reason: string,
  }],
  
  aiSummaryText: string,      // Gemini-generated natural language summary
  
  sentToPhone: string,
  waMessageId: string,
  sentAt: Date,
  
  createdAt: Date,
}
```

#### `push_tokens`
```typescript
{
  _id: ObjectId,
  userId: string,
  token: string,
  platform: "ios" | "android",
  createdAt: Date,
  updatedAt: Date,
}
```

---

## 10. Backend Implementation — apps/backend

### Folder Structure

```
apps/backend/src/
├── modules/
│   ├── whatsapp/
│   │   ├── whatsapp.service.ts     ← sendText(), sendImage(), sendTemplate()
│   │   └── whatsapp.webhook.ts     ← parseWebhookPayload()
│   │
│   ├── property/
│   │   ├── property.model.ts       ← PropertyConfig Mongoose schema
│   │   ├── property.service.ts     ← CRUD for property config
│   │   └── property.routes.ts      ← GET /property, PUT /property, POST /property/photos
│   │
│   ├── ai-agent/
│   │   ├── ai-agent.prompt.ts      ← buildSystemPrompt(), buildDigestPrompt()
│   │   ├── ai-agent.service.ts     ← handleInboundMessage(), parseGeminiResponse()
│   │   ├── conversation.model.ts   ← Conversation + Message schemas
│   │   └── conversation.service.ts ← loadConversation(), saveMessage(), updateLeadScore()
│   │
│   ├── digest/
│   │   ├── digest.model.ts         ← DailyDigest schema
│   │   ├── digest.service.ts       ← generateAndSendDailyDigest()
│   │   └── digest.cron.ts          ← node-cron 9pm IST job
│   │
│   └── push/
│       ├── push.service.ts         ← sendEscalationNotification()
│       └── push.routes.ts          ← POST /push/register
│
├── plugins/
│   ├── mongodb.plugin.ts           ← Mongoose connection
│   └── auth.plugin.ts              ← Supabase JWT verification
│
├── config/
│   └── env.ts                      ← Zod env validation
│
├── routes/
│   ├── webhook.routes.ts           ← GET/POST /webhook (Meta verification + messages)
│   └── index.ts                    ← Register all routes
│
└── app.ts                          ← Fastify setup + plugin registration
```

### Core Files

#### `app.ts` — Entry Point
```typescript
import Fastify from 'fastify';
import { mongoPlugin } from './plugins/mongodb.plugin';
import { webhookRoutes } from './routes/webhook.routes';
import { propertyRoutes } from './modules/property/property.routes';
import { aiAgentRoutes } from './modules/ai-agent/ai-agent.routes';
import { pushRoutes } from './modules/push/push.routes';
import { startDigestCron } from './modules/digest/digest.cron';
import { env } from './config/env';

const app = Fastify({ logger: true });

// Plugins
app.register(mongoPlugin);

// Routes
app.register(webhookRoutes, { prefix: '/webhook' });
app.register(propertyRoutes, { prefix: '/property' });
app.register(aiAgentRoutes, { prefix: '/conversations' });
app.register(pushRoutes, { prefix: '/push' });

// Health check
app.get('/health', async () => ({ status: 'ok' }));

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
  startDigestCron(); // Start 9pm IST daily digest
});
```

#### `webhook.routes.ts` — WhatsApp Webhook
```typescript
// GET /webhook — Meta verification handshake
fastify.get('/webhook', async (req, reply) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query as any;
  
  if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return reply.send(Number(challenge));
  }
  return reply.status(403).send('Forbidden');
});

// POST /webhook — Incoming messages from tenants
fastify.post('/webhook', async (req, reply) => {
  // Respond to Meta immediately (< 20 seconds requirement)
  reply.send({ status: 'ok' });
  
  // Process async (don't block webhook response)
  setImmediate(async () => {
    try {
      const payload = parseWebhookPayload(req.body);
      if (!payload) return;
      
      const { phone, message, waMessageId } = payload;
      
      // Load property config
      const property = await PropertyConfig.findOne({ isActive: true });
      if (!property) return;
      
      // Handle with AI agent
      await aiAgentService.handleInboundMessage({
        propertyId: property._id.toString(),
        tenantPhone: phone,
        message,
        waMessageId,
      });
    } catch (err) {
      fastify.log.error(err, 'Error processing webhook');
    }
  });
});
```

#### `whatsapp.service.ts` — Send Messages
```typescript
export class WhatsAppService {
  private baseUrl: string;
  private headers: Record<string, string>;
  
  constructor(private config: {
    phoneNumberId: string;
    accessToken: string;
  }) {
    this.baseUrl = `https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`;
    this.headers = {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }
  
  async sendText(to: string, text: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
    const data = await response.json() as any;
    return data.messages?.[0]?.id;
  }
  
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { link: imageUrl, caption },
      }),
    });
    const data = await response.json() as any;
    return data.messages?.[0]?.id;
  }
  
  async sendTemplate(to: string, templateName: string, components: any[]): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components,
        },
      }),
    });
    const data = await response.json() as any;
    return data.messages?.[0]?.id;
  }
}
```

#### `ai-agent.service.ts` — Core AI Pipeline
```typescript
export class AiAgentService {
  
  async handleInboundMessage(input: {
    propertyId: string;
    tenantPhone: string;
    message: string;
    waMessageId: string;
  }): Promise<void> {
    
    const { propertyId, tenantPhone, message, waMessageId } = input;
    
    // Load property config
    const property = await PropertyConfig.findById(propertyId);
    if (!property || !property.isActive || property.isRented) return;
    
    // Load or create conversation
    const conversation = await conversationService.getOrCreate(propertyId, tenantPhone);
    
    // Load last 10 messages for context
    const history = await conversationService.getRecentMessages(conversation._id, 10);
    
    // Save inbound message
    await conversationService.saveMessage({
      conversationId: conversation._id,
      propertyId,
      tenantPhone,
      direction: 'inbound',
      content: message,
      waMessageId,
    });
    
    // Build Gemini messages
    const systemPrompt = buildSystemPrompt(property);
    const messages = buildConversationMessages(history, message);
    
    // Call Gemini
    const rawResponse = await callGemini(systemPrompt, messages);
    
    // Parse AI response (reply text + hidden JSON data)
    const { replyText, leadData } = parseGeminiResponse(rawResponse);
    
    // Send WhatsApp reply
    const outboundMsgId = await whatsappService.sendText(tenantPhone, replyText);
    
    // Save outbound message
    await conversationService.saveMessage({
      conversationId: conversation._id,
      propertyId,
      tenantPhone,
      direction: 'outbound',
      content: replyText,
      waMessageId: outboundMsgId,
    });
    
    // Update conversation with lead data
    await conversationService.updateLeadData(conversation._id, leadData);
    
    // Handle escalation
    if (leadData.escalate) {
      await this.handleEscalation(conversation, property, leadData, message);
    }
  }
  
  private async handleEscalation(
    conversation: Conversation,
    property: PropertyConfig,
    leadData: LeadScoreData,
    lastMessage: string
  ): Promise<void> {
    
    // Set flag in DB
    await Conversation.findByIdAndUpdate(conversation._id, {
      needsHumanReview: true,
      humanReviewReason: leadData.escalationReason,
    });
    
    // Build escalation message
    const escalationMsg = buildEscalationMessage(conversation, property, leadData, lastMessage);
    
    // Send WhatsApp to co-founder's personal number
    await whatsappService.sendText(property.ownerPhone, escalationMsg);
    
    // Send Expo push notification
    if (property.ownerPushToken) {
      await pushService.sendEscalationNotification(
        property.ownerPushToken,
        conversation._id.toString(),
        conversation.tenantName || 'Unknown',
        leadData.escalationReason,
      );
    }
  }
}
```

### API Routes Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/webhook` | Meta webhook verification handshake |
| POST | `/webhook` | Receive incoming WhatsApp messages |
| GET | `/property` | Get property config |
| PUT | `/property` | Update property config |
| POST | `/property/photos` | Upload photos to S3, update config |
| DELETE | `/property/photos/:key` | Remove a photo |
| GET | `/conversations` | List all conversations (with filters) |
| GET | `/conversations/:id` | Get full message history |
| PATCH | `/conversations/:id` | Update lead score / notes manually |
| POST | `/conversations/:id/reply` | Co-founder sends manual WhatsApp reply |
| GET | `/stats/today` | Today's dashboard stats |
| GET | `/digests` | List past daily digests |
| GET | `/digests/:id` | Get single digest details |
| POST | `/push/register` | Register Expo push token |
| POST | `/digest/trigger` | Manually trigger digest (for testing) |

---

## 11. Mobile App — All Screens

> **No web admin.** Everything the co-founder needs is on the Expo app on his phone.
> He gets push notifications, checks leads, reads chats, replies, uploads photos, and configures the property — all from the app.

### Folder Structure

```
apps/mobile/app/
├── (auth)/
│   └── login.tsx             ← Supabase email/password login
├── (tabs)/
│   ├── _layout.tsx           ← Bottom tab bar: Home / Leads / Settings
│   ├── index.tsx             ← Today's Summary
│   ├── leads.tsx             ← All leads (filterable)
│   └── settings.tsx          ← Property setup + agent config
├── conversation/
│   └── [id].tsx              ← Full conversation detail + manual reply
└── setup/
    └── photos.tsx            ← Photo upload (camera roll → S3)
```

### Screen Designs

#### Home Tab — Today's Summary
```
┌────────────────────────────────┐
│  Today, March 22  🔔 1 Alert   │
│                                │
│  ┌──────┐ ┌──────┐ ┌────────┐ │
│  │  7   │ │  2   │ │  1 ⚠️  │ │
│  │Total │ │ 🔥Hot│ │Needs U │ │
│  └──────┘ └──────┘ └────────┘ │
│                                │
│  🔥 Hot Leads                  │
│  ──────────────────────────    │
│  Sarah O'Brien        🔥 Hot   │
│  Moving Apr 1 · Couple · ✅    │
│  "Can I view this weekend?"    │
│  [Open Chat]  [WhatsApp Her]   │
│                                │
│  Raj Sharma           🔥 Hot   │
│  Moving Apr 10 · Solo · ✅     │
│  "Parking included?"           │
│  [Open Chat]  [WhatsApp Him]   │
│                                │
│  ⚠️ Needs Your Attention       │
│  ──────────────────────────    │
│  Ahmed Hassan      ⚠️ Escalate │
│  Offered €1,700 — needs reply  │
│  [Open Chat]  [WhatsApp Him]   │
└────────────────────────────────┘
```

#### Leads Tab — All Leads
```
┌────────────────────────────────┐
│  All Leads    [Filter ▾]       │
│  All | 🔥Hot | 🟡Warm | ❄️Cold  │
│                                │
│  Sarah O'Brien         🔥 Hot  │
│  +353 87 XXX · 2 hrs ago       │
│  Moving Apr 1 · Couple         │
│  ──────────────────────────    │
│  Ahmed Hassan       ⚠️ Escalat │
│  +353 85 XXX · 3 hrs ago       │
│  Price negotiation             │
│  ──────────────────────────    │
│  Raj Sharma           🟡 Warm  │
│  +91 98 XXX · 5 hrs ago        │
│  Moving Apr 10 · Solo          │
└────────────────────────────────┘
```

#### Conversation Detail
```
┌────────────────────────────────┐
│  ← Sarah O'Brien    🔥 Hot     │
│  +353 87 111 2222              │
│  Moving Apr 1 · Couple · ✅    │
│  ──────────────────────────    │
│                                │
│  [Sarah]: Hi is it available?  │
│  [Aidan]: Yes it is 😊 ...     │
│  [Sarah]: Could you do €1,700? │
│  [Aidan]: I'll check with...   │
│                                │
│  ──────────────────────────    │
│  [  Reply as yourself...    ]  │
│  [Send WhatsApp]               │
│                                │
│  ┌──────────────────────────┐  │
│  │  📱 Open in WhatsApp     │  │
│  └──────────────────────────┘  │
│  [Mark Hot] [Mark Rented] [❌]  │
└────────────────────────────────┘
```

#### Settings Tab — Property Setup
```
┌────────────────────────────────┐
│  Settings                      │
│                                │
│  Property Details              │
│  ──────────────────────────    │
│  Name: [Rathmines Apt, D6  ]   │
│  Address: [                ]   │
│  Bedrooms: [2] Bathrooms:[1]   │
│  Available: [April 1, 2025 ]   │
│                                │
│  Pricing (Private)             │
│  ──────────────────────────    │
│  Asking Rent: [€ 1,850     ]   │
│  Min Rent: [€ 1,650  ] 🔒      │
│  Deposit: [€ 3,700         ]   │
│                                │
│  AI Agent                      │
│  ──────────────────────────    │
│  Agent Name: [Aidan        ]   │
│  Your Number: [+91 XXXXXX  ]   │
│  Digest Time: [9:00 PM IST ]   │
│                                │
│  [📷 Manage Photos]            │
│  [💬 Test — Send me a WA]      │
│  [💾 Save Changes]             │
└────────────────────────────────┘
```

#### Photo Upload Screen
```
┌────────────────────────────────┐
│  ← Flat Photos                 │
│                                │
│  [+ Add Photo]                 │
│                                │
│  📷 Living Room        [✏️][🗑] │
│  📷 Kitchen            [✏️][🗑] │
│  📷 Bedroom 1          [✏️][🗑] │
│  📷 Bedroom 2          [✏️][🗑] │
│  📷 Bathroom           [✏️][🗑] │
│                                │
│  AI will send these when       │
│  tenants ask for photos        │
└────────────────────────────────┘
```

#### Digest History (in Settings tab)
```
┌────────────────────────────────┐
│  Past Digests                  │
│                                │
│  March 22  7 inquiries  2 hot  │
│  "Strong demand today. Sarah   │
│   and Raj are serious..."  [+] │
│                                │
│  March 21  4 inquiries  1 hot  │
│  "Quiet day. One viewing req.."│
│  [+]                           │
└────────────────────────────────┘
```


## 12. Environment Variables

### apps/backend/.env
```bash
# Server
NODE_ENV=development
PORT=3001

# MongoDB
MONGODB_URI=mongodb+srv://...

# WhatsApp — Co-Founder's Meta Business Account
WHATSAPP_PHONE_NUMBER_ID=         # From Meta Developer App
WHATSAPP_ACCESS_TOKEN=            # System User permanent token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=    # Random string you choose
WHATSAPP_APP_SECRET=              # From Meta App Settings

# AI
GEMINI_API_KEY=

# AWS S3 (flat photos)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-1
AWS_S3_BUCKET=property-agent-photos

# Auth
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Expo Push Notifications
EXPO_ACCESS_TOKEN=

# Daily digest schedule
DIGEST_CRON_UTC=30 15 * * *       # 9pm IST = 3:30pm UTC
```

### apps/mobile/.env
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 13. WhatsApp Setup Guide

> Co-founder already has a WhatsApp Business account. This guide explains how to migrate it to Meta Cloud API.

### Step 1 — Create Meta Developer Account
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Sign in with the Facebook account linked to the WhatsApp Business account
3. Click "My Apps" → "Create App"
4. Choose "Business" type → name it (e.g. "Property Agent")
5. Add WhatsApp product to the app

### Step 2 — Link WhatsApp Business Account
1. In Meta Developer App → WhatsApp → Getting Started
2. Click "Add phone number"
3. Enter the existing WhatsApp Business phone number
4. Verify via OTP
5. **Important:** This will disconnect the WhatsApp Business App on the phone. The number is now controlled via Cloud API only.
6. Note down: **Phone Number ID** and **WhatsApp Business Account ID**

### Step 3 — Generate Permanent Access Token
1. Go to Meta Business Manager (business.facebook.com)
2. Settings → System Users → Create System User (Admin)
3. Add assets → add your WhatsApp Business Account
4. Generate token → select `whatsapp_business_messaging` and `whatsapp_business_management` permissions
5. Save this token as `WHATSAPP_ACCESS_TOKEN` — it does not expire

### Step 4 — Set Up Webhook
1. In Meta Developer App → WhatsApp → Configuration → Webhook
2. Set webhook URL: `https://your-backend.railway.app/webhook`
3. Set verify token: match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your .env
4. Subscribe to: `messages` event

### Step 5 — Submit Message Templates
Only 2 templates needed for the daily digest and escalation alert:

**Template 1: `property_escalation_alert`**
```
🔔 Action Needed — Flat Inquiry

Prospect: {{1}}
Phone: {{2}}
Reason: {{3}}

Their last message: "{{4}}"

👉 Open their WhatsApp: wa.me/{{2}}
```

**Template 2: `property_daily_digest`**
```
📊 {{1}} — Daily Summary {{2}}

Today: {{3}} inquiries | 🔥 {{4}} hot | ⚠️ {{5}} need attention

{{6}}

👉 Full dashboard: {{7}}
```

> Note: Free-form text messages can be sent within 24 hours of a tenant messaging first (user-initiated conversation). Templates are needed for proactive messages like digests and escalations.

---

## 14. Phase 2 — SaaS Product

### Product Names to Consider
| Name | Domain | Notes |
|------|--------|-------|
| **RentBot** | rentbot.in | Simple, clear |
| **FlatPass** | flatpass.in | Lease handover angle |
| **CasaBot** | casabot.in | India + international feel |
| **PropAI** | propai.in | Professional |

### Core SaaS Architecture Changes
1. **Multi-tenant DB:** Add `landlordId` to all collections
2. **Landlord auth:** Signup/login at rentbot.in (separate from admin)
3. **Per-landlord WhatsApp:** Each landlord brings their own Meta Business Account + phone number
4. **Billing:** Stripe subscriptions
5. **Onboarding wizard:** Step-by-step setup (property details → WhatsApp setup → go live)

### Pricing Tiers

| Plan | Price | Properties | Conversations | Features |
|------|-------|-----------|--------------|----------|
| **Free trial** | ₹0 (14 days) | 1 | 50 | All features, test before paying |
| **Solo** | ₹999/mo | 1 | Unlimited | All features, daily digest, push |
| **Pro** | ₹2,499/mo | 5 | Unlimited | All + analytics, CSV export, priority |
| **Agency** | ₹7,999/mo | Unlimited | Unlimited | All + white-label, team members, API |

**Ireland/EU pricing:**
- Solo: €19/month
- Pro: €49/month
- Agency: €149/month

### Why People Will Pay

Current alternatives:
- Property manager: 8-10% of monthly rent = **€176-220/month** for a €2,200 flat
- Interakt/WATI: ₹999-₹2,499/month but NO AI — just template broadcasting
- Doing it manually: costs hours of stress and missed leads = **€2,200+ per lost tenancy**

Our product at ₹999/month has obvious ROI.

### Go-To-Market

**Immediate target — NRI landlords (easiest win):**
- Indian professionals living in Ireland/UK/UAE who own or rent property
- They have a property abroad, they are in India, they CANNOT manage inquiries personally
- Facebook groups: "Indians in Ireland", "Indian Professionals Dublin", "NRI Property Owners"
- Message: "Your flat is in Dublin. You are in Bangalore. Never miss a tenant inquiry again."
- Cost: Nearly zero — organic posts in these communities

**Phase 2 — India domestic landlords:**
- Mumbai / Bangalore / Hyderabad landlords with 2-5 properties
- Too busy to manage WhatsApp inquiries across multiple listings
- Channel: MagicBricks, 99acres, Housing.com partnerships

**Phase 3 — Ireland/EU market:**
- Daft.ie landlords
- Small letting agencies
- Premium pricing (€19+/month)

### Competitor Analysis

| Product | Price | Real AI | Negotiation Aware | Daily Digest | NRI Focus |
|---------|-------|---------|------------------|--------------|-----------|
| Interakt | ₹999/mo | ❌ Templates only | ❌ | ❌ | ❌ |
| WATI | ₹2,499/mo | ❌ Basic chatbot | ❌ | ❌ | ❌ |
| PropChat | $45/mo | Basic FAQ | ❌ | ❌ | ❌ |
| **RentBot** | **₹999/mo** | **✅ Gemini AI** | **✅** | **✅ WhatsApp** | **✅** |

---

## 15. Market Opportunity

| Market | Size | Notes |
|--------|------|-------|
| India rental market | $34B (2023) → $42B by 2030 | 9.75% CAGR |
| India NRI population | 35M worldwide | Millions with property abroad |
| Irish rental market | €14B/year | Extremely high rents, digitally active |
| Real estate SaaS global | $8.6B by 2025 | 40%+ CAGR |
| WhatsApp India users | 500M+ | 98% open rate |
| India rentals going unanswered | 80% within first hour | Massive missed opportunity |
| TAM (India alone) | ₹120B/year | 10M+ landlords × ₹999/month |

---

## 16. Task Status Tracking

> Status key: ⬜ Not Started | 🔄 In Progress | ✅ Done | ❌ Blocked

### Phase 0 — One-Time Setup (Co-Founder to Do)

| ID | Task | Owner | Status | Notes |
|----|------|-------|--------|-------|
| S-1 | Create new GitHub repo `property-agent` | Pranjal | ⬜ | Public or private |
| S-2 | Migrate WhatsApp Business number to Meta Cloud API | Co-founder | ⬜ | See Section 14 — 30 min process |
| S-3 | Get Phone Number ID + Access Token from Meta | Co-founder | ⬜ | Needed for .env |
| S-4 | Create Meta App + set up webhook URL | Pranjal | ⬜ | Need backend deployed first |
| S-5 | Submit `property_daily_digest` + `property_escalation_alert` templates | Pranjal | ⬜ | Can do before go-live |

---

### Phase 1 — Monorepo Setup

| ID | Task | App | Depends On | Status |
|----|------|-----|-----------|--------|
| SETUP-1 | Init monorepo: `package.json` with yarn workspaces | root | — | ⬜ |
| SETUP-2 | Add `turbo.json` for parallel builds | root | SETUP-1 | ⬜ |
| SETUP-3 | Scaffold `apps/backend` (Fastify 5 + TS skeleton) | backend | SETUP-1 | ⬜ |
| SETUP-5 | Scaffold `apps/mobile` (Expo SDK 52 + Expo Router + NativeWind) | mobile | SETUP-1 | ⬜ |
| SETUP-6 | Create `packages/types` with shared interfaces | types | SETUP-1 | ⬜ |
| SETUP-7 | Configure `.env` files + Zod validation for all apps | all | SETUP-3 | ⬜ |
| SETUP-8 | Deploy backend to Railway (staging) | backend | SETUP-3 | ⬜ |

---

### Phase 2 — WhatsApp Integration

| ID | Task | App | Depends On | Status |
|----|------|-----|-----------|--------|
| WA-1 | `whatsapp.service.ts` — sendText(), sendImage(), sendTemplate() | backend | SETUP-3 | ⬜ |
| WA-2 | GET `/webhook` — Meta verification handshake | backend | SETUP-3 | ⬜ |
| WA-3 | POST `/webhook` — parse incoming messages, route to AI service | backend | WA-2 | ⬜ |
| WA-4 | `whatsapp.webhook.ts` — parseWebhookPayload() helper | backend | SETUP-3 | ⬜ |
| WA-5 | Test: send message to property number → webhook fires | backend | WA-3, S-3 | ⬜ |

---

### Phase 3 — Property Config

| ID | Task | App | Depends On | Status |
|----|------|-----|-----------|--------|
| PC-1 | `property.model.ts` — PropertyConfig Mongoose schema | backend | SETUP-3 | ⬜ |
| PC-2 | `property.service.ts` — CRUD operations | backend | PC-1 | ⬜ |
| PC-3 | GET + PUT `/property` routes | backend | PC-2 | ⬜ |
| PC-4 | POST `/property/photos` — S3 upload + store URL in config | backend | PC-1 | ⬜ |

---

### Phase 4 — AI Agent Core

| ID | Task | App | Depends On | Status |
|----|------|-----|-----------|--------|
| AI-1 | `conversation.model.ts` — Conversation + Message Mongoose schemas | backend | SETUP-3 | ⬜ |
| AI-2 | `conversation.service.ts` — getOrCreate, saveMessage, updateLeadScore | backend | AI-1 | ⬜ |
| AI-3 | `ai-agent.prompt.ts` — buildSystemPrompt(), buildConversationMessages() | backend | PC-1 | ⬜ |
| AI-4 | `ai-agent.service.ts` — handleInboundMessage(), parseGeminiResponse() | backend | AI-2, AI-3, WA-1 | ⬜ |
| AI-5 | Lead scoring logic — tag Hot/Warm/Cold/Rejected/NeedsHuman from AI JSON | backend | AI-4 | ⬜ |
| AI-6 | Escalation detection — send WA ping + push when escalate: true | backend | AI-5, PN-1 | ⬜ |
| AI-7 | Wire webhook POST → AI service (full pipeline test) | backend | AI-4, WA-3 | ⬜ |
| AI-8 | Test: send "Hi is flat available?" → get intelligent AI reply | backend | AI-7 | ⬜ |
| AI-9 | Test: offer below min rent → AI deflects + escalation fires | backend | AI-7 | ⬜ |

---

### Phase 5 — Daily Digest

| ID | Task | App | Depends On | Status |
|----|------|-----|-----------|--------|
| DD-1 | `digest.model.ts` — DailyDigest schema | backend | SETUP-3 | ⬜ |
| DD-2 | `digest.service.ts` — generateAndSendDailyDigest() | backend | DD-1, AI-2, WA-1 | ⬜ |
| DD-3 | `digest.cron.ts` — node-cron job 9pm IST | backend | DD-2 | ⬜ |
| DD-4 | POST `/digest/trigger` — manual trigger for testing | backend | DD-2 | ⬜ |
| DD-5 | Test: trigger digest → co-founder receives WhatsApp summary | backend | DD-3, S-5 | ⬜ |

---

### Phase 6 — Push Notifications

| ID | Task | App | Depends On | Status |
|----|------|-----|-----------|--------|
| PN-1 | Install expo-server-sdk on backend | backend | SETUP-3 | ⬜ |
| PN-2 | `push.service.ts` — sendEscalationNotification() | backend | PN-1 | ⬜ |
| PN-3 | POST `/push/register` route — store push token | backend | PN-2 | ⬜ |
| PN-4 | Wire escalation → push notification trigger | backend | PN-2, AI-6 | ⬜ |

---

### Phase 7 — Mobile App (All Screens)

> No web admin. Everything on the Expo app.

| ID | Task | Depends On | Status |
|----|------|-----------|--------|
| MOB-1 | Auth screen (Supabase login) | SETUP-5 | ⬜ |
| MOB-2 | Today's summary screen (stats + hot leads + escalations) | MOB-1 | ⬜ |
| MOB-3 | Lead list screen (filterable by Hot/Warm/Cold/Escalation) | MOB-1 | ⬜ |
| MOB-4 | Conversation detail (chat history + open-in-WhatsApp + lead actions) | MOB-3 | ⬜ |
| MOB-5 | Push notification registration (send Expo token to backend) | MOB-1, PN-3 | ⬜ |
| MOB-6 | Notification tap → deep link to conversation screen | MOB-4, MOB-5 | ⬜ |
| MOB-7 | Property setup screen (Settings tab — all flat details form) | MOB-1, PC-2 | ⬜ |
| MOB-8 | Photo upload screen (camera roll → S3 → labeled list) | MOB-7, PC-3 | ⬜ |
| MOB-9 | Digest history screen (list of past digests + expandable summary) | MOB-1, DD-3 | ⬜ |
| MOB-10 | Manual reply from conversation screen (sends WhatsApp as co-founder) | MOB-4 | ⬜ |

---

### Phase 8 — QA Preparation (moved from Phase 9)

---

### Phase 9 — QA + Go Live

| ID | Task | Who | Status |
|----|------|-----|--------|
| QA-1 | Co-founder fills in property details via admin setup form | Co-founder | ⬜ |
| QA-2 | Upload flat photos via admin UI | Co-founder | ⬜ |
| QA-3 | End-to-end test: pretend to be tenant → message property number → verify AI replies | Both | ⬜ |
| QA-4 | Test negotiation: offer below min rent → AI deflects → co-founder gets WA ping | Both | ⬜ |
| QA-5 | Test daily digest: trigger manually → verify WhatsApp received | Both | ⬜ |
| QA-6 | Test push notification: escalation → mobile notification received | Both | ⬜ |
| QA-7 | Test mobile app: notifications tap → correct conversation opens | Both | ⬜ |
| QA-8 | Run backend in production mode on Railway | Pranjal | ⬜ |
| QA-9 | Switch Meta app from Test mode to Live mode | Pranjal | ⬜ |
| QA-10 | Go live — co-founder adds WhatsApp link to rental ads | Co-founder | ⬜ |

---

## 17. Progress Summary

| Phase | Tasks | Done | Status |
|-------|-------|------|--------|
| Phase 0 — Setup | 5 | 0 | ⬜ Not started |
| Phase 1 — Monorepo | 8 | 0 | ⬜ Not started |
| Phase 2 — WhatsApp | 5 | 0 | ⬜ Not started |
| Phase 3 — Property Config | 4 | 0 | ⬜ Not started |
| Phase 4 — AI Agent | 9 | 0 | ⬜ Not started |
| Phase 5 — Daily Digest | 5 | 0 | ⬜ Not started |
| Phase 6 — Push Notifications | 4 | 0 | ⬜ Not started |
| Phase 7 — Mobile App (all screens) | 10 | 0 | ⬜ Not started |
| Phase 8 — QA + Go Live | 10 | 0 | ⬜ Not started |
| **Total** | **57** | **0** | ⬜ |

---

*Last updated: March 22, 2026*
*Repo: `property-agent` (new standalone monorepo)*
*Phase 2 SaaS: requires Phase 1 MVP complete + co-founder's flat rented successfully as proof of concept*

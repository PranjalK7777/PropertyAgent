# Property Agent

WhatsApp AI agent for property rental inquiries — handles tenant messages 24/7, qualifies leads, and sends daily digests.

## Structure

```
property-agent/
├── apps/
│   ├── backend/     ← Fastify 5 + TypeScript + MongoDB + Gemini AI
│   └── mobile/      ← Expo SDK 52 + React Native (co-founder's app)
└── packages/
    └── types/       ← Shared TypeScript interfaces
```

## Getting Started

```bash
yarn install
yarn dev
```

## Apps

- **Backend** — WhatsApp webhook, AI agent pipeline, daily digest cron
- **Mobile** — Co-founder's app: lead dashboard, conversation viewer, push notifications

See `PROPERTY_AGENT_MONOREPO_PLAN.md` for full implementation details.

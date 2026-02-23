# Personalized Investment Progress & AI Financial Guide

This document defines the **Personalized Investment Progress & AI Financial Guide** feature for the Signalist Stock App.  
The goal is to transform the watchlist into a **context-aware financial companion** that explains stock movements clearly, neutrally, and in real time.

---

## 1. Feature Overview

### Objective
Provide users with **personalized, AI-generated insights** for pinned stocks in their watchlist, focusing purely on **price change over time** and **relevant news context**, without giving financial advice.

---

## 2. Core Definitions

### What “Progress” Means
Progress is defined **only** as **price change**, measured across three fixed timeframes:

- **7 Days (7D)**
- **30 Days (30D)**
- **Since the stock was pinned by the user**

No technical indicators, predictions, or buy/sell suggestions are included.

---

### AI Tone & Behavior
- Neutral explainer
- Calm, professional, educational
- No hype
- No financial advice
- No future price predictions

---

## 3. User Experience

### Watchlist Page Enhancements

At the bottom of the Watchlist page, display two action buttons:

1. **Download Investment Progress Report**
2. **Ask Your Financial Guide**

Both actions operate only on **pinned stocks**.

---

### 3.1 Download Investment Progress Report

#### Behavior
- Generated **every time** the button is clicked
- No caching
- Always uses latest data

#### Data Used
- Current stock price
- Price:
  - 7 days ago
  - 30 days ago
  - On pinned date
- Latest relevant Finnhub news per stock

#### Output Formats
- **Downloadable PDF**
- **Email-style summary layout** (inside the PDF)

#### Report Content (Per Stock)
- Stock name & symbol
- Price changes (7D, 30D, Since pinned)
- Plain-English explanation of price movement
- Relevant recent news that may explain the change
- Clear disclaimer (informational only)

---

### 3.2 Ask Your Financial Guide (Chat)

#### Chat Capabilities
Users can ask questions like:
- “Why did Apple move this week?”
- “How has Microsoft performed since I pinned it?”
- “What news affected my pinned stocks recently?”

#### AI Context Automatically Injected
- Pinned stock symbols
- Price deltas (7D, 30D, Since pinned)
- Recent Finnhub news headlines & summaries
- User profile (risk tolerance, goals, country)

---

## 4. Backend Architecture

### Data Sources
- **MongoDB** – users, watchlist, chat sessions
- **Finnhub API** – prices, company info, news
- **Gemini AI (gemini-2.5-flash-lite)** – explanations & chat
- **Next.js App Router** – API routes & server actions

---

## 5. Database Schemas (Mongoose)

### Watchlist (Extended)
```ts
{
  userId: ObjectId,
  symbol: string,
  pinned: boolean,
  pinnedAt: Date,   // Required for since-pinned analysis
  addedAt: Date
}

InvestmentReport (Ephemeral)

Can be generated → converted to PDF → discarded

{
  userId: ObjectId,
  symbols: string[],
  generatedAt: Date,
  timeframe: ["7D", "30D", "SINCE_PIN"],
  content: string
}

ChatSession
{
  userId: ObjectId,
  contextSymbols: string[],
  messages: [
    {
      role: "user" | "assistant",
      content: string,
      timestamp: Date
    }
  ]
}


6. API Routes (Next.js App Router)
Reports
POST /api/reports/generate
GET  /api/reports/latest


Chat
POST /api/chat/message
GET  /api/chat/context



7. Gemini AI – System Prompt (Critical)
You are a neutral financial explainer.

You explain stock price movements using factual price data and recent news.
You do NOT give investment advice.
You do NOT recommend buying or selling.
You do NOT predict future prices.

You explain:
- What changed
- Over what time period
- What recent news may have influenced the movement

Always reference:
- 7-day price change
- 30-day price change
- Change since the user pinned the stock

Your tone is calm, professional, and educational.



8. UI & Theming Constraints

Must match existing Signalist theme:

Tailwind CSS v4

Shadcn UI

Dark mode

Minimal, high-contrast typography

Chat UI should feel like:

“Talking to a calm financial analyst, not a hype-driven bot.”



9. Access Model

Free feature

No paywall

No usage limits (initially)

Can be rate-limited later at API level if required


10. Build Order (Recommended)
Phase 1 – Core MVP

Extend watchlist schema with pinnedAt

Fetch historical prices for comparisons

Finnhub news integration per symbol

Gemini-based explanation generation

PDF report generation

Context-aware chat

Phase 2 – Optional Enhancements

Multi-stock comparisons in chat

Regenerate report button

Inline news references

Weekly auto-summary emails


11. Key Principles

Explain, don’t advise

Show numbers before words

Context > speculation

Trust over hype


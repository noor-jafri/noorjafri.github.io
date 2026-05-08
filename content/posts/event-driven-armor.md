# Forging Event-Driven Armor

Building large systems on AWS without losing your mind tends to come down to one rule: **stop calling each other directly**. Once services start chatting via events instead of requests, a lot of pain falls away.

## Why events

Direct calls couple services. If service B is down, service A is sad. Events flip the relationship: A publishes, B consumes when it can. The bus absorbs the asymmetry.

A few patterns I keep reaching for:

### 1. EventBridge as the front door

EventBridge is the workhorse. Producers fire events, rules route them, consumers don't know each other exist. The schema registry catches breaking changes before they ship.

### 2. Idempotency keys, always

Retries happen. Duplicates happen. Every consumer should treat itself as if it'll be invoked twice for the same event — store an idempotency key (often the event ID) and bail early on a repeat.

### 3. Dead-letter queues are not optional

When a consumer gives up, the event has to go *somewhere*. A DLQ + alarm + a rebroadcaster is the difference between "we lost data on March 4" and "we replayed it during lunch."

### 4. Schema-first thinking

Events are a contract. Treat them like a public API. Version them. Don't add required fields silently. Use `*Updated` events with the full new state — your consumers will thank you.

## What it costs you

Eventual consistency. You can't `select` your way out of an async system. You either embrace it (with sagas, projections, idempotent reads) or you fight it the rest of your career.

## What you get back

A system where any one piece can fall over and the rest keeps walking.

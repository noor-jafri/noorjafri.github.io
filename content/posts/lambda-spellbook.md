# The Lambda Spellbook

A short list of habits that keep my serverless functions out of the on-call rotation.

## 1. Make every handler idempotent

> *Two retries should not become two payments.*

Use the message ID as the idempotency key. Store it in DynamoDB with a TTL. First check, then act.

```python
def handler(event, ctx):
    key = event["id"]
    if seen(key):
        return {"status": "duplicate"}
    do_the_thing(event)
    mark_seen(key)
```

## 2. Set timeouts smaller than upstream timeouts

If your caller times out at 30s, your Lambda should time out at 25s and fail fast. Otherwise you'll keep paying for work nobody is waiting for.

## 3. Cold-starts are not a tragedy

Most APIs don't need provisioned concurrency. Most APIs do need a handler that doesn't import 200MB of packages on the cold path. Lazy-load the heavy stuff.

## 4. Prefer batch processing where possible

`SQS → Lambda` with batch size > 1 reduces invocations dramatically. Just remember partial-batch failure is a real thing — return `batchItemFailures` correctly.

## 5. Logs are structured or they're useless

```python
log.info(json.dumps({"event": "order_processed", "order_id": id, "ms": dt}))
```

`json.dumps` once. Search forever.

## 6. Dead letters point home

DLQ on every async consumer. Alarm on the DLQ depth. Have a one-click rebroadcaster.

## 7. Have a poison-pill plan

Some events will *never* succeed. They go in the freezer (S3 archive), not in an infinite retry loop. Move on.

— *more notes coming as I find them*

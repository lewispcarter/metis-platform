# Webhooks

## Twilio Inbound SMS

`POST /webhooks/twilio/sms` records inbound SMS messages and attempts coverage response automation.

Expected Twilio fields:

```text
From
To
Body
MessageSid
AccountSid
SmsStatus
```

The endpoint matches the sender against recent outbound coverage communications. Replies beginning with `YES`, `Y`, or `ACCEPT` accept the active offer. Replies beginning with `NO`, `N`, `REJECT`, or `DECLINE` reject it. Unmatched messages are still recorded and audited.

## Twilio Inbound Voice

`POST /webhooks/twilio/voice` converts inbound calls into operational communication events.

Expected Twilio fields:

```text
From
To
CallSid
CallStatus
AccountSid
```

## Tenant Resolution

Webhook requests are unauthenticated provider ingress. Tenant context resolves from request `organizationId` first, then `TWILIO_WEBHOOK_ORGANIZATION_ID`.

Production deployments should replace this with signed Twilio request validation plus phone-number-to-organization routing before exposing public endpoints.

## v15 Webhook Ingress Security

Inbound Twilio webhooks now pass through three production safety checks before the platform mutates operational state.

### 1. Signature Validation

`TwilioSignatureService` validates the `X-Twilio-Signature` header using the configured `TWILIO_AUTH_TOKEN`.

Required production configuration:

```env
TWILIO_AUTH_TOKEN=replace-me
WEBHOOK_PUBLIC_BASE_URL=https://your-public-api-domain.com
```

`WEBHOOK_PUBLIC_BASE_URL` ensures signature validation uses the same public URL Twilio called, even when the API is behind a proxy or container platform.

Local-only bypass:

```env
TWILIO_WEBHOOK_SIGNATURE_BYPASS=true
```

This bypass is ignored in production.

### 2. Phone Number Tenant Routing

`WebhookRouteService` resolves the destination Twilio number to the correct organization through the `inbound_webhook_route` table.

Each active route maps:

```text
provider + inbound_address → organization_id
```

Example:

```text
TWILIO +15551234567 → organization-a
```

Production webhooks are rejected when no active route exists.

### 3. Controlled Development Fallbacks

For local demos only, webhook payload `organizationId` or `TWILIO_WEBHOOK_ORGANIZATION_ID` may resolve tenant context when no phone route exists. These fallbacks are disabled in production.

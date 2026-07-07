# MQTT + AWS IoT Core Guide (Project Context)

This note explains:

1. how MQTT works in general
2. how this project connects to AWS IoT Core
3. what to check if it previously worked but now fails

## Quick MQTT concepts

- **Broker**: AWS IoT Core (message hub)
- **Client**: your server-side Node runtime in this app
- **Topic**: routing path, for example `cmd/{thingId}/unlock`
- **Publish**: send a payload to a topic
- **Subscribe**: listen to a topic and receive payloads
- **QoS 1** (`AtLeastOnce`): delivery is retried until ack, so duplicates are possible

## How this project is wired

Current implementation is in `src/iot/index.ts`.

### 1) Connection setup

- Uses `aws-iot-device-sdk-v2`
- Uses MQTT over **WebSocket (WSS)** on port `443`
- Uses AWS credentials from `fromNodeProviderChain()` (EC2 role / env / shared credentials)
- Builds config with:
  - endpoint: `a1lgre51uh3lnz-ats.iot.ap-east-1.amazonaws.com`
  - client id: `webapp-${Date.now()}`
  - region in credentials call: `ap-east-1`

Important: with temporary credentials (EC2 role/STS), `sessionToken` is required.

### 2) Publish unlock command

Server function: `publishUnlock`

- Topic: `cmd/${thingId}/unlock`
- Payload shape:

```json
{
  "request_id": "tx_001",
  "cells": [1, 2],
  "timestamp": 1717320000000
}
```

- QoS: `AtLeastOnce`

### 3) Subscribe to door state

Server functions: `subscribeToDoorState` and `unsubscribeFromDoorState`

- Topic: `state/${thingId}/door`
- On message:
  - payload JSON is parsed
  - data is forwarded to websocket clients through `broadcastToClients(...)`

### 4) UI test page

Route: `src/routes/_authenticated/test.tsx`

- Enter `thingId` and selected doors to call `publishUnlock`
- Subscribe button calls `subscribeToDoorState`
- Browser then opens a websocket connection to `/ws` (host with port `3003`) to receive live updates

## AWS permission model you need (both layers)

Your older note `notes/ec2-to-iot.md` is correct: you usually need both IAM and IoT policy permissions.

1. **IAM role policy** (identity policy on EC2 role / runtime principal)
   - `iot:Connect`
   - `iot:Publish`
   - `iot:Subscribe`
   - `iot:Receive`

2. **IoT policy** (IoT Core-side authorization)
   - Connect permission
   - Topic/topicfilter permissions for publish/subscribe/receive on your topic patterns

If one layer is missing or mismatched, connect/publish/subscribe may fail.

## Credential resolution in this code

`fromNodeProviderChain()` checks credential sources in order, including:

- env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`)
- shared credentials/config (`~/.aws`)
- ECS task role
- EC2 instance metadata role
- SSO/web identity sources

In production on EC2, it should normally resolve via instance role.

## Common failure points (when it worked before)

1. **Wrong endpoint**
   - Must be your account IoT Data ATS endpoint in the same region (`ap-east-1` here).

2. **Region mismatch**
   - Credentials signing region and IoT endpoint region must align.

3. **Expired/rotated temporary credentials**
   - If relying on STS/role credentials, ensure session token is present and fresh.

4. **Policy drift**
   - IAM role lost actions, or IoT policy no longer attached / too restrictive topic ARN.

5. **Topic mismatch**
   - Device and server must use exactly matching topics:
     - publish command: `cmd/{thingId}/unlock`
     - consume state: `state/{thingId}/door`

6. **Client ID collisions**
   - MQTT client IDs must be unique per active connection. This code uses timestamp, which is usually fine.

7. **Network egress / firewall**
   - WebSocket to IoT Core uses 443; blocked egress can break connectivity.

## Minimal verification checklist

- Confirm endpoint:
  - `aws iot describe-endpoint --endpoint-type iot:Data-ATS --region ap-east-1`
- Confirm runtime identity:
  - `aws sts get-caller-identity`
- Confirm credentials are actually resolving where app runs.
- Confirm IAM and IoT policies still include required actions/resources.
- Publish test from app route `/_authenticated/test` with known `thingId`.
- Confirm device actually subscribes to `cmd/{thingId}/unlock`.
- Confirm device publishes state to `state/{thingId}/door`.

## Suggested small improvement (optional)

Move hardcoded endpoint to env var to avoid code changes per environment:

- `AWS_IOT_ENDPOINT=a1lgre51uh3lnz-ats.iot.ap-east-1.amazonaws.com`

Then read it in `src/iot/index.ts` and throw a clear startup error if missing.

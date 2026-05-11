# Assistant Workflow API

## Purpose

This document defines the minimum backend API surface needed to make the
assistant-driven sales workflow deterministic.

The assistant should interpret requests and collect missing fields, but the
backend should own:

- record creation
- workflow state transitions
- notifications
- approval decisions
- idempotency

## Core principle

After the user confirms an action, the assistant should call a concrete API
endpoint and receive a concrete result.

The assistant should not be the source of truth for workflow state.

## Primary workflow

1. Client submits a service request.
2. Admin receives a notification and reviews the request.
3. Assistant or admin creates the linked opportunity and proposal.
4. Admin assigns one or more reps to the request.
5. Client accepts or rejects the assigned rep set.
6. If client accepts, the assigned rep receives the proposal/spec package.
7. Rep accepts or rejects the assignment.
8. Admin sees the full state on one timeline.

## Required entities

### `service_requests`

- `id`
- `tenant_id`
- `client_id`
- `submitted_by_user_id`
- `title`
- `description`
- `request_type`
- `status`
- `priority`
- `created_at`
- `updated_at`
- `source`

Suggested statuses:

- `submitted`
- `under_review`
- `proposal_prepared`
- `awaiting_client_assignment_approval`
- `client_rejected_assignment`
- `client_approved_assignment`
- `awaiting_rep_acceptance`
- `rep_rejected_assignment`
- `active`
- `closed`
- `cancelled`

### `request_assignments`

- `id`
- `service_request_id`
- `representative_user_id`
- `assigned_by_user_id`
- `status`
- `decision_note`
- `created_at`
- `updated_at`

Suggested statuses:

- `pending_client_approval`
- `client_rejected`
- `client_approved`
- `pending_rep_response`
- `rep_rejected`
- `rep_accepted`

### `workflow_events`

- `id`
- `tenant_id`
- `service_request_id`
- `actor_user_id`
- `actor_type`
- `event_type`
- `payload_json`
- `created_at`

This is the audit trail and notification feed source.

### Linked business records

The workflow should link to existing domain records instead of duplicating them:

- `opportunity_id`
- `proposal_id`
- `pricing_request_id`
- `contract_id`

These can live on `service_requests` or a separate linking table.

## Minimum endpoints

### Client request entry

`POST /api/service-requests`

Creates the initial client request.

Request body:

```json
{
  "clientId": "c1",
  "title": "Need a refrigeration operations proposal",
  "description": "We need a proposal covering rollout, pricing, and implementation scope.",
  "requestType": "service_proposal",
  "priority": "high"
}
```

Response:

```json
{
  "id": "req_123",
  "status": "submitted"
}
```

### Admin request queue

`GET /api/service-requests?status=submitted,under_review`

Returns the admin review queue.

### Request detail / timeline

`GET /api/service-requests/{requestId}`

Returns:

- request details
- linked client
- linked opportunity/proposal/pricing request
- assignments
- workflow events
- unread notification state

### Admin acknowledge / review start

`POST /api/service-requests/{requestId}/review`

Moves the request to `under_review`.

### Create or link opportunity

`POST /api/service-requests/{requestId}/opportunity`

Creates a new opportunity from the request or links an existing one.

Request body:

```json
{
  "mode": "create",
  "title": "Boxfusion refrigeration rollout",
  "estimatedValue": 250000,
  "expectedCloseDate": "2026-08-29",
  "stage": "Qualified",
  "ownerId": "user_45"
}
```

### Create or link proposal

`POST /api/service-requests/{requestId}/proposal`

Creates a proposal tied to the workflow.

Request body:

```json
{
  "mode": "create",
  "title": "Boxfusion commercial proposal",
  "description": "Initial curated proposal for review.",
  "validUntil": "2026-08-29",
  "currency": "ZAR"
}
```

### Create pricing request

`POST /api/service-requests/{requestId}/pricing-request`

Creates the pricing request when needed.

### Assign reps

`POST /api/service-requests/{requestId}/assignments`

Request body:

```json
{
  "representativeUserIds": ["user_10", "user_11"],
  "note": "Best fit for refrigeration rollout and commercial onboarding."
}
```

This should:

- create assignment records
- change request status to `awaiting_client_assignment_approval`
- emit workflow events
- create client-facing notifications

### Client approve or reject assigned reps

`POST /api/service-requests/{requestId}/client-decision`

Request body:

```json
{
  "decision": "approve",
  "assignmentIds": ["assign_1", "assign_2"],
  "note": "These reps look appropriate."
}
```

This should:

- update assignment status
- update request status
- emit workflow events
- notify assigned reps

### Rep accept or reject assignment

`POST /api/service-requests/{requestId}/rep-decision`

Request body:

```json
{
  "assignmentId": "assign_1",
  "decision": "accept",
  "note": "Ready to take this on."
}
```

This should:

- update assignment state
- update request state when all required approvals are satisfied
- notify admin

### Send workflow message

`POST /api/service-requests/{requestId}/messages`

This is the real send endpoint the assistant should call.

Request body:

```json
{
  "channel": "internal",
  "recipientUserIds": ["user_10"],
  "subject": "New request ready for review",
  "content": "The client approved your assignment. Review the proposal and scope."
}
```

The backend can later fan this out to email, Teams, Slack, WhatsApp, or an
internal inbox.

### Notifications

`GET /api/notifications`

Returns the current user's notifications.

`POST /api/notifications/{notificationId}/acknowledge`

Lets the red-alert style admin notification be dismissed without mutating the
business record itself.

## Assistant-specific execution contract

The assistant should work against deterministic workflow actions, not open-ended
CRUD wherever possible.

### Good assistant action

- parse user intent
- collect missing fields
- call `POST /api/service-requests/{id}/proposal`
- report created proposal ID and status

### Bad assistant action

- keep all state in chat
- ask for confirmation repeatedly
- rely on model availability to remember what to do next

## Idempotency

Mutation endpoints should support an idempotency key header.

Suggested header:

`Idempotency-Key: <uuid>`

This is required for assistant-driven flows so retries do not create duplicate:

- opportunities
- proposals
- assignments
- messages

## Suggested notification rules

### Admin

Notify when:

- client submits a new request
- client approves or rejects assignments
- rep accepts or rejects assignment

### Client

Notify when:

- proposal is ready
- reps are assigned
- admin sends a clarification request

### Rep

Notify when:

- client has approved assignment
- proposal/spec package is ready for review

## Minimum frontend impact

The frontend should stop treating notes as the workflow source of truth for this
path.

Instead:

- admin queue reads from `service_requests`
- client contacts/assignment views read from `request_assignments`
- notification badge reads from `notifications`
- assistant actions call workflow endpoints, not mock note mutations

## Recommended implementation order

1. `service_requests`
2. `request_assignments`
3. `workflow_events`
4. `notifications`
5. `service_requests/{id}/opportunity`
6. `service_requests/{id}/proposal`
7. client decision endpoint
8. rep decision endpoint
9. send message endpoint
10. assistant integration against these endpoints

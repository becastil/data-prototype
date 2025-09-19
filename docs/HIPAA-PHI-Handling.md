# HIPAA / PHI Handling Guide

This document describes how the healthcare analytics dashboard protects protected health information (PHI) in accordance with HIPAA-aligned practices.

## Architecture Overview

1. **Server-issued secure records** (`POST /api/secure-records`)
   - Payloads containing PHI are encrypted with AES-256-GCM using the `PHI_ENCRYPTION_KEY`.
   - The server stores the encrypted blob and de-identified representation in SQLite (`phi_records`).
   - A short-lived access token (hashed with `PHI_TOKEN_SECRET`) is returned to the client alongside sanitized data.
2. **Client token storage**
   - Tokens are stored in `sessionStorage` (never PHI) with their ISO expiry timestamp.
   - Hydration requests (`GET /api/secure-records/:token`) return only sanitized data; expired tokens are automatically revoked.
3. **Access logging**
   - Every PHI access is recorded via `POST /api/compliance/access-log` and persisted in `phi_access_log` with immutable timestamps.
   - Compliance teams can retrieve audit trails and summaries with `GET /api/compliance/access-log?summary=true`.

## Security Controls

| Control | Description |
| --- | --- |
| Encryption at rest | AES-256-GCM via Node `crypto` (`encryptPHIPayload` helpers). |
| Token hashing | Tokens are HMAC-SHA256 hashed with `PHI_TOKEN_SECRET`; only hashes are stored. |
| Data minimization | `deidentifySensitivePayload` masks names, hashes identifiers, and redacts direct identifiers before persistence. |
| Retention | Token TTL is clamped between 1 minute and 24 hours; expired records are purged on each write. |
| Access logging | Immutable timestamps, resource/action metadata, and optional justification captured per event. |
| Automated validation | `npm test` executes `__tests__/phi-security.test.ts` to assert encryption, de-identification, token expiry, and audit logging. |

## Environment Configuration

Set the following variables for all deployments:

```bash
PHI_ENCRYPTION_KEY=<32+ character high-entropy secret>
PHI_TOKEN_SECRET=<32+ character secret distinct from encryption key>
PHI_DB_PATH=/var/data/phi-storage.sqlite # optional (defaults to ./data)
```

- Keys should be rotated routinely and stored in a secure secrets manager.
- When `PHI_DB_PATH` is not provided, the app creates `data/phi-storage.sqlite` automatically.

## Operational Checklist

- [ ] Enable HTTPS for all environments.
- [ ] Configure `PHI_ENCRYPTION_KEY` and `PHI_TOKEN_SECRET` before deploying.
- [ ] Schedule regular exports of `/api/compliance/access-log?summary=true` for compliance review.
- [ ] Run `npm test` in CI to enforce encryption, token TTL, and access logging policies.
- [ ] Monitor disk usage of the SQLite file and rotate expired tokens if needed.

## Incident Response

1. **Token revocation** – call `DELETE /api/secure-records/:token` or clear the session.
2. **Key rotation** – generate new secrets, redeploy, and migrate any necessary records (old records require the previous key to decrypt).
3. **Audit extraction** – use the compliance endpoint to identify affected records/users.
4. **Data purge** – remove rows from `phi_records` (e.g., via a retention job) once regulatory retention periods expire.

For further details see `app/lib/server/security.ts`, `app/lib/server/phi-storage.ts`, and the automated tests in `__tests__/phi-security.test.ts`.

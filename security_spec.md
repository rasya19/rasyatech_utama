# Security Specification for RasyaComp

## Data Invariants
1. Only authorized admins can modify any data.
2. Public users can read all configuration, services, and laptop data.
3. Configuration document must contain valid contact strings.

## The Dirty Dozen Payloads
1. Unauthenticated write to `settings/config`.
2. Authenticated non-admin write to `settings/config`.
3. Creating a laptop with a giant description (resource exhaustion).
4. Deleting a service without admin rights.
5. Updating a laptop's price to an invalid type.
6. Spoofing admin status via client claims.
7. Injecting shell/script into string fields.
8. Modifying `createdAt` of a laptop item.
9. Reading private user data (though not implemented yet, guard it).
10. Rapidly updating a document (rate limit simulation via rules logic if possible, but mainly schema validation).
11. Bypassing whitelisted keys in config update.
12. Setting `isAvailable` to a non-boolean value.

## Test Runner (Conceptual)
All write operations from non-admin accounts must return PERMISSION_DENIED.
All read operations from any account must succeed.

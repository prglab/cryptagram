# Cryptagram Migration Plan

## Purpose

This document turns the Phase 0 audit into an implementation roadmap with explicit PR boundaries.

The plan is designed to preserve the original research vision while avoiding an uncontrolled rewrite.

## Guiding Rules

- No broad rewrite before executable baselines exist.
- Preserve the original local-first privacy model.
- Chrome MV3 is the flagship deliverable.
- Server-side code must not become part of the privacy-critical path.
- All support claims must be backed by tests or measurements.

## Architecture Decision Summary

Primary recommendation:

- implement a versioned shared core in Rust,
- compile it to WebAssembly for browser and extension use,
- and reuse it natively on mobile where practical.

Fallback rule:

- until the new core exists, the Closure implementation is the behavioral reference.

## PR Sequence

### PR 1: Phase 0 Documentation Baseline

Scope:

- add architecture audit,
- add threat model,
- add migration plan,
- add support matrix,
- clarify that no rewrite has happened yet.

Exit criteria:

- repo contains authoritative Phase 0 docs,
- legacy areas are labeled,
- next milestones are concrete.

### PR 2: Fixture Inventory and Legacy Baseline Capture

Scope:

- identify sample encoded images and demo fixtures already in the repo,
- document protocol variants to preserve initially,
- produce a small checked-in corpus for `bacchant` and `aesthete`,
- record current limitations and ambiguities.

Suggested outputs:

- `fixtures/` or `testdata/` layout,
- manifest of fixture origin and expected results,
- compatibility notes for legacy images.

Exit criteria:

- at least one deterministic fixture set exists for the current reference behavior.

### PR 3: Golden Vector Harness

Scope:

- add golden vectors for password KDF behavior,
- add golden vectors for encrypt/decrypt,
- add codec round-trip vectors,
- add safe failure vectors for wrong password and corrupted payloads.

Suggested outputs:

- versioned JSON or binary vector files,
- one harness that can validate vectors independently of UI,
- explicit format version markers.

Exit criteria:

- vectors are runnable in CI,
- legacy compatibility status is documented,
- failure behavior is deterministic and tested.

### PR 4: JPEG Recoverability Harness

Scope:

- build an empirical harness that:
  - generates payloads,
  - encodes them into Cryptagram images,
  - recompresses at multiple JPEG quality levels,
  - decodes and measures recovery success/failure,
  - reports bits-per-pixel and failure modes.

Suggested outputs:

- CLI or test command,
- machine-readable report output,
- fixed seeded mode for deterministic CI coverage,
- broader randomized mode for research runs.

Exit criteria:

- harness exists and runs locally,
- claims about JPEG robustness can cite measured results.

### PR 5: Shared Core Skeleton

Scope:

- create the new shared core package,
- define the versioned envelope format,
- implement only the narrow API surface first,
- do not yet replace all UI surfaces.

Core API:

- `encryptPayload`
- `decryptPayload`
- `encodeCryptagram`
- `decodeCryptagram`
- `detectCryptagram`

Exit criteria:

- core package builds,
- core passes golden vectors for at least one supported protocol version,
- no UI migration required yet.

### PR 6: Chrome MV3 Shell

Scope:

- create a new MV3 extension shell,
- add service worker, content script, popup/options UI,
- use local fixture pages first,
- wire decryption through the shared core,
- implement right-click `Decrypt Cryptagram`.

Exit criteria:

- local fixture page supports in-place decryption,
- wrong-password and unsupported-image errors are safe and clear,
- no remote code,
- no server dependency for decryption.

### PR 7: Extension E2E and Demo Page

Scope:

- add deterministic local demo page,
- add Playwright or equivalent extension E2E tests,
- cover context menu flow, prompt flow, and in-place replacement.

Exit criteria:

- Chrome flagship workflow is automatically tested,
- demo page is usable for manual QA and CI.

### PR 8: Server Disposition

Scope:

- archive or remove legacy dynamic server code,
- preserve only static support surfaces,
- optionally add a minimal static site or public fixture gallery,
- explicitly document that client-side Cryptagram works without a server.

Exit criteria:

- no active server-side encryption/decryption paths,
- no open proxy remains in supported paths,
- static-only posture is documented.

### PR 9: CI Foundation

Scope:

- add GitHub Actions,
- build and test the shared core,
- run golden vectors,
- run JPEG recoverability smoke coverage,
- run Chrome extension E2E tests,
- add linting and dependency audit where manifests exist.

Exit criteria:

- CI is green for supported surfaces,
- unsupported legacy surfaces are clearly excluded rather than silently failing.

### PR 10: Android Modern Skeleton

Scope:

- create Kotlin + Compose app shell,
- wire in shared core or test-vector-compatible bridge,
- support local encode/decode and export flows,
- add unit tests.

Exit criteria:

- Android builds with a modern toolchain,
- can process fixture vectors locally.

### PR 11: iOS Modern Skeleton

Scope:

- create Swift + SwiftUI app shell,
- wire in shared core or test-vector-compatible bridge,
- support local encode/decode and export flows,
- add XCTest coverage.

Exit criteria:

- iOS builds with a modern toolchain,
- can process fixture vectors locally.

### PR 12: Hardening

Scope:

- dependency audit,
- performance profiling,
- accessibility review,
- packaging and release notes,
- user-facing limitations documentation.

Exit criteria:

- README commands are accurate,
- supported surfaces have documented build and test steps,
- limitations are explicit and honest.

## Suggested Issue Buckets

### Core

- Define v1 envelope format
- Implement authenticated encryption
- Port `bacchant` behavior behind tests
- Decide initial legacy compatibility scope

### Testing

- Create golden vectors
- Add recompression harness
- Add corruption and wrong-password cases
- Add codec detection tests

### Extension

- MV3 service worker shell
- Context menu action
- Credential UX
- In-place image replacement
- Fixture-driven E2E coverage

### Server / Static

- Archive PHP proxy
- Archive Tornado app
- Remove remote logging
- Remove third-party analytics by default

### Mobile

- Android Compose shell
- iOS SwiftUI shell
- Shared-core integration strategy

## Supported Claims Policy

No feature may be claimed as supported unless backed by tests or measurements.

Examples:

- JPEG recompression support requires harness results.
- Cropping support requires dedicated tests.
- Resizing or rotation support requires dedicated tests.
- Social-network DOM support requires adapter-specific validation.

## README Requirements for Later Phases

When implementation begins, the README must eventually document exact commands for:

- installing dependencies,
- building the shared core,
- running unit tests,
- running codec and recoverability tests,
- running Chrome extension tests,
- running Android tests,
- running iOS tests,
- and running any retained server/static tests.

## Definition of Done Checkpoints

### End of Phase 1

- core vectors pass,
- codec round trips pass,
- JPEG harness exists.

### End of Phase 2

- MV3 extension builds,
- local demo supports in-place decrypt,
- extension E2E passes.

### End of Phase 3

- dynamic server code is removed, archived, or clearly unsupported,
- client-side Cryptagram works without a server.

### End of Phase 4

- Android and iOS have modern skeletons wired to the shared core or vectors,
- or they are explicitly deferred with tracked issues.

### End of Phase 5

- CI is green,
- README is accurate,
- security/privacy posture is documented,
- release packaging is clear.

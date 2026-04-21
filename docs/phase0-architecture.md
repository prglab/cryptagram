# Cryptagram Phase 0 Architecture Audit

## Status

This document captures the Phase 0 audit for the legacy `cryptagram` repository as of April 20, 2026.

Phase 0 is audit-only. Its purpose is to identify:

- the authoritative implementation of the Cryptagram model,
- the current repository layout and dependency risks,
- what must be preserved for compatibility,
- what should be archived or retired,
- and the recommended modernization path.

This document is intentionally conservative. It does not authorize a broad rewrite without executable baselines.

## Project Goal

Cryptagram's original product vision is still the correct one:

- encrypt a private image locally,
- encode the encrypted payload into an image representation designed to survive common social-network image transformations, especially JPEG recompression,
- and decrypt it in place through a browser extension without sending credentials or cleartext image data to a Cryptagram backend.

The Chrome extension experience is the flagship deliverable.

## Repository Map

### Authoritative algorithm reference

The current center of gravity is the Closure-era browser implementation under `closure/src/cryptagram`.

Key files:

- [closure/src/cryptagram/encoder.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/encoder.js:37)
- [closure/src/cryptagram/decoder.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/decoder.js:13)
- [closure/src/cryptagram/codec.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/codec.js:6)
- [closure/src/cryptagram/cipher.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/cipher.js:6)
- [closure/src/cryptagram/protocols/bacchant/codec.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/bacchant/codec.js:12)
- [closure/src/cryptagram/protocols/aesthete/codec.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/aesthete/codec.js:12)
- [closure/src/cryptagram/protocols/chequer/codec.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/chequer/codec.js:12)

This is the best available reference for the end-to-end behavior:

1. take a JPEG or image data URL,
2. encrypt the base64 payload,
3. map the encrypted payload into pixels,
4. JPEG-encode the result,
5. detect and decode the pixel representation,
6. decrypt and replace the image in place.

### Extension/runtime surfaces

The best extension/runtime source of truth is also in the Closure tree.

Key files:

- [closure/src/cryptagram/content.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/content.js:36)
- [closure/src/cryptagram/extension.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/extension.js:62)
- [closure/src/cryptagram/loader.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/loader.js:191)
- [closure/src/cryptagram/container/container.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/container/container.js:8)
- [closure/src/cryptagram/media/facebook.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/media/facebook.js:43)
- [closure/src/cryptagram/media/googleplus.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/media/googleplus.js:31)
- [closure/src/cryptagram/media/web.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/media/web.js:28)
- [closure/static/chrome-extension/manifest.json](/Users/tierney/repos/cryptagram/closure/static/chrome-extension/manifest.json:1)

The older trees under `extension/chrome`, `extension/firefox`, and `extension/chrome-pyjamas` are historical implementations, not the recommended modernization base.

### Historical secondary references

These are useful for archaeology and compatibility understanding, but they are not the recommended canonical implementation going forward:

- Desktop Python tooling in [desktop](/Users/tierney/repos/cryptagram/desktop)
- Android prototype implementation in [android/CryptagramAndroid](/Users/tierney/repos/cryptagram/android/CryptagramAndroid)
- iOS prototype in [ios](/Users/tierney/repos/cryptagram/ios)
- Experimental JPEG/codec research in [experimental](/Users/tierney/repos/cryptagram/experimental)

### Static/demo surfaces

- Product/demo site in [site](/Users/tierney/repos/cryptagram/site)
- Site encoder in [site-encoder](/Users/tierney/repos/cryptagram/site-encoder)
- Closure demo output in [closure/static/demo](/Users/tierney/repos/cryptagram/closure/static/demo)

### Legacy and likely archival areas

The following should be treated as legacy until proven otherwise:

- [extension/firefox](/Users/tierney/repos/cryptagram/extension/firefox)
- [extension/chrome-pyjamas](/Users/tierney/repos/cryptagram/extension/chrome-pyjamas)
- [experimental/lib/src/cryptopp](/Users/tierney/repos/cryptagram/experimental/lib/src/cryptopp)
- [server/apache-php](/Users/tierney/repos/cryptagram/server/apache-php)
- [server/tornado](/Users/tierney/repos/cryptagram/server/tornado)
- [lib](/Users/tierney/repos/cryptagram/lib)

## Build and Dependency Audit

The repository contains multiple incompatible build systems from different eras.

### JavaScript / Closure

- Closure build scripts require plovr and local jars via hardcoded paths in [closure/build_extension.sh](/Users/tierney/repos/cryptagram/closure/build_extension.sh:20) and [closure/README.md](/Users/tierney/repos/cryptagram/closure/README.md:8).
- The build references vendored legacy dependencies including SJCL, MD5, Downloadify, swfobject, jszip, and jpegmeta via [closure/cryptagram-demo-config.js](/Users/tierney/repos/cryptagram/closure/cryptagram-demo-config.js:3).
- Current extension manifests are Manifest V2 and not acceptable as the modern target.

### Python

- Desktop docs explicitly target Python 2.7 in [desktop/README.md](/Users/tierney/repos/cryptagram/desktop/README.md:8).
- Desktop packaging still depends on Python-2-era libraries in [desktop/setup.py](/Users/tierney/repos/cryptagram/desktop/setup.py:14), including `PyV8`, `Crypto`, `py2app`, and old platform assumptions.
- Server code is also Python 2 style, including `urllib2` usage in [server/tornado/main.py](/Users/tierney/repos/cryptagram/server/tornado/main.py:6).

### Android

- Android uses an Eclipse/Ant-era project structure with `project.properties` and an old manifest in [android/CryptagramAndroid/AndroidManifest.xml](/Users/tierney/repos/cryptagram/android/CryptagramAndroid/AndroidManifest.xml:1).
- Tests are JUnit 3 style in [android/CryptagramTests/src/org/prglab/cryptagram/test/EncodingTest.java](/Users/tierney/repos/cryptagram/android/CryptagramTests/src/org/prglab/cryptagram/test/EncodingTest.java:1).

### iOS

- iOS is an Objective-C + JavaScriptCore prototype in [ios/Cryptogram](/Users/tierney/repos/cryptagram/ios/Cryptogram).
- It is not currently positioned as a modern Swift/SwiftUI app.

### Native C++

- [lib/Makefile](/Users/tierney/repos/cryptagram/lib/Makefile:2) hardcodes a non-repo `GTEST_ROOT`.
- [lib/cryptogram.cc](/Users/tierney/repos/cryptagram/lib/cryptogram.cc:17) is a stub, so `lib` is not the shared core we want it to be.

## Current Build / Test Reality

The repo does not currently have a truthful green baseline.

Observed during audit:

- `make -C lib test` fails because `gtest/gtest.h` is not available through the hardcoded path in [lib/Makefile](/Users/tierney/repos/cryptagram/lib/Makefile:2).
- `make -C experimental` succeeds, but that does not validate the product core.
- `python3 -m pytest desktop` cannot run because `pytest` is not installed in the current environment.
- The machine does not provide `python`, only `python3`.
- `xcodebuild` is unavailable because full Xcode is not installed.

Interpretation:

- the repo is not reproducibly buildable from a fresh checkout,
- the checked-in tests are partial and inconsistent,
- and much of the apparent test surface belongs to vendored third-party code, not Cryptagram itself.

## Protocol Audit

The repository currently contains multiple protocol families.

### Bacchant

Appears to be the most important current protocol.

Properties:

- 2x2 grayscale blocks
- base64 characters mapped into octal symbols
- explicit payload-length prefix
- random fill for the unused tail of the encoded image

Relevant files:

- [closure/src/cryptagram/protocols/bacchant/codec.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/bacchant/codec.js:12)
- [closure/src/cryptagram/protocols/bacchant/cipher.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/bacchant/cipher.js:19)

Risk:

- integrity is wrapped with MD5 over `iv|salt|ct`, which should not be preserved as a modern primitive.

### Aesthete

An older but still coherent grayscale block codec.

Properties:

- 2x2 grayscale blocks
- 8-level symbol alphabet plus black sentinel
- decode stops at sentinel blocks

Relevant files:

- [closure/src/cryptagram/protocols/aesthete/codec.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/aesthete/codec.js:12)
- [closure/src/cryptagram/protocols/aesthete/cipher.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/aesthete/cipher.js:12)

Risk:

- adds a SHA-256 checksum wrapper on top of already-authenticated ciphertext, reflecting older design choices.

### Chequer

A more experimental tile-based codec.

Properties:

- tile the source image into JPEG subimages,
- encrypt per tile,
- encode into a base4 image representation.

Relevant files:

- [closure/src/cryptagram/protocols/chequer/codec.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/chequer/codec.js:12)
- [closure/src/cryptagram/protocols/chequer/cipher.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/protocols/chequer/cipher.js:12)

Risk:

- framing depends on the literal delimiter `abcd`, which is not robust enough for long-term support.

## Cryptography Audit

The current JS path uses vendored SJCL.

Findings:

- authenticated encryption is present conceptually,
- but the defaults are now too weak for a modern password-based system,
- and the surrounding wrappers add obsolete integrity mechanisms.

Observed issues:

- PBKDF2-HMAC-SHA256 iteration count of `1000`
- AES-CCM defaults from an older era
- 64-bit tag defaults
- MD5 wrapper in bacchant
- ad hoc SHA-256 wrapper in aesthete
- desktop fallback code uses obsolete `PyCrypto` and unauthenticated patterns

Conclusion:

- the conceptual split between encryption and image codec is still good,
- but the cryptographic wire format needs a new versioned envelope,
- and the modern implementation should use standard maintained primitives without inventing new crypto.

## Server Audit Summary

The server should not remain part of the privacy-critical path.

Findings:

- [server/apache-php/proxy.php](/Users/tierney/repos/cryptagram/server/apache-php/proxy.php:1) is a raw fetch proxy.
- [server/tornado/main.py](/Users/tierney/repos/cryptagram/server/tornado/main.py:24) exposes a URL-grab endpoint and obsolete auth flow.
- Server logic is not required for local encryption/decryption.

Decision:

- archive dynamic server code,
- keep only static hosting support where useful,
- and ensure modern Cryptagram remains fully functional without any backend.

## Compatibility Risks

The main compatibility risks are:

- API drift inside the Closure code itself, where old and new call signatures coexist.
- Multiple partial ports whose behavior is inconsistent with the browser reference.
- Loss of JPEG-recoverability behavior if the codec is rewritten without measured baselines.
- Overstating support for transformations not empirically tested.

Specific examples:

- Android `BacchantEncoder` still contains `TODO` markers.
- Android `BacchantDecoder` appears to identify itself as `aesthete`, not `bacchant`.
- Extension and site code depend on obsolete browser/runtime APIs.

## Modernization Decision

### Decision

Adopt a versioned shared core implemented in Rust, compiled to WebAssembly for browser and extension use, with native/mobile reuse where practical.

### Why this option

This was chosen against the criteria in the mission:

- maintainability,
- testability,
- Chrome extension constraints,
- mobile reuse potential,
- cryptographic safety,
- CI practicality,
- and future codec experimentation.

Rationale:

- safer long-term than preserving fragmented JS/Python/Java ports,
- easier to test deterministically across platforms,
- a better foundation for versioned payload formats and codec experiments,
- compatible with a fully local Chrome MV3 extension,
- and still flexible enough to keep the original q,p-recoverability model.

### Shared core API target

The modernization target should expose a narrow API:

- `encryptPayload(inputBytes, credential, options) -> encryptedPayload`
- `decryptPayload(encryptedPayload, credential) -> inputBytes`
- `encodeCryptagram(encryptedPayload, codecOptions) -> imageBytes`
- `decodeCryptagram(imageBytes) -> encryptedPayload`
- `detectCryptagram(imageBytes) -> metadata`

### Payload design constraints

The new payload format should include:

- magic bytes,
- version,
- protocol identifier,
- KDF identifier and parameters,
- AEAD identifier,
- nonce,
- ciphertext,
- authentication tag,
- optional length-prefixed metadata.

Backward compatibility with legacy Cryptagram images is desirable but not required for the first green build. If not supported in the first milestone, that must be explicitly documented.

## Chrome Flagship Direction

The flagship product should be a modern Chrome MV3 extension with:

- service worker background,
- content script for page interaction,
- local fixture/demo page,
- context menu action,
- in-place image replacement,
- password prompt or memory-scoped credential entry,
- no remote hosted code,
- no network calls for cryptographic operations.

The existing media adapter pattern is worth preserving conceptually, but old Google+ and Facebook-specific DOM logic should be treated as historical reference, not current support.

## Phase Boundaries

### Phase 0

Audit only.

Deliverables:

- architecture audit,
- threat model,
- migration plan,
- server disposition,
- prioritized issue list.

### Phase 1

Establish the testable core.

Deliverables:

- golden crypto vectors,
- deterministic encode/decode vectors,
- JPEG recompression harness,
- CI for the new core,
- documented legacy compatibility status.

### Phase 2

Build the Chrome MV3 flagship.

Deliverables:

- MV3 extension,
- local demo page,
- automated extension E2E tests,
- in-place decryption on fixture pages.

### Phase 3

Finalize server/static support decision.

Deliverables:

- archive or remove dynamic server code,
- keep static-only support where needed,
- document offline/client-side functionality.

### Phase 4

Mobile modernization.

Deliverables:

- Android modern skeleton with shared/test-compatible core,
- iOS modern skeleton with shared/test-compatible core,
- platform test-vector wiring.

### Phase 5

Hardening.

Deliverables:

- security review,
- dependency audit,
- performance notes,
- accessibility pass,
- release packaging,
- documentation.

## Support Matrix

### Supported for baseline preservation

- Closure-era browser algorithm behavior
- Bacchant and Aesthete protocol archaeology
- Static demo assets used for fixtures

### Not supported as modernization bases

- MV2 extension runtime
- Firefox XUL add-on
- PHP proxy server
- Tornado auth/proxy app
- Flash/Downloadify save flow
- `lib/` as current shared core

## Immediate Next Steps

1. Create executable baselines around current Closure behavior.
2. Define golden vectors for crypto and codec framing.
3. Build a JPEG recompression test harness with measurable failure reporting.
4. Stand up a new shared core behind parity tests.
5. Build a new MV3 extension shell against the shared core.

## Commands Run During Audit

The following command checks informed this document:

- `rg --files`
- `find . -maxdepth 2 -type d | sort`
- `make -C lib test`
- `make -C experimental`
- `python3 -m pytest desktop`
- `node --version`
- `java -version`
- `xcodebuild -version`

## Non-Goals for Phase 0

Phase 0 does not:

- claim current green builds,
- claim current extension support on modern Chrome,
- promise legacy image compatibility before testing,
- promise mobile support before shared-core parity exists,
- or preserve dangerous server behavior.

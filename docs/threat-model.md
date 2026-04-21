# Cryptagram Threat Model

## Scope

This threat model covers the modernization target for Cryptagram:

- local encryption of image payloads,
- local encoding into Cryptagram image representations,
- local decryption in browser, demo, or mobile clients,
- in-place decryption in a browser extension,
- and optional static support infrastructure.

It does not assume a trusted Cryptagram backend.

## Security Goals

Cryptagram should:

- keep cleartext image data local by default,
- keep passwords and private keys local by default,
- allow decryption of already-downloaded Cryptagram images without any network dependency,
- fail safely on wrong credentials, corruption, or unsupported formats,
- and avoid leaking secrets through logs, telemetry, or dynamic code loading.

## Non-Goals

Cryptagram cannot guarantee:

- protection against weak user passwords,
- protection after a legitimate recipient re-shares or screenshots a decrypted image,
- recoverability after arbitrary transformations such as cropping, resizing, rotation, thumbnails, or aggressive transcoding unless measured and explicitly supported,
- or identity verification from a public-key directory unless a real verification model exists.

## Assets

Sensitive assets:

- cleartext image bytes,
- passwords and passphrases,
- private keys if public-key mode is later supported,
- decrypted image pixels in memory,
- algorithm parameters and ciphertext envelopes prior to rendering,
- user-selected secret material stored locally.

Less sensitive but still important:

- encoded Cryptagram images,
- public test vectors,
- public encrypted demo fixtures,
- public keys if a directory is ever added.

## Trust Boundaries

### Trusted local surfaces

- browser extension runtime and bundled code,
- user device memory and storage subject to platform risk,
- local shared core implementation,
- local CLI/demo harnesses used for testing.

### Untrusted or partially trusted surfaces

- social-network pages and their DOMs,
- remote image hosts,
- legacy dynamic server code,
- any optional static-hosted demo origin,
- any user-supplied encoded image,
- any compatibility corpus acquired from outside the repo.

## Adversaries

Relevant adversaries include:

- the hosting social platform,
- a network observer,
- a malicious page that attempts to interfere with extension behavior,
- an attacker who obtains encoded images,
- an attacker who obtains stored local state,
- and a recipient who intentionally redistributes decrypted content.

## Main Threats

### 1. Server trust creep

Risk:

- modernizing the repo could accidentally turn Cryptagram into a server-side encryption or image-hosting product.

Mitigation:

- no server-side encryption or decryption,
- no password handling on a server,
- no upload of private user images to a Cryptagram backend,
- static hosting by default.

### 2. Weak password-derived security

Risk:

- attackers can brute-force weak passwords against captured Cryptagram images.

Mitigation:

- use a modern password KDF with explicit parameters,
- publish limitations clearly,
- support strong passphrases,
- keep failure behavior explicit and non-leaky.

### 3. Transformation-induced decode failure

Risk:

- social platforms may recompress, resize, crop, rotate, or otherwise transform images beyond recoverability.

Mitigation:

- test only what is claimed,
- maintain a JPEG recompression harness,
- report supported quality ranges empirically,
- avoid claims about cropping/resizing/rotation unless harness results support them.

### 4. Extension data exfiltration

Risk:

- credentials or cleartext image data could leak via logs, network calls, remote code, or permissive host behavior.

Mitigation:

- no network calls for cryptographic operations,
- no remote hosted extension code,
- no `eval`, `new Function`, or dynamic code execution,
- no default telemetry,
- no cleartext logging,
- bundled dependencies only.

### 5. Compromised or malicious page DOM

Risk:

- the extension operates in hostile page environments and may be tricked into decrypting the wrong target or exposing data through the page.

Mitigation:

- minimize page-scope exposure,
- keep secrets in extension-controlled scope where possible,
- validate target selection,
- use content scripts and isolated worlds appropriately,
- avoid exposing plaintext through page-readable globals.

### 6. Unsafe persistence of credentials

Risk:

- saved passwords could be stolen from local storage or persisted unexpectedly.

Mitigation:

- memory-scoped by default,
- explicit opt-in for persistence,
- platform secure storage only when the user chooses it,
- clear UX for what is stored and when.

### 7. Malicious input images

Risk:

- malformed or oversized images could trigger crashes, hangs, or unsafe parser behavior.

Mitigation:

- strict size limits,
- safe decoding libraries,
- explicit parse errors,
- fuzzing or corruption tests for codec handling.

## Privacy Rules

The modernization must preserve the following rules:

- no telemetry by default,
- no third-party analytics by default,
- no persistent identifiers unless explicitly justified and opt-in,
- no server-side password handling,
- no server-side storage of private cleartext user photos,
- no implicit cloud dependency for decryption.

## Optional Server Features

If any server survives, it must be clearly non-critical and privacy-reviewed.

Acceptable directions:

- static documentation site,
- static demo site running all crypto locally,
- public compatibility gallery with non-sensitive sample images,
- public version or algorithm registry,
- public-key discovery only if clearly framed as non-verifying unless verification exists.

Unacceptable directions:

- photo escrow,
- password recovery service,
- remote decryption endpoint,
- user account system without a strong demonstrated need.

## Data Retention Expectations

Default expectation:

- no retention of user cleartext images,
- no retention of user passwords,
- no retention of decrypted payloads,
- no retention of identifiable telemetry because telemetry is off by default.

If optional public hosting exists for demo fixtures:

- only public, non-sensitive data may be retained,
- and retention behavior must be documented.

## Security Requirements by Surface

### Shared core

- versioned envelope format,
- authenticated encryption,
- explicit decode and decrypt failure states,
- deterministic test vectors,
- no custom cryptographic primitives.

### Chrome extension

- MV3 only,
- bundled executable code only,
- service worker + content scripts,
- no remote code loading,
- no dynamic evaluation,
- local-only cryptographic operations.

### Web/demo

- all cryptographic operations in-browser,
- useful offline after load where practical,
- no image upload requirement,
- clear statement that operations are local.

### Mobile

- local encode/decode first,
- explicit credential persistence only,
- shared-core parity or test-vector compatibility.

## Known Legacy Risks Found in Audit

Legacy code paths that violate or stress the desired model include:

- open fetch proxy in [server/apache-php/proxy.php](/Users/tierney/repos/cryptagram/server/apache-php/proxy.php:1),
- legacy URL-grab endpoint in [server/tornado/main.py](/Users/tierney/repos/cryptagram/server/tornado/main.py:24),
- remote logging to `http://cryptagr.am` in [closure/src/cryptagram/remotelog.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/remotelog.js:123),
- third-party analytics in [site/code.js](/Users/tierney/repos/cryptagram/site/code.js:1),
- obsolete browser-extension runtime and storage patterns in [closure/src/cryptagram/extension.js](/Users/tierney/repos/cryptagram/closure/src/cryptagram/extension.js:62).

These should not be carried into the modern architecture.

## Residual Risks to Document Publicly

The README and product docs should explicitly state:

- weak passwords remain weak,
- recipients can copy decrypted images,
- platform transformations may break recoverability,
- support claims are limited to tested transformations,
- and public-key discovery is not identity verification by itself.

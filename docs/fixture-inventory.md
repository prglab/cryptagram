# Phase 1 Fixture Inventory

## Purpose

This inventory defines the initial image fixtures we can use to establish deterministic baseline tests before protocol or crypto rewrites.

The authoritative machine-readable manifest is:

- [testdata/fixtures-manifest.csv](/Users/tierney/repos/cryptagram/testdata/fixtures-manifest.csv)

## Selection Rules

Fixtures in this first pass were selected from files already checked in that appear in:

- legacy site demo pages,
- closure demo assets,
- and site-encoder assets.

The goal is to lock down known legacy behavior first, then add generated vectors in later PRs.

## Key Findings

- `site/encoded_2.jpg`, `site/encrypted.jpg`, `closure/static/demo/images/secret.jpg`, and `site-encoder/images/secret.jpg` are byte-identical.
- `closure/static/demo/images/secret2.jpg` and `site-encoder/images/secret2.jpg` are byte-identical.
- `site/pup.jpg` and `site-encoder/images/pup.jpg` are byte-identical.
- The legacy demo page explicitly hints password `cryptagram` for `encoded_1.jpg`, but password metadata is generally incomplete for checked-in fixtures.

Reference for password hint text:

- [site/index.html](/Users/tierney/repos/cryptagram/site/index.html:109)

## Phase 1 Usage

Use these fixtures for:

- deterministic decode smoke tests,
- codec detection tests,
- corruption and wrong-password behavior tests,
- and future recompression harness input sets.

Current executable smoke coverage:

- [scripts/decode-smoke.py](/Users/tierney/repos/cryptagram/scripts/decode-smoke.py)
- [testdata/decode-smoke-cases.json](/Users/tierney/repos/cryptagram/testdata/decode-smoke-cases.json)

Do not claim full compatibility from this set alone. It is a baseline seed corpus, not a complete compatibility matrix.

## Gaps

Current fixture gaps that should be filled in upcoming PRs:

- explicitly versioned encrypted payload vectors independent of image wrappers,
- known-good password metadata for each encrypted sample,
- fixture pairs with ground-truth cleartext for all encrypted samples,
- and transformation expectation metadata for JPEG quality thresholds.

## Reproducibility Notes

File sizes, dimensions, and SHA-256 hashes in the manifest were collected from the working tree during the Phase 1 baseline setup.

Suggested verification commands:

```bash
shasum -a 256 <path>
wc -c <path>
sips -g pixelWidth -g pixelHeight <path>
```

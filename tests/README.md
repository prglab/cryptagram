# Cryptagram Testing Structure

This directory contains the baseline verification tests for the Cryptagram project.

## Test Suites

### Smoke Tests (`tests/smoke/`)
Functional end-to-end tests for image decoding.
- **`decode.py`**: A Python script that uses `Pillow` to decode encrypted images and verify payloads.
- **`cases.json`**: Definition of test cases, including input images, passwords, and expected success/failure.

### Integrity Tests (`tests/integrity/`)
Integrity checks for project fixtures and data.
- **`validate-fixtures.mjs`**: A Node.js script that verifies the SHA-256 hashes and dimensions of fixtures defined in `testdata/fixtures-manifest.csv`.

### Benchmark Harness (`tests/harness/`)
Empirical robustness testing for codecs.
- **`recompress.py`**: A Python script that measures the recovery rate of the `bacchant` codec across various JPEG quality levels.

## Running Tests

The recommended way to run tests is via the root `Makefile`:

```bash
# Run all tests
make test

# Run only smoke tests
make smoke

# Run only integrity tests
make integrity
```

## Dependencies
- **Python 3**: Requires the `Pillow` library (`pip install pillow`).
- **Node.js**: Requires a recent version of Node.js.

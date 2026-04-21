# Cryptagram Developer Guide

Welcome to the modernized Cryptagram project. This guide will help you get started with development, testing, and contribution.

## Architecture Overview

Cryptagram is now a monorepo structured for cross-platform portability:

- **`packages/core`**: The "Source of Truth" for Cryptagram logic. Written in TypeScript and provides image codecs (`Bacchant`, `Aesthete`) and modern crypto (`AES-GCM`).
- **`packages/extension`**: A modern Manifest V3 Chrome Extension built with Vite and TypeScript. Consumes `@cryptagram/core`.
- **`core-rust`**: High-performance Rust implementation of codecs, compiled to WebAssembly for proxy and native use cases.
- **`tests/`**: Comprehensive Python-based testing suite for baseline verification, benchmarking, and JPEG robustness.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.9+ (for testing suite)
- Rust (for Wasm core development)

### Installation
```bash
# Install core dependencies
cd packages/core
npm install

# Install extension dependencies
cd ../extension
npm install
```

### Building
```bash
# Build the shared core first
cd packages/core
npm run build

# Build the extension
cd ../extension
npm run build
```
The extension will be output to `packages/extension/dist/`.

## Testing

### Core Unit Tests
```bash
cd packages/core
npm test
```

### Baseline & Integration Tests
We maintain a robust Python-based testing suite in the root directory:
```bash
# Run all tests
make test

# Run specific suites
make smoke      # End-to-end decoding
make benchmark  # JPEG robustness benchmarking
make integrity  # Fixture validation
```

## Developing the Extension

To test the extension in Chrome:
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `packages/extension/dist` directory.

### UI Guidelines
- Use **Glassmorphism** for overlays (blur, transparency).
- Maintain a premium, high-contrast aesthetic.
- Use the `Outfit` or `Inter` font for a modern feel.

## Modernization Philosophy
1. **Never trust the server**: All encryption/decryption happens locally in the core.
2. **Bit-parity**: New implementations must produce bit-identical results to the legacy "Golden Vectors".
3. **Wasm-ready**: Prefer code that can be compiled to Wasm or run in edge environments like Envoy.

# Cryptagram

**Privacy-preserving image encryption and steganography.**

Modernized Cryptagram is a high-performance, cross-platform architecture for local-first photo privacy. It allows you to encrypt photos locally and embed them into images that survive social network transformations (JPEG recompression), revealing them in-place via a browser extension.

## 🚀 Modern Architecture (Phase 2 & 3)

The project has transitioned from a legacy Closure-based implementation to a modern, monorepo-based core:

- **📦 Shared Core (`@cryptagram/core`)**: TypeScript implementation of the Bacchant and Aesthete protocols with WebCrypto (AES-GCM).
- **🧩 Chrome Extension (MV3)**: A modern, Vite-based extension for real-time image decoding and reveal.
- **🦀 Rust Core**: High-performance Wasm-ready core for edge and proxy integration.
- **🧪 Testing Harness**: A rigorous Python-based suite for JPEG robustness and bit-parity verification.

## 🛠 Developer Onboarding

Please see [DEVELOPER.md](DEVELOPER.md) for detailed instructions on setup, building, and contributing to the modernized stack.

## 🧪 Quick Test

Ensure everything is passing with the baseline suite:
```bash
make test
```

## 📜 History & Vision

Cryptagram was originally developed at the NYU Media Research Lab. The goal remains the same: to give users control over their visual privacy on the web without relying on trusted third-party servers.

---
© 2012-2026 Matt Tierney & Ian Spiro. BSD-3-Clause License.

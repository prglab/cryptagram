# README for Cryptogram #

JPEG cryptography for privacy in social networks.

## Modernization Status

This repository is under active archaeological modernization.

Phase 0 audit documents:

- [Architecture Audit](/Users/tierney/repos/cryptagram/docs/phase0-architecture.md)
- [Threat Model](/Users/tierney/repos/cryptagram/docs/threat-model.md)
- [Migration Plan](/Users/tierney/repos/cryptagram/docs/migration-plan.md)
- [Fixture Inventory](/Users/tierney/repos/cryptagram/docs/fixture-inventory.md)

Fixture baseline verification:

- `make test` (runs both smoke and integrity tests)
- `make benchmark` (runs the JPEG recoverability harness)
- See [tests/README.md](tests/README.md) for details.

These documents define the current modernization direction, supported baselines, and phased PR plan. They supersede the high-level notes below where the legacy layout or tooling has drifted.

### Directory Layout ###

* chrome-extension
  * basic - works with apache-php server site.
  * fb - works FB, theater mode.
* desktop - python environment for encrypting, decrypting images and testing various encoding schemes.
* server
  * apache-php - server setup for apache with php
  * tornado - copy of apache-php adapted for tornadoweb.

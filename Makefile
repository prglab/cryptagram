.PHONY: test smoke integrity

test: smoke integrity

smoke:
	@echo "Running decode smoke tests..."
	@python3 tests/smoke/decode.py

integrity:
	@echo "Running integrity tests..."
	@node tests/integrity/validate-fixtures.mjs

build-core:
	cd packages/core && npm run build

build-ext: build-core
	cd packages/extension && npm run build

.PHONY: all test smoke benchmark integrity build-core build-ext

harness:
	@echo "Running JPEG recoverability harness..."
	@python3 tests/harness/recompress.py

benchmark: harness

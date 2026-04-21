.PHONY: test smoke integrity

test: smoke integrity

smoke:
	@echo "Running decode smoke tests..."
	@python3 tests/smoke/decode.py

integrity:
	@echo "Running fixture integrity tests..."
	@node tests/integrity/validate-fixtures.mjs

harness:
	@echo "Running JPEG recoverability harness..."
	@python3 tests/harness/recompress.py

benchmark: harness

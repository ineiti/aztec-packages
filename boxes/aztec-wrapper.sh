#!/usr/bin/env bash
# Wrapper script for aztec command that ensures unique container names
# This prevents conflicts when building boxes in parallel

# Set unique container name for this invocation
export CONTAINER_NAME="aztec-build-$$-$RANDOM"

# Call the real aztec binary
exec "$AZTEC_BIN" "$@"


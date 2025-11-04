#!/usr/bin/env bash
set -euo pipefail

json_path=$1
temp_file="${json_path}.tmp"

jq '.functions |= map(.name |= sub("^__aztec_nr_internals__"; ""))' "$json_path" > "$temp_file"
mv "$temp_file" "$json_path"

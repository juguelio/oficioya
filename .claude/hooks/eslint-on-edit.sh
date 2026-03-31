#!/usr/bin/env bash
# PostToolUse: run ESLint on any src/ file after Edit or Write.
# Silent on clean. Prints errors and exits non-zero if lint fails.

FILE=$(python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
")

# Skip if no file, not in src/, or not a TS/JS file
if [[ -z "$FILE" ]]; then exit 0; fi
if [[ "$FILE" != */src/* ]]; then exit 0; fi
if [[ "$FILE" != *.ts && "$FILE" != *.tsx && "$FILE" != *.js && "$FILE" != *.jsx ]]; then exit 0; fi

cd "$(dirname "$0")/../.." || exit 0

OUTPUT=$(npx eslint --color "$FILE" 2>&1)
EXIT_CODE=$?

if [[ $EXIT_CODE -ne 0 ]]; then
  echo "$OUTPUT"
  exit $EXIT_CODE
fi

#!/usr/bin/env bash
# UserPromptSubmit: inject git status + last 5 commits as additionalContext.

cd "$(dirname "$0")/../.." || exit 0

STATUS=$(git status --short 2>/dev/null)
LOG=$(git log --oneline -5 2>/dev/null)

python3 -c "
import json, sys

status = '''${STATUS:-}'''
log    = '''${LOG:-}'''

ctx = 'Git status:\n' + (status.strip() or '(clean)') + '\n\nLast 5 commits:\n' + (log.strip() or '(no commits yet)')
print(json.dumps({'additionalContext': ctx}))
"

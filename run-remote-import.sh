#!/bin/bash
# Run import on remote VPS and save output locally

# List of supplier files to import (SMATTS VENTURE retry)
FILES=(
    "SMATTS VENTURE_015636.xlsx"
)

OUTPUT_FILE="/tmp/import-output-all-$(date +%Y%m%d_%H%M%S).txt"

echo "Running import for ${#FILES[@]} supplier files on VPS..."
echo "Output will be saved to: $OUTPUT_FILE"
echo ""

> "$OUTPUT_FILE"

for FILE in "${FILES[@]}"; do
    echo "Importing: $FILE"
    ssh root@168.231.115.240 "cd /var/www/bmustore/server && node import-supplier.js \"$FILE\" 2>&1" >> "$OUTPUT_FILE" 2>&1
    echo "" >> "$OUTPUT_FILE"
done

echo ""
echo "=== Import Output ==="
cat "$OUTPUT_FILE"

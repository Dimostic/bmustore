#!/bin/bash
# Run import on remote VPS and save output locally

OUTPUT_FILE="/tmp/import-output-$(date +%Y%m%d_%H%M%S).txt"

echo "Running import on VPS..."
echo "Output will be saved to: $OUTPUT_FILE"

ssh root@154.113.83.116 'cd /var/www/bmustore && node import-supplier.js "SKYPAT PHARMACY_015527.xlsx" 2>&1' > "$OUTPUT_FILE" 2>&1

echo ""
echo "=== Import Output ==="
cat "$OUTPUT_FILE"

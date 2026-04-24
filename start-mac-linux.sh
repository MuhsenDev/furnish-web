#!/usr/bin/env bash
echo ""
echo "========================================"
echo "          FURNISH LOCAL SERVER"
echo "========================================"
echo ""
echo "When you see 'Accepting connections at...'"
echo "open this URL in your browser:"
echo ""
echo "    http://localhost:3000"
echo ""
echo "To stop the server, press Ctrl+C."
echo ""
echo "----------------------------------------"
echo ""
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed."
  echo ""
  echo "Install it from https://nodejs.org"
  echo "Pick the 'LTS' download, run it, then"
  echo "run this script again."
  exit 1
fi
cd "$(dirname "$0")"
npx --yes serve . -l 3000

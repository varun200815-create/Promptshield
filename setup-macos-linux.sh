#!/usr/bin/env bash
set -e
node --version
npm install --no-audit --no-fund
npm install --prefix frontend --no-audit --no-fund
npm install --prefix backend --no-audit --no-fund
[ -f backend/.env ] || cp backend/.env.example backend/.env
echo "Setup complete. Edit backend/.env, then run: npm run dev"

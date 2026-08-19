#!/usr/bin/env node

/**
 * VaultX Cryptographic Production Secrets Generator
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('================================================================');
console.log('🔐 VAULTX PRODUCTION SECRETS GENERATOR');
console.log('================================================================\n');

const jwtSecret = crypto.randomBytes(32).toString('base64');
const refreshSecret = crypto.randomBytes(32).toString('base64');
const sessionSecret = crypto.randomBytes(32).toString('base64');

console.log('Copy and paste these into your production environment variables (e.g. Railway, Vercel, AWS):\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('\n================================================================');
console.log('⚠️  IMPORTANT: Never commit generated secrets to public repositories.');
console.log('================================================================\n');

/*
 Simple CLI to test MongoDB connection for this project.
 - Loads .env if present (without extra deps)
 - Attempts to connect using mongoose
 - Exits with code 0 on success, 1 on failure
*/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongoose = require('mongoose');

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadDotEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set. Please set it in your .env file or environment.');
    process.exit(1);
  }

  const startedAt = Date.now();
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    });
    const elapsed = Date.now() - startedAt;
    console.log('MongoDB connection established.');
    console.log('readyState:', conn.connection.readyState); // 1 = connected
    console.log('elapsedMs:', elapsed);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    console.error('MongoDB connection FAILED.');
    console.error('elapsedMs:', elapsed);
    console.error('error:', err && err.message ? err.message : String(err));
    // Print helpful hint if URI looks like it has an unescaped @ in password
    if (/mongodb(\+srv)?:\/\/.+:.+@.+@/i.test(uri)) {
      console.error("HINT: Your MongoDB password likely contains '@'. URL-encode it as %40 in the MONGODB_URI.");
    }
    process.exit(1);
  }
}

process.on('unhandledRejection', (e) => {
  console.error('UnhandledRejection:', e);
  process.exit(1);
});

process.on('uncaughtException', (e) => {
  console.error('UncaughtException:', e);
  process.exit(1);
});

main();

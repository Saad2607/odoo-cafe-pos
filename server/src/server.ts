// N in MERN — Node.js starts everything

import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed/seed.js';
import { verifySmtpConnection } from './services/receipt.js';

async function start() {
  await connectDB();
  await seedDatabase();

  const smtp = await verifySmtpConnection();
  if (smtp.ok) {
    console.log('  Email:', smtp.message);
  } else {
    console.log('  Email:', smtp.message, '(receipt view links still work)');
  }

  app.listen(env.port, () => {
    console.log('-------------------------------------------');
    console.log('  MERN Backend Started on port', env.port);
    console.log('  Health: http://localhost:' + env.port + '/api/health');
    console.log('-------------------------------------------');
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
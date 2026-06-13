// M in MERN — MongoDB connection (Mongoose ODM)

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';

let memoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  let uri = env.databaseUrl;

  if (env.useMemoryMongo) {
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: 'odoo_cafe_pos' },
    });
    uri = memoryServer.getUri();
    console.log('  MongoDB: in-memory mode (dev)');
  } else {
    console.log('  MongoDB: connecting to', uri);
  }

  await mongoose.connect(uri);
  console.log('  MongoDB: connected');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
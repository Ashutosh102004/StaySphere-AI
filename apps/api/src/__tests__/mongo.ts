import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export async function getMongoServer(): Promise<MongoMemoryServer> {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }
  return mongoServer;
}

export async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  const server = await getMongoServer();
  await mongoose.connect(server.getUri('staysphere-ai-test'));
}

export async function clearDatabase(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

export async function disconnectMongo(): Promise<void> {
  if (mongoServer) {
    const server = mongoServer;
    mongoServer = null;
    try {
      await mongoose.disconnect();
    } finally {
      await server.stop();
    }
  }
}

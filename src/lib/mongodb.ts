import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local');
  }

  if (clientPromise) {
    return clientPromise;
  }

  if (process.env.NODE_ENV === 'development') {
    let globalWithMongoClientPromise = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongoClientPromise._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongoClientPromise._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongoClientPromise._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

const mongodb = { getPromise: getClientPromise };
export default mongodb;

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  return client.db('dashboard');
}

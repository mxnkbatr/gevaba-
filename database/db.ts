import { MongoClient, Db, Collection, Document } from "mongodb";

const missingUriError = () =>
  new Error('Invalid/Missing environment variable: "MONGODB_URI"');

// Use the same global pattern for both development AND production
// to prevent connection pool exhaustion in serverless environments.
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let missingUriReject: Promise<MongoClient> | null = null;

function ensureClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    if (!missingUriReject) {
      missingUriReject = Promise.reject(missingUriError());
      void missingUriReject.catch(() => {});
    }
    return missingUriReject;
  }

  missingUriReject = null;

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      connectTimeoutMS: 5000,         // fail fast on Vercel cold start
      socketTimeoutMS: 20000,
      serverSelectionTimeoutMS: 4000, // critical for LCP — don't wait forever
      compressors: ['zstd', 'zlib'],  // compress wire protocol data
    });

    // Wrap connect() with a hard 5s timeout so DNS ETIMEOUT can't block for 50s
    const connectWithTimeout = () => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB connect timeout (5s)')), 5000)
      );
      return Promise.race([client.connect(), timeout]);
    };

    global._mongoClientPromise = connectWithTimeout()
      .then(() => client)
      .catch((err) => {
        // Clear the cached promise so next request tries again
        global._mongoClientPromise = undefined;
        throw err;
      }) as Promise<MongoClient>;
  }
  return global._mongoClientPromise;
}

/**
 * Global helper function to connect to the database.
 * Use this in your API routes or Server Components.
 */
export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  const client = await ensureClientPromise();
  const dbName = process.env.MONGODB_DB?.trim();
  // Driver uses the database name from the URI path when dbName is omitted.
  const db = client.db(dbName && dbName.length > 0 ? dbName : undefined);
  return { client, db };
}

/**
 * Get a MongoDB collection from a given database instance.
 * Use this after calling connectToDatabase() to obtain a typed collection.
 */
export function getCollection<T extends Document = Document>(
  db: Db,
  name: string,
): Collection<T> {
  return db.collection<T>(name);
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
const clientPromise = ensureClientPromise();
export default clientPromise;

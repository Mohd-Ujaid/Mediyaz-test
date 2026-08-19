import mongoose from "mongoose";

const getMongoURI = () => {
  return process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mediyaz";
};

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const uri = getMongoURI();

  if (!cached.promise || mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null;
    cached.promise = null;

    const opts = {
      bufferCommands: false, // Serverless Fast-Fail
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10, // Serverless concurrency control (Vercel spins up many lambdas)
      minPoolSize: 1, // Keep 1 socket open to prevent cold start delays
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    }).catch((err) => {
      console.warn("MongoDB Connection Notice:", err.message);
      cached.promise = null;
      return null;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.conn = null;
    cached.promise = null;
  }

  return cached.conn;
}

export async function dbConnect() {
  return connectToDatabase();
}

export default connectToDatabase;

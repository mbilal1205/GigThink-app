import mongoose from 'mongoose';

export async function testMongoDBConnection() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return {
      status: 'FAILED',
      reason: 'MISSING_ENV',
      details: 'MONGODB_URI environment variable is missing in .env / .env.local',
    };
  }

  // Sanitized URI for safe logging (hides password)
  const sanitizedUri = uri.replace(/:([^@]+)@/, ':****@');

  // Check Current Mongoose ReadyState
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    return {
      status: 'OK',
      details: `Already connected to MongoDB. Cluster host: ${mongoose.connection.host}`,
    };
  }

  try {
    console.log(`[DB_DIAGNOSTICS] Attempting direct connection to: ${sanitizedUri}`);

    // Set short connection timeout for fast fail diagnostic
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5s timeout
      connectTimeoutMS: 5000,
      bufferCommands: false, // Prevents hanging operations
    });

    return {
      status: 'OK',
      details: `Successfully connected to MongoDB Atlas! Host: ${conn.connection.host}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[DB_DIAGNOSTICS_ERROR]:', errorMsg);

    // Identify Specific Failures
    if (errorMsg.includes('querySrv ENOTFOUND') || errorMsg.includes('querySrv EREFUSED')) {
      return {
        status: 'FAILED',
        reason: 'DNS_RESOLVE_ERROR',
        details: 'DNS resolution failed. Network/ISP is blocking MongoDB SRV record or connection string host is invalid.',
        error: errorMsg,
      };
    }

    if (errorMsg.includes('MongoServerError: Authentication failed') || errorMsg.includes('bad auth')) {
      return {
        status: 'FAILED',
        reason: 'AUTH_FAILED',
        details: 'Username or Password in MONGODB_URI is incorrect.',
        error: errorMsg,
      };
    }

    if (errorMsg.includes('selection timed out') || errorMsg.includes('ETIMEDOUT')) {
      return {
        status: 'FAILED',
        reason: 'NETWORK_TIMEOUT',
        details: 'Connection timed out. IP address blocked by Firewall/Atlas Network Access or ISP blocking port 27017.',
        error: errorMsg,
      };
    }

    return {
      status: 'FAILED',
      reason: 'UNKNOWN_DB_ERROR',
      details: errorMsg,
    };
  }
}
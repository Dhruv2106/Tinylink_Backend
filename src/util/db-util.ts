// /*
//  * TinyLink - URL Shortener Backend
//  * Database Utility - Singleton Pattern
//  */

// import { Pool, Client } from 'pg';

// /**
//  * Database utility class - Singleton pattern
//  */
// export class DBUtil {
//     public static dbPool: Pool;
//     private static instance: DBUtil;
//     private static initialized: boolean = false;

//     constructor() {
//         if (DBUtil.instance) {
//             return DBUtil.instance;
//         }
//         DBUtil.instance = this;
//     }

//     /**
//      * Initialize database - create if not exists
//      */
//     public static async initialize(): Promise<void> {
//         if (DBUtil.initialized) {
//             return;
//         }

//         const dbName = process.env.DB_NAME || 'tinylink';
//         const dbUser = process.env.DB_USER || 'postgres';
//         const dbHost = process.env.DB_HOST || 'localhost';
//         const dbPort = parseInt(process.env.DB_PORT || '5432');
//         const dbPassword = process.env.DB_PASSWORD || 'postgres';

//         // First, connect to 'postgres' database to check/create target database
//         const adminClient = new Client({
//             host: dbHost,
//             port: dbPort,
//             database: 'postgres',
//             user: dbUser,
//             password: dbPassword,
//         });

//         try {
//             await adminClient.connect();
            
//             // Check if database exists
//             const result = await adminClient.query(
//                 `SELECT 1 FROM pg_database WHERE datname = $1`,
//                 [dbName]
//             );

//             if (result.rows.length === 0) {
//                 // Database doesn't exist, create it
//                 console.log(`Database '${dbName}' not found. Creating...`);
//                 await adminClient.query(`CREATE DATABASE ${dbName} OWNER ${dbUser}`);
//                 console.log(`Database '${dbName}' created successfully`);
//             } else {
//                 console.log(`Database '${dbName}' already exists`);
//             }

//             await adminClient.end();
//         } catch (error: any) {
//             console.error(`Error checking/creating database: ${error.message}`);
//             await adminClient.end();
//             throw error;
//         }

//         // Now initialize the connection pool to the target database
//         DBUtil.dbPool = new Pool({
//             host: dbHost,
//             port: dbPort,
//             database: dbName,
//             user: dbUser,
//             password: dbPassword,
//             max: 20,
//             idleTimeoutMillis: 30000,
//             connectionTimeoutMillis: 2000,
//         });

//         DBUtil.initialized = true;
//         console.log('DBUtil initialized with connection pool');
//         console.log(`DB Config: ${dbUser}@${dbHost}:${dbPort}/${dbName}`);
//     }

//     /**
//      * Get singleton instance
//      */
//     public static getInstance(): DBUtil {
//         if (!DBUtil.instance) {
//             DBUtil.instance = new DBUtil();
//         }
//         return DBUtil.instance;
//     }

//     /**
//      * Close the database pool
//      */
//     public static async closePool(): Promise<void> {
//         if (DBUtil.dbPool) {
//             await DBUtil.dbPool.end();
//             console.log('Database pool closed');
//         }
//     }
// }
/*
 * TinyLink - URL Shortener Backend
 * Database Utility - Production Ready (Railway Compatible)
 */

import { Pool } from "pg";

export class DBUtil {
    private static pool: Pool | null = null;
    private static initialized = false;

    /**
     * Initialize the database connection pool
     */
    public static async initialize(): Promise<void> {
        if (this.initialized) return;

        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error("❌ DATABASE_URL is not set. Please add it to Railway variables.");
        }

        // Configure pool for Railway / cloud PostgreSQL
        this.pool = new Pool({
            connectionString,
            max: 20,
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            ssl: {
                rejectUnauthorized: false, // required for Railway SSL
            },
        });

        try {
            await this.pool.query("SELECT NOW()");
            console.log("✅ Connected to PostgreSQL via DATABASE_URL");
        } catch (error) {
            console.error("❌ Failed to connect to PostgreSQL:", error);
            throw error;
        }

        this.initialized = true;
    }

    /**
     * Get the active connection pool
     */
    public static getPool(): Pool {
        if (!this.pool) {
            throw new Error("❌ DB pool not initialized. Call DBUtil.initialize() first.");
        }
        return this.pool;
    }

    /**
     * Close the database pool on shutdown
     */
    public static async closePool(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            console.log("🛑 PostgreSQL pool closed");
        }
    }
}

import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

export let db;

const handleDisconnect = () => {
  // Use connection pool instead of single connection
  db = mysql.createPool(dbConfig);

  // Log connection status
  db.getConnection((err, connection) => {
    if (err) {
      console.error("❌ Database connection failed:", err);
      // Don't call handleDisconnect recursively - the pool will handle reconnection
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log("Connection lost. Pool will handle reconnection.");
      } else if (err.code === 'ER_CON_COUNT_ERROR') {
        console.log("Database has too many connections.");
      } else if (err.code === 'ECONNREFUSED') {
        console.log("Database connection was refused.");
      } else {
        console.log("Unknown database error:", err);
      }
    } else {
      console.log("✅ Connected to MySQL database pool.");
      connection.release(); // Release connection back to pool
    }
  });
};

// Initialize the connection
handleDisconnect();

// Export a function to get a connection from the pool
export const getConnection = () => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection from pool:", err);
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
handleDisconnect();

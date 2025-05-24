import mysql from "mysql2";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
});

// Log database connection attempt
console.log("Attempting to connect to MySQL database...");
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

export const db = mysql.createPool(dbConfig);

// Optional: keep the connection alive
setInterval(() => {
  db.query('SELECT 1', (err) => {
    if (err) console.error("Keep-alive query failed:", err);
  });
}, 60000); // Every 60 seconds

// Optional: log if pool is ready
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database.");
    connection.release(); // Release after test
  }
});

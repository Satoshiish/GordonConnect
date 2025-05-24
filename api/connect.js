import mysql from "mysql2";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Log database connection attempt
console.log("Attempting to connect to MySQL database...");
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);

// Create connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectTimeout: 30000, // Increased timeout for remote connections
  ssl: {
    // Enable SSL for secure connection
    rejectUnauthorized: false // Allow self-signed certificates
  }
};

// Create connection pool instead of single connection
export const db = mysql.createPool(dbConfig).promise();

// Test the connection
db.query("SELECT 1")
  .then(() => {
    console.log("✅ Connected to MySQL database successfully!");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    console.log("Attempting to connect using connection URL...");
    
    // Try alternative connection method if the first one fails
    const altConfig = mysql.createPool({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }).promise();
    
    return altConfig.query("SELECT 1")
      .then(() => {
        console.log("✅ Connected to MySQL database using connection URL!");
        // Replace the original pool with the working one
        db = altConfig;
      });
  })
  .catch((err) => {
    console.error("❌ All connection attempts failed:", err);
    console.error("Please check your database credentials and network connectivity.");
  });

// Keep connection alive
setInterval(() => {
  db.query("SELECT 1")
    .catch(err => {
      console.error("Keep-alive query failed:", err);
    });
}, 60000); // Every 60 seconds

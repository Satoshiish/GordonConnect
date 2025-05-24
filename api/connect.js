import mysql from "mysql2";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Log database connection attempt
console.log("Attempting to connect to MySQL database...");
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`User: ${process.env.DB_USER || 'Not set'}`);
console.log(`Database: ${process.env.DB_NAME || 'Not set'}`);

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306,
  connectTimeout: 10000
};

export let db;

const handleDisconnect = () => {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("❌ Database connection failed:", err);
      console.log("Will retry connection in 5 seconds...");
      setTimeout(handleDisconnect, 5000); // Try reconnecting after 5 seconds
    } else {
      console.log("✅ Connected to MySQL database successfully.");
    }
  });

  db.on("error", (err) => {
    console.error("❗ MySQL error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("🔄 Database connection lost. Reconnecting...");
      handleDisconnect();
    } else if (err.fatal) {
      // Only throw fatal errors after logging them
      console.error("Fatal database error. Exiting gracefully.");
      process.exit(1);
    }
  });
};

// Initial connection attempt
handleDisconnect();

// Add a simple query method that handles errors
export const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });
}

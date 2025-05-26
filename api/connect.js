import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

export let db;

const handleDisconnect = () => {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("❌ Database connection failed:", err);
      setTimeout(handleDisconnect, 2000); // Reconnect after 2 seconds
    } else {
      console.log("✅ Connected to MySQL database.");
    }
  });

  db.on("error", (err) => {
    console.error("❗ MySQL error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("🔄 Reconnecting...");
      handleDisconnect();
    } else {
      throw err;
    }
  });
};

handleDisconnect();

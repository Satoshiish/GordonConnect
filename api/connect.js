import mysql from "mysql2";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306
};

export let db;

const handleDisconnect = () => {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("❌ Database connection failed:", err);
      setTimeout(handleDisconnect, 2000); // Try reconnecting after 2 seconds
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

handleDisconnect(); // Initialize connection
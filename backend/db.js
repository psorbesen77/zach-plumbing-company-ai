require("dotenv").config();

const mysql = require("mysql2/promise");

const databaseName =
  process.env.NODE_ENV === "test"
    ? "zach_plumbing_test"
    : process.env.DB_NAME;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
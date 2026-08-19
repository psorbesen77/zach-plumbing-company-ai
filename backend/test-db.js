const pool = require("./db");

async function testDatabase() {
  try {
    const [rows] = await pool.query("SELECT * FROM dispatches");

    console.log("MySQL query successful!");
    console.log("Dispatch count:", rows.length);
    console.log(rows);

    await pool.end();
  } catch (error) {
    console.error("MySQL query failed:");
    console.error(error.message);
    process.exit(1);
  }
}

testDatabase();
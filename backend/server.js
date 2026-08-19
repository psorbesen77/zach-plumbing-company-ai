const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 3000;

// Parse incoming JSON request bodies
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Zach Plumbing Company AI backend is running",
  });
});

// Dispatch endpoint POST
app.post("/api/dispatch", async (req, res) => {
  const { customer_name, phone_number, emergency_issue } = req.body.args || {};
  const callId = req.body.call?.call_id;



  // Validate required data FIRST
  if (!customer_name || !phone_number || !emergency_issue || !callId) {
    return res.status(400).json({
      success: false,
      message: "Missing required dispatch information",
    });
  }

  // Turn the phone number into a normalized format (digits only)
  const normalizedPhone = phone_number.replace(/\D/g, "");

  // Validate the phone number length (assuming US phone numbers)
  if (normalizedPhone.length !== 10) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number",
    });
  }

  // Check for duplicate dispatches based on the Retell call ID
    try {
    // Check whether this Retell call was already processed
    const [existingRows] = await pool.query(
      "SELECT * FROM dispatches WHERE retell_call_id = ? LIMIT 1",
      [callId]
    );

    if (existingRows.length > 0) {
      return res.status(200).json({
        success: true,
        message: "Dispatch already exists",
        dispatch: existingRows[0],
      });
    }

    const newDispatch = {
      id: `DISP-${Date.now()}`,
      retell_call_id: callId,
      customer_name,
      phone_number: normalizedPhone,
      emergency_issue,
      status: "NEW",
      created_at: new Date(),
      updated_at: null,
    };

    await pool.query(
      `INSERT INTO dispatches
        (
          id,
          retell_call_id,
          customer_name,
          phone_number,
          emergency_issue,
          status,
          created_at,
          updated_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newDispatch.id,
        newDispatch.retell_call_id,
        newDispatch.customer_name,
        newDispatch.phone_number,
        newDispatch.emergency_issue,
        newDispatch.status,
        newDispatch.created_at,
        newDispatch.updated_at,
      ]
    );

    console.log("Emergency dispatch saved to MySQL:");
    console.log({
      id: newDispatch.id,
      customer_name,
      phone_number: normalizedPhone,
      emergency_issue,
    });

    res.status(201).json({
      success: true,
      message: "Dispatch created successfully",
      dispatch: newDispatch,
    });
  } catch (error) {
    console.error("Failed to create dispatch:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create dispatch",
    });
  }
});

// Endpoint to retrieve all dispatches GET
app.get("/api/dispatches", async (req, res) => {
  try {
    const [dispatches] = await pool.query(
      "SELECT * FROM dispatches ORDER BY created_at DESC"
    );

    res.status(200).json({
      success: true,
      count: dispatches.length,
      dispatches,
    });
  } catch (error) {
    console.error("Failed to fetch dispatches:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dispatches",
    });
  }
});


// Endpoint to retrieve a single dispatch by ID GET
app.get("/api/dispatches/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM dispatches WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    res.status(200).json({
      success: true,
      dispatch: rows[0],
    });
  } catch (error) {
    console.error("Failed to fetch dispatch:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dispatch",
    });
  }
});

// Endpoint to update dispatch status PATCH
app.patch("/api/dispatches/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["NEW", "DISPATCHED", "COMPLETED"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid dispatch status",
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM dispatches WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    const updatedAt = new Date();

    await pool.query(
      "UPDATE dispatches SET status = ?, updated_at = ? WHERE id = ?",
      [status, updatedAt, id]
    );

    const [updatedRows] = await pool.query(
      "SELECT * FROM dispatches WHERE id = ? LIMIT 1",
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Dispatch status updated successfully",
      dispatch: updatedRows[0],
    });
  } catch (error) {
    console.error("Failed to update dispatch status:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update dispatch status",
    });
  }
});


// Start the server Node.js server
//app.listen(PORT, () => {
 // console.log(`Server running at http://localhost:${PORT}`);
//});


// Export the app for testing or external usage Jest/Supertest
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
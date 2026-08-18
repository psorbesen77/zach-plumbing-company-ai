const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

//const dataFile = path.join(__dirname, "data", "dispatches.json"); // Path to the JSON file for storing dispatches

const dataFile =
  process.env.DISPATCH_DATA_FILE ||
  path.join(__dirname, "data", "dispatches.json");

// Safely read stored dispatches
function readDispatches() {
  try {
    const data = fs.readFileSync(dataFile, "utf8");

    if (!data.trim()) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read dispatch data:", error.message);
    return [];
  }
}


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
app.post("/api/dispatch", (req, res) => {
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

  // Read existing dispatches from the JSON file
  const dispatches = readDispatches();

  // Check if a dispatch with the same call ID already exists
  const existingDispatch = dispatches.find(
  (dispatch) => dispatch.retell_call_id === callId
);

if (existingDispatch) {
  return res.status(200).json({
    success: true,
    message: "Dispatch already exists",
    dispatch: existingDispatch,
  });
}


  const newDispatch = {
    id: `DISP-${Date.now()}`,
    retell_call_id: callId,
    customer_name,
    phone_number: normalizedPhone,
    emergency_issue,
    status: "NEW",
    created_at: new Date().toISOString(),
  };

  dispatches.push(newDispatch);

  fs.writeFileSync(
    dataFile,
    JSON.stringify(dispatches, null, 2)
  );

  console.log("Emergency dispatch received:");
  console.log({
    customer_name,
    phone_number: normalizedPhone,
    emergency_issue,
  });

  res.status(201).json({
    success: true,
    message: "Dispatch created successfully",
    dispatch: newDispatch,
  });
});

// Endpoint to retrieve all dispatches GET
app.get("/api/dispatches", (req, res) => {
  const dispatches = readDispatches();

  res.status(200).json({
    success: true,
    count: dispatches.length,
    dispatches,
  });
});


// Endpoint to retrieve a specific dispatch by ID GET
app.get("/api/dispatches/:id", (req, res) => {
  const { id } = req.params;

  const dispatches = readDispatches();

  const dispatch = dispatches.find((item) => item.id === id);

  if (!dispatch) {
    return res.status(404).json({
      success: false,
      message: "Dispatch not found",
    });
  }

  res.status(200).json({
    success: true,
    dispatch,
  });
});

// Endpoint to update dispatch status PATCH
app.patch("/api/dispatches/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["NEW", "DISPATCHED", "COMPLETED"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid dispatch status",
    });
  }

  const dispatches = readDispatches();

  const dispatch = dispatches.find((item) => item.id === id);

  if (!dispatch) {
    return res.status(404).json({
      success: false,
      message: "Dispatch not found",
    });
  }

  dispatch.status = status;
  dispatch.updated_at = new Date().toISOString();

  fs.writeFileSync(
    dataFile,
    JSON.stringify(dispatches, null, 2)
  );

  res.status(200).json({
    success: true,
    message: "Dispatch status updated successfully",
    dispatch,
  });
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
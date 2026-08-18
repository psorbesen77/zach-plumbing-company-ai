const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const dataFile = path.join(__dirname, "data", "dispatches.json"); // Path to the JSON file for storing dispatches

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

  if (!customer_name || !phone_number || !emergency_issue) {
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

  const newDispatch = {
    id: `DISP-${Date.now()}`,
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
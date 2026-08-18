const express = require("express");

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

// Dispatch endpoint
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

  console.log("Emergency dispatch received:");
  console.log({
    customer_name,
    phone_number: normalizedPhone,
    emergency_issue,
  });

  res.status(200).json({
    success: true,
    message: "Dispatch received successfully",
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
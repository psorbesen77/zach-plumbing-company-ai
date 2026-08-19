const pool = require("../db");

const request = require("supertest");
const app = require("../server");


// Test suite for the Dispatch API GET
describe("Dispatch API", () => {
    // Clear the test data file before each test
    beforeEach(async () => {
        await pool.query("DELETE FROM dispatches");
    });

    afterAll(async () => {
        await pool.end();
    });


  test("GET / should return backend health status", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Zach Plumbing Company AI backend is running"
    );
  });

  // Test POST /api/dispatch with missing required fields
   test("POST /api/dispatch should create a new dispatch", async () => {
    const response = await request(app)
      .post("/api/dispatch")
      .send({
        call: {
          call_id: "jest-test-call-001",
        },
        args: {
          customer_name: "Test Customer",
          phone_number: "505-555-1111",
          emergency_issue: "Test burst pipe",
        },
      });


    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Dispatch created successfully");
    expect(response.body.dispatch.customer_name).toBe("Test Customer");
    expect(response.body.dispatch.phone_number).toBe("5055551111");
    expect(response.body.dispatch.retell_call_id).toBe("jest-test-call-001");
  });

  // Test missing required fields
  test("POST /api/dispatch should reject missing required fields", async () => {
  const response = await request(app)
    .post("/api/dispatch")
    .send({
      call: {
        call_id: "jest-test-call-002",
      },
      args: {
        customer_name: "Test Customer",
        phone_number: "",
        emergency_issue: "Burst pipe",
      },
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe(
    "Missing required dispatch information"
  );
});

// Test invalid phone number
test("POST /api/dispatch should reject an invalid phone number", async () => {
  const response = await request(app)
    .post("/api/dispatch")
    .send({
      call: {
        call_id: "jest-test-call-003",
      },
      args: {
        customer_name: "Test Customer",
        phone_number: "12345",
        emergency_issue: "Burst pipe",
      },
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe("Invalid phone number");
});

// Test duplicate dispatch for the same call_id
test("POST /api/dispatch should not create a duplicate for the same call_id", async () => {
  const payload = {
    call: {
      call_id: "jest-duplicate-call-001",
    },
    args: {
      customer_name: "Duplicate Customer",
      phone_number: "505-555-2222",
      emergency_issue: "Leaking water heater",
    },
  };

  // First request should create the dispatch
  const firstResponse = await request(app)
    .post("/api/dispatch")
    .send(payload);

  expect(firstResponse.statusCode).toBe(201);
  expect(firstResponse.body.success).toBe(true);

  // Second request uses the exact same call_id
  const secondResponse = await request(app)
    .post("/api/dispatch")
    .send(payload);

  expect(secondResponse.statusCode).toBe(200);
  expect(secondResponse.body.success).toBe(true);
  expect(secondResponse.body.message).toBe("Dispatch already exists");

  // Make sure only ONE dispatch exists
  const listResponse = await request(app).get("/api/dispatches");

  expect(listResponse.statusCode).toBe(200);
  expect(listResponse.body.count).toBe(1);
});

// Test GET to retrieve all dispatches
test("GET /api/dispatches should return all dispatches", async () => {
  await request(app)
    .post("/api/dispatch")
    .send({
      call: {
        call_id: "jest-get-all-001",
      },
      args: {
        customer_name: "Get All Customer",
        phone_number: "505-555-3333",
        emergency_issue: "Broken pipe",
      },
    });

  const response = await request(app).get("/api/dispatches");

  expect(response.statusCode).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.count).toBe(1);
  expect(response.body.dispatches).toHaveLength(1);
  expect(response.body.dispatches[0].customer_name).toBe(
    "Get All Customer"
  );
});

// Test GET to retrieve a specific dispatch
test("GET /api/dispatches/:id should return one dispatch", async () => {
  const createResponse = await request(app)
    .post("/api/dispatch")
    .send({
      call: {
        call_id: "jest-get-one-001",
      },
      args: {
        customer_name: "Single Customer",
        phone_number: "505-555-4444",
        emergency_issue: "Overflowing toilet",
      },
    });

  const dispatchId = createResponse.body.dispatch.id;

  const response = await request(app)
    .get(`/api/dispatches/${dispatchId}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.dispatch.id).toBe(dispatchId);
  expect(response.body.dispatch.customer_name).toBe("Single Customer");
});

// Test GET with an invalid ID
test("GET /api/dispatches/:id should return 404 for an invalid ID", async () => {
  const response = await request(app)
    .get("/api/dispatches/DISP-DOES-NOT-EXIST");

  expect(response.statusCode).toBe(404);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe("Dispatch not found");
});

// Test PATCH to update dispatch status
test("PATCH /api/dispatches/:id/status should update dispatch status", async () => {
  const createResponse = await request(app)
    .post("/api/dispatch")
    .send({
      call: {
        call_id: "jest-patch-valid-001",
      },
      args: {
        customer_name: "Patch Customer",
        phone_number: "505-555-5555",
        emergency_issue: "Flooded bathroom",
      },
    });

  const dispatchId = createResponse.body.dispatch.id;

  const response = await request(app)
    .patch(`/api/dispatches/${dispatchId}/status`)
    .send({
      status: "DISPATCHED",
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.message).toBe(
    "Dispatch status updated successfully"
  );
  expect(response.body.dispatch.status).toBe("DISPATCHED");
  expect(response.body.dispatch.updated_at).toBeDefined();
});

// Test PATCH with an invalid status
test("PATCH /api/dispatches/:id/status should reject an invalid status", async () => {
  const createResponse = await request(app)
    .post("/api/dispatch")
    .send({
      call: {
        call_id: "jest-patch-invalid-status-001",
      },
      args: {
        customer_name: "Invalid Status Customer",
        phone_number: "505-555-6666",
        emergency_issue: "Leaking pipe",
      },
    });

  const dispatchId = createResponse.body.dispatch.id;

  const response = await request(app)
    .patch(`/api/dispatches/${dispatchId}/status`)
    .send({
      status: "BANANA",
    });

  expect(response.statusCode).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe("Invalid dispatch status");
});

// Test PATCH with an invalid ID
test("PATCH /api/dispatches/:id/status should return 404 for an invalid ID", async () => {
  const response = await request(app)
    .patch("/api/dispatches/DISP-DOES-NOT-EXIST/status")
    .send({
      status: "DISPATCHED",
    });

  expect(response.statusCode).toBe(404);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe("Dispatch not found");
});

});
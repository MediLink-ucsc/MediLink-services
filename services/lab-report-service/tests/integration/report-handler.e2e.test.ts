import request from "supertest";
import app from "../../src/app";

describe("Report Handler Routes (legacy)", () => {
  let testTypeId: number;

  it("add test type via /report/addTestType", async () => {
    const payload = {
      value: "thyroid",
      label: "Thyroid Panel",
      category: "biochemistry",
    };
    const res = await request(app)
      .post("/api/v1/labReport/report/addTestType")
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    testTypeId = res.body.data.id;
  });

  it("get test types via /report/testTypes", async () => {
    const res = await request(app).get("/api/v1/labReport/report/testTypes");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("get single test type via /report/testType/:id", async () => {
    const res = await request(app).get(
      `/api/v1/labReport/report/testType/${testTypeId}`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testTypeId);
  });
});

import request from "supertest";
import app from "../../src/app";

describe("Template Management", () => {
  let testTypeId: number;

  it("create test type", async () => {
    const payload = {
      value: "chem_panel",
      label: "Chemistry Panel",
      category: "biochemistry",
      reportFields: [
        { name: "Glucose", type: "number", required: true, unit: "mg/dL" },
      ],
      referenceRanges: {
        Glucose: { min: 70, max: 110, unit: "mg/dL", normalRange: "70-110" },
      },
    };
    const res = await request(app)
      .post("/api/v1/labReport/template/test-types")
      .send(payload);
    expect(res.status).toBe(201);
    testTypeId = res.body.data.id;
  });

  it("update test type", async () => {
    const res = await request(app)
      .put(`/api/v1/labReport/template/test-types/${testTypeId}`)
      .send({ label: "Updated Chemistry Panel" });
    expect(res.status).toBe(200);
    expect(res.body.data.label).toBe("Updated Chemistry Panel");
  });

  it("get categories", async () => {
    const res = await request(app).get("/api/v1/labReport/template/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("get field types", async () => {
    const res = await request(app).get(
      "/api/v1/labReport/template/field-types"
    );
    expect(res.status).toBe(200);
  });
});

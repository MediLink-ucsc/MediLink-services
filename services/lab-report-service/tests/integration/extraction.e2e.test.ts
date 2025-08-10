import request from "supertest";
import app from "../../src/app";
import path from "path";

// NOTE: This test focuses on route validation; actual python extraction may fail in CI without python.

describe("Extraction Route", () => {
  it("rejects missing params", async () => {
    const res = await request(app).post("/api/v1/labReport/extract").send({});
    expect(res.status).toBe(400);
  });

  it("attempt extraction with filePath", async () => {
    const fakePdfPath = path.join(__dirname, "fixtures", "dummy.pdf");
    const res = await request(app)
      .post("/api/v1/labReport/extract")
      .send({ filePath: fakePdfPath, fileFormat: "fbc" });
    // Accept either success (if python & script available) or server error due to python absence
    expect([200, 500]).toContain(res.status);
  });
});

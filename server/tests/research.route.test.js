import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("POST /api/research validation", () => {
  it("400 when neither name nor domain is provided", async () => {
    const res = await request(app).post("/api/research").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(typeof res.body.error.message).toBe("string");
  });

  it("400 when objective exceeds 500 characters", async () => {
    const res = await request(app)
      .post("/api/research")
      .send({ name: "Acme", objective: "x".repeat(501) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 when name is not a string", async () => {
    const res = await request(app).post("/api/research").send({ name: 123 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("400 when domain is invalid", async () => {
    const res = await request(app).post("/api/research").send({ domain: "http://" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

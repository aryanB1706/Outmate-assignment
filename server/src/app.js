import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import researchRouter from "./routes/research.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/research", researchRouter);

  app.use(errorHandler);

  return app;
}

export const app = createApp();

export default app;

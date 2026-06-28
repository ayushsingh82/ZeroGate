import "dotenv/config";
import express from "express";
import cors from "cors";
import { subscribeRouter } from "./routes/subscribe";
import { protectedRouter } from "./routes/protected";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "stealth402-api" });
});

app.use("/", subscribeRouter);
app.use("/api", protectedRouter);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Stealth402 API running on :${PORT}`);
});

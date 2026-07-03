import "dotenv/config";
import express from "express";
import cors from "cors";
import { subscribeRouter } from "./routes/subscribe";
import { protectedRouter } from "./routes/protected";

const app = express();

// Allow any localhost origin (dev) and any deployed origin
app.use(cors({
  origin: true,               // reflect the request origin
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
}));

// Respond to preflight OPTIONS immediately before any route logic
app.options("*", cors({ origin: true, credentials: false }));

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

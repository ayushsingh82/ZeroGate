import "dotenv/config";
import express from "express";
import cors from "cors";
import { subscribeRouter } from "./routes/subscribe";
import { protectedRouter } from "./routes/protected";

const app = express();

const CORS_HEADERS = ["Content-Type", "Authorization", "X-ZeroGate-Session", "X-ZeroGate-Proof"];

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: CORS_HEADERS,
  credentials: false,
}));

app.options("*", cors({ origin: true, credentials: false, allowedHeaders: CORS_HEADERS }));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "zerogate-api" });
});

app.use("/", subscribeRouter);
app.use("/api", protectedRouter);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`ZeroGate API running on :${PORT}`);
});

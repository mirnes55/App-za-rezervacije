import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import restaurantRoutes from "./routes/restaurants.js";
import reservationRoutes from "./routes/reservations.js";

dotenv.config();

const app = express();
const port = process.env["PORT"] ?? 4000;
const frontendUrl = process.env["FRONTEND_URL"];

app.use(cors({ origin: frontendUrl || true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reservations", reservationRoutes);

app.listen(Number(port), () => {
  console.log(`API server running on port ${port}`);
});


import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { testConnection } from "../src/config/database";
import * as ticketController from "../src/controllers/ticket.controller";
import { logger } from "../src/utils/logger";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests" },
});

const ticketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many ticket creation requests" },
});

app.use("/api", apiLimiter);

// Health check endpoints
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "CityCard Backend API",
    version: "1.0.0",
  });
});

app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    message: "CityCard Backend API",
    version: "1.0.0",
  });
});

app.get("/health", async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: dbConnected ? "healthy" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Simple templates for chat responses
const templates = {
  az: {
    general_help: "Salam! CityCard dəstək xidmətinə xoş gəlmisiniz!",
  },
  ru: {
    general_help: "Здравствуйте! Добро пожаловать в поддержку CityCard!",
  },
};

// Chat endpoint
app.post("/api/chat/message", (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message || !language) {
      return res.status(400).json({ error: "Message and language required" });
    }

    logger.info("Chat message received", { message, language });

    res.json({
      response:
        templates[language as "az" | "ru"]?.general_help ||
        templates.az.general_help,
      source: "rule",
      needsTicket: false,
    });
  } catch (error) {
    logger.error("Chat message error", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Ticket endpoints - Use your existing controllers
app.post("/api/tickets", ticketLimiter, ticketController.createTicket);
app.get("/api/tickets", ticketController.getAllTickets);
app.get("/api/tickets/:id", ticketController.getTicketById);
app.put("/api/tickets/:id", ticketController.updateTicket);
app.delete("/api/tickets/:id", ticketController.deleteTicket);
app.post(
  "/api/tickets/:id/receipt",
  upload.single("file"),
  ticketController.uploadReceipt
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    status: "error",
    message: message,
  });
});

export default app;
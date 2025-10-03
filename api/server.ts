import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Import after express initialization to avoid circular dependencies
let testConnection: any;
let ticketController: any;
let logger: any;

try {
  const database = require("../src/config/database");
  testConnection = database.testConnection;

  ticketController = require("../src/controllers/ticket.controller");

  const loggerModule = require("../src/utils/logger");
  logger = loggerModule.logger;
} catch (error) {
  console.error("Failed to load modules:", error);
}

// CORS configuration - Temporarily allow all origins
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

app.get("/health", async (req, res) => {
  let dbConnected = false;

  if (testConnection) {
    try {
      dbConnected = await testConnection();
    } catch (err) {
      console.error("Database connection test failed:", err);
    }
  }

  res.json({
    status: dbConnected ? "healthy" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint
app.post("/api/chat/message", (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message || !language) {
      return res.status(400).json({ error: "Message and language required" });
    }

    const templates = {
      az: { general_help: "Salam! CityCard dəstək xidmətinə xoş gəlmisiniz!" },
      ru: { general_help: "Здравствуйте! Добро пожаловать в поддержку CityCard!" }
    };

    res.json({
      response: templates[language as "az" | "ru"]?.general_help || templates.az.general_help,
      source: "rule",
      needsTicket: false,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Ticket endpoints
if (ticketController) {
  app.post("/api/tickets", ticketLimiter, ticketController.createTicket);
  app.get("/api/tickets", ticketController.getAllTickets);
  app.get("/api/tickets/:id", ticketController.getTicketById);
  app.put("/api/tickets/:id", ticketController.updateTicket);
  app.delete("/api/tickets/:id", ticketController.deleteTicket);
  app.post("/api/tickets/:id/receipt", upload.single("file"), ticketController.uploadReceipt);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

export default app;
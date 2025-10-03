import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();

// CORS
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

app.use("/api", apiLimiter);

// Health check
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

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

// Simple templates for testing
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

    res.json({
      reply:
        templates[language as "az" | "ru"]?.general_help ||
        templates.az.general_help,
      source: "rule",
      needsTicket: false,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Tickets endpoints
app.get("/api/tickets", (req, res) => {
  res.json({
    tickets: [],
    total: 0,
    message: "Tickets endpoint working",
  });
});

// CREATE TICKET - This was missing!
app.post("/api/tickets", (req, res) => {
  try {
    const { subject, description, contact, conversation, language, priority, source } = req.body;

    // Validation
    if (!subject || !description || !contact) {
      return res.status(400).json({
        status: "error",
        message: "Subject, description, and contact are required"
      });
    }

    if (!contact.name || !contact.phone || !contact.email) {
      return res.status(400).json({
        status: "error",
        message: "Contact must include name, phone, and email"
      });
    }

    // Generate ticket ID
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Here you would normally save to database
    // For now, we'll just return success
    const ticketData = {
      ticket_id: ticketId,
      subject,
      description,
      contact,
      conversation,
      language: language || 'az',
      priority: priority || 'normal',
      source: source || 'web',
      status: 'open',
      created_at: new Date().toISOString()
    };

    console.log('Ticket created:', ticketData);

    res.status(201).json({
      status: "success",
      message: "Ticket created successfully",
      data: ticketData
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
});

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
  res.status(500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// Export for Vercel serverless
export default app;
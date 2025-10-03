import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "CityCard Backend API" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.post("/api/chat/message", (req, res) => {
  const { message, language } = req.body;
  const response =
    language === "ru"
      ? "Здравствуйте! Добро пожаловать в поддержку CityCard!"
      : "Salam! CityCard dəstək xidmətinə xoş gəlmisiniz!";
  res.json({ response, source: "rule", needsTicket: false });
});

export default app;

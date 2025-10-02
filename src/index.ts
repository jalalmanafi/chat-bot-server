// This file is only for local development
// Vercel uses api/index.ts instead

import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Use npm run dev for local development" });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Local dev server on http://localhost:${PORT}`);
  });
}

export default app;

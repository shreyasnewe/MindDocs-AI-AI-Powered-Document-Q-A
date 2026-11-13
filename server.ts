import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import documentRoutes from "./server/routes/documentRoutes";
import chatRoutes from "./server/routes/chatRoutes";
import quizRoutes from "./server/routes/quizRoutes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API Health Check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // API Routes
  app.use("/api/documents", documentRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/quiz", quizRoutes);

  // Global Error Handler for API routes (e.g. Multer limit errors)
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err) {
      console.error("API error encountered:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          message: "The uploaded file is too large. Maximum allowed size is 30 MB.",
        });
        return;
      }
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "An internal error occurred. Please try again.",
      });
      return;
    }
    next();
  });

  // Vite middleware in development vs static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindDocs AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

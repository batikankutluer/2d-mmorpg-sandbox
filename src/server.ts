import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response } from "express";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const app = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Statik dosyalar için klasörleri kullan
app.use("/public", express.static(path.join(__dirname, "..", "src", "public")));
app.use(
  "/dist",
  express.static(path.join(__dirname, "..", "dist", "public", "js"))
);

// Ana sayfa
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "src", "views", "index.html"));
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});

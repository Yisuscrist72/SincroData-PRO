import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { DataExchangeService } from "./services/dataExchange.service.js";

const app = express();
const port = 3000;
const upload = multer({ dest: "data_temp/uploads/" });
const exchangeService = new DataExchangeService();

// Asegurar directorios
fs.ensureDirSync("data_temp/uploads/");

app.use(express.static("public"));
app.use(express.json());

// API: Importar
app.post("/api/import/:model", upload.single("file"), async (req, res) => {
    const { model } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No hay archivo." });
    if (model !== "user" && model !== "product") return res.status(400).json({ error: "Modelo inválido." });

    try {
        const report = await exchangeService.importData(file.path, model as any);
        await fs.remove(file.path); // Limpiar archivo temporal
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API: Exportar
app.get("/api/export/:model/:format", async (req, res) => {
    const { model, format } = req.params;
    try {
        const filePath = await exchangeService.exportData(model as any, format as any);
        res.download(filePath);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API: Listar Reportes realizados
app.get("/api/reports", async (req, res) => {
    const reportsDir = path.join(process.cwd(), "reports");
    try {
        const files = await fs.readdir(reportsDir);
        const list = files.filter(f => f.endsWith("_summary.txt")).map(f => ({
            name: f,
            url: `/reports/${f}`
        }));
        res.json(list.reverse());
    } catch (e) { res.json([]); }
});

app.use("/reports", express.static("reports"));

app.listen(port, () => {
    console.log(`\n🚀 SERVIDOR INICIADO EN http://localhost:${port}`);
    console.log(`💡 Usa esta URL para grabar tu vídeo de demostración.\n`);
});

import fs from "fs-extra";
import path from "path";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";
import js2xmlparser from "js2xmlparser";
import xml2js from "xml2js";
import prisma from "../db.js";
import { UserSchema, ProductSchema } from "../schemas/validation.js";
import { z } from "zod";

export interface Report {
    processType: string;
    timestamp: Date;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    errors: { index: number | string; reason: string; detail?: any }[];
    filePath?: string;
}

export class DataExchangeService {
    private static REPORTS_DIR = path.join(process.cwd(), "reports");

    constructor() {
        fs.ensureDirSync(DataExchangeService.REPORTS_DIR);
    }

    /**
     * Importa datos desde CSV, JSON o XML
     */
    async importData(filePath: string, model: "user" | "product"): Promise<Report> {
        const ext = path.extname(filePath).toLowerCase();
        const report: Report = {
            processType: `IMPORT_${model.toUpperCase()}_${ext.toUpperCase().replace('.', '')}`,
            timestamp: new Date(),
            totalProcessed: 0,
            successCount: 0,
            failureCount: 0,
            errors: [],
        };

        const validData: any[] = [];
        const schema = model === "user" ? UserSchema : ProductSchema;
        let rawData: any[] = [];

        try {
            if (ext === ".json") {
                rawData = await fs.readJson(filePath);
                if (!Array.isArray(rawData)) throw new Error("JSON debe ser un array de objetos");
            } else if (ext === ".csv") {
                const csvData = await fs.readFile(filePath, 'utf-8');
                const parser = parse(csvData, { columns: true, skip_empty_lines: true });
                for await (const record of parser) {
                    rawData.push(record);
                }
            } else if (ext === ".xml") {
                const xmlData = await fs.readFile(filePath, 'utf-8');
                const result = await xml2js.parseStringPromise(xmlData, { explicitArray: false });
                // El XML suele tener una raíz, ej: <users><user>...</user></users>
                const rootName = Object.keys(result)[0];
                const items = result[rootName];
                const entityName = Object.keys(items)[0];
                rawData = Array.isArray(items[entityName]) ? items[entityName] : [items[entityName]];
            } else {
                throw new Error("Formato no soportado. Use .json, .csv o .xml");
            }

            // Validación con Zod
            rawData.forEach((item, index) => {
                report.totalProcessed++;
                const result = schema.safeParse(item);
                if (result.success) {
                    validData.push(result.data);
                } else {
                    report.failureCount++;
                    const issues = (result as any).error.issues || [];
                    report.errors.push({ 
                        index: index + 1, 
                        reason: "Error de Validación", 
                        detail: issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') 
                    });
                }
            });

            // Inserción masiva eficiente
            if (validData.length > 0) {
                const prismaModel = model === "user" ? prisma.user : prisma.product;
                const result = await (prismaModel as any).createMany({
                    data: validData,
                    skipDuplicates: true,
                });
                // Éxitos finales = los que pasaron validación y no se saltaron por duplicidad (si skipDuplicates funciona así)
                // Realmente createMany indica cuántos insertó satisfactoriamente.
                report.successCount = result.count;
            }

        } catch (error: any) {
            report.errors.push({ index: "SISTEMA", reason: "Error de procesamiento crítico", detail: error.message });
        }

        const reportPaths = await this.saveReport(report);
        report.filePath = reportPaths.summary;
        return report;
    }

    /**
     * Exporta datos en formatos CSV, JSON o XML
     */
    async exportData(model: "user" | "product", format: "json" | "csv" | "xml"): Promise<string> {
        let data: any[];

        if (model === "user") {
            data = await prisma.user.findMany({
                select: { email: true, role: true, createdAt: true }
            });
        } else {
            data = await prisma.product.findMany({
                select: { name_es: true, name_en: true, name_fr: true, name_de: true, description_es: true }
            });
        }

        const fileName = `export_${model}_${Date.now()}.${format}`;
        const filePath = path.join(DataExchangeService.REPORTS_DIR, fileName);

        let content: string = "";

        if (format === "json") {
            content = JSON.stringify(data, null, 2);
        } else if (format === "csv") {
            content = stringify(data, { header: true });
        } else if (format === "xml") {
            // El parseador rodea la lista con un elemento raíz plural
            content = js2xmlparser.parse(model + "s", { [model]: data });
        }

        await fs.writeFile(filePath, content);
        return filePath;
    }

    private async saveReport(report: Report): Promise<{ json: string, summary: string }> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseName = `report_${report.processType}_${timestamp}`;
        
        const jsonPath = path.join(DataExchangeService.REPORTS_DIR, `${baseName}.json`);
        const summaryPath = path.join(DataExchangeService.REPORTS_DIR, `${baseName}_summary.txt`);

        await fs.writeJson(jsonPath, report, { spaces: 2 });

        const summaryText = `
╔═════════════════════════════════════════════════════════════╗
  INFORME DE PROCESO: ${report.processType}
  Fecha: ${report.timestamp.toLocaleString()}
╚═════════════════════════════════════════════════════════════╝

RESUMEN DE OPERACIÓN:
-----------------------------------------
- Total registros procesados: ${report.totalProcessed}
- Importaciones exitosas:     ${report.successCount}
- Registros con fallos:       ${report.failureCount}

LISTADO DETALLADO DE ERRORES:
-----------------------------------------
${report.errors.length > 0 
    ? report.errors.map(e => `👉 [Fila/Índice: ${e.index}] ${e.reason}: ${e.detail}`).join('\n')
    : "✅ No se detectaron errores de validación."}

-----------------------------------------
Fin del informe detallado.
`;
        await fs.writeFile(summaryPath, summaryText);

        return { json: jsonPath, summary: summaryPath };
    }
}


import fs from "fs-extra";
import path from "path";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";
import js2xmlparser from "js2xmlparser";
import prisma from "../db.js";
import { UserSchema, ProductSchema } from "../schemas/validation.js";
import { z } from "zod";

export interface Report {
    processType: string;
    timestamp: Date;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    errors: { index: number | string; reason: string; data?: any }[];
}

export class DataExchangeService {
    private static REPORTS_DIR = path.join(process.cwd(), "reports");

    constructor() {
        fs.ensureDirSync(DataExchangeService.REPORTS_DIR);
    }

    /**
     * Importa datos desde CSV o JSON de forma eficiente
     */
    async importData(filePath: string, model: "user" | "product"): Promise<Report> {
        const ext = path.extname(filePath).toLowerCase();
        const report: Report = {
            processType: `IMPORT_${model.toUpperCase()}_${ext.toUpperCase()}`,
            timestamp: new Date(),
            totalProcessed: 0,
            successCount: 0,
            failureCount: 0,
            errors: [],
        };

        const validData: any[] = [];
        const schema = model === "user" ? UserSchema : ProductSchema;

        try {
            if (ext === ".json") {
                const rawData = await fs.readJson(filePath);
                if (!Array.isArray(rawData)) throw new Error("JSON debe ser un array");

                rawData.forEach((item, index) => {
                    report.totalProcessed++;
                    const result = schema.safeParse(item);
                    if (result.success) {
                        validData.push(result.data);
                    } else {
                        report.failureCount++;
                        report.errors.push({ index, reason: "Validation Error", data: result.error.format() });
                    }
                });
            } else if (ext === ".csv") {
                const parser = fs.createReadStream(filePath).pipe(parse({ columns: true, skip_empty_lines: true }));

                let index = 0;
                for await (const record of parser) {
                    report.totalProcessed++;
                    const result = schema.safeParse(record);
                    if (result.success) {
                        validData.push(result.data);
                    } else {
                        report.failureCount++;
                        report.errors.push({ index, reason: "Validation Error", data: result.error.format() });
                    }
                    index++;
                }
            }

            // Inserción masiva eficiente
            if (validData.length > 0) {
                const prismaModel = model === "user" ? prisma.user : prisma.product;
                const result = await (prismaModel as any).createMany({
                    data: validData,
                    skipDuplicates: true,
                });
                report.successCount = result.count;
                // Los duplicados saltados no se cuentan como errores técnicos en este caso pero se podría ajustar
            }

        } catch (error: any) {
            report.errors.push({ index: "SYSTEM", reason: error.message });
        }

        await this.saveReport(report);
        return report;
    }

    /**
     * Exporta datos en múltiples formatos
     */
    async exportData(model: "user" | "product", format: "json" | "csv" | "xml"): Promise<string> {
        let data: any[];

        if (model === "user") {
            data = await prisma.user.findMany({
                include: { purchases: { include: { reservations: true } } }
            });
        } else {
            data = await prisma.product.findMany({
                include: { priceIntervals: true }
            });
        }

        const fileName = `export_${model}_${Date.now()}.${format}`;
        const filePath = path.join(DataExchangeService.REPORTS_DIR, fileName);

        let content: string = "";

        if (format === "json") {
            content = JSON.stringify(data, null, 2);
        } else if (format === "csv") {
            // Para CSV, aplanamos un poco si hay anidamiento o simplemente exportamos campos base
            content = stringify(data, { header: true });
        } else if (format === "xml") {
            content = js2xmlparser.parse(model, data);
        }

        await fs.writeFile(filePath, content);
        return filePath;
    }

    private async saveReport(report: Report) {
        const reportFileName = `report_${report.processType}_${Date.now()}.json`;
        await fs.writeJson(path.join(DataExchangeService.REPORTS_DIR, reportFileName), report, { spaces: 2 });
    }
}

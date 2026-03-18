import { ReportSystem } from './services/ReportSystem.js';
import fs from "fs-extra";
import path from "path";

/**
 * Script de demostración para el sistema de informes.
 * Ejecuta diversas consultas parametrizadas y guarda los resultados en un archivo.
 */
async function runDemo() {
    const reportSystem = new ReportSystem();
    const reportsDir = path.join(process.cwd(), "reports");
    await fs.ensureDir(reportsDir);

    console.log("\n--- INICIANDO SISTEMA DE INFORMES RELACIONALES ---");
    console.log("Objetivo: Consultas Parametrizadas y Gestión de Recursos");

    try {
        // 1. Informe de Compras de un Usuario Específico (Inyección SQL Protegida)
        // Equivalente a JDBC: pstmt.setString(1, "admin@empresa.com"); rs = pstmt.executeQuery();
        const emailToSearch = "admin@empresa.com";
        console.log(`\n[1] Consultando compras para: ${emailToSearch}...`);
        const purchases = await reportSystem.listUserPurchases(emailToSearch);
        console.log(`>> Encontradas ${purchases.length} compras.`);

        // 2. Informe de Reservas de Productos (Optimización por Fechas y Agrupación)
        // Equivalente a JDBC: pstmt.setTimestamp(1, start); pstmt.setTimestamp(2, end);
        const startDate = new Date("2020-01-01");
        const endDate = new Date(); // Hoy
        console.log(`\n[2] Consultando productos reservados entre ${startDate.toLocaleDateString()} y ${endDate.toLocaleDateString()}...`);
        const productReport = await reportSystem.getProductReservationsReport(startDate, endDate);
        console.log(`>> ${productReport.length} productos con actividad de reserva.`);
        if (productReport.length > 0) {
            console.log(`   Producto más reservado: ${productReport[0].product_name} (${productReport[0].total_units} unidades).`);
        }

        // 3. Usuarios con Gasto Superior a un Límite (Filtro por Parámetro Numérico)
        // Equivalente a JDBC: pstmt.setDouble(1, 1500.0);
        const minSpent = 1500;
        console.log(`\n[3] Buscando usuarios con gasto total >= ${minSpent}...`);
        const topSpenders = await reportSystem.getTopSpendingUsers(minSpent);
        console.log(`>> ${topSpenders.length} usuarios encontrados con este nivel de gasto.`);

        // 4. Persistencia del Informe Generado
        const reportFilename = `report_export_${Date.now()}.json`;
        const reportPath = path.join(reportsDir, reportFilename);

        const fullReport = {
            metadata: {
                timestamp: new Date().toISOString(),
                parameters: { emailToSearch, minSpent, dateRange: { startDate, endDate } }
            },
            results: {
                userPurchases: purchases,
                productReservationSummary: productReport,
                highSpendingUsers: topSpenders
            }
        };

        await fs.writeJson(reportPath, fullReport, { spaces: 4 });
        console.log(`\n--- INFORME GENERADO CORRECTAMENTE EN /reports/${reportFilename} ---`);

    } catch (err) {
        console.error("\nError crítico durante la generación del informe:", err);
    } finally {
        // Liberación de recursos (Pool)
        // Equivalente a pool.close() en JDBC Connection Pool
        await reportSystem.shutdown();
    }
}

runDemo().catch(console.error);

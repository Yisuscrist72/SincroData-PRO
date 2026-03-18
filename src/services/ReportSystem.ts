import pg from 'pg';
import 'dotenv/config';

/**
 * ReportSystem implementa la lógica para realizar consultas parametrizadas
 * sobre la base de datos de la empresa, siguiendo los principios de 
 * seguridad y optimización solicitados (Equivalente a JDBC en Java).
 */
export class ReportSystem {
    private pool: pg.Pool;

    constructor() {
        // El Pool gestiona el ciclo de vida de las conexiones (Cierre de recursos automático al liberar)
        this.pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL
        });
    }

    /**
     * Informe 1: Detalle de compras de un usuario.
     * 
     * @param userEmail Email del usuario para filtrar (Parámetro)
     * Concepto: Utiliza "PreparedStatements" (vía placeholders $1) para evitar SQL Injection.
     * Optimización: Selección de campos específicos y JOIN con Purchase.
     */
    async listUserPurchases(userEmail: string) {
        let client;
        try {
            // "Cierra todos los recursos correctamente": obtenemos cliente y aseguramos su liberación
            client = await this.pool.connect();

            const query = `
                SELECT 
                    u.email, 
                    p.id as purchase_id, 
                    p.total, 
                    p.status, 
                    p."createdAt" 
                FROM "User" u
                JOIN "Purchase" p ON u.id = p."userId"
                WHERE u.email = $1
                ORDER BY p."createdAt" DESC;
            `;

            // Ejecución parametrizada (PreparedStatement en pg)
            const result = await client.query(query, [userEmail]);

            // Gestion del "ResultSet" (result.rows en Node.js)
            return result.rows;
        } catch (error) {
            console.error("Error en consulta de compras:", error);
            throw error;
        } finally {
            // Liberación del recurso (Equivalente a conn.close() en JDBC cuando se usa pool)
            if (client) client.release();
        }
    }

    /**
     * Informe 2: Resumen de reservas por producto en un rango de fechas.
     * 
     * Concepto: Consulta optimizada mediante agrupación SQL para mejorar el rendimiento 
     * evitando traer miles de líneas de detalle al cliente.
     */
    async getProductReservationsReport(startDate: Date, endDate: Date) {
        let client;
        try {
            client = await this.pool.connect();

            // SQL Parametrizado
            const query = `
                SELECT 
                    pr.name_es as product_name, 
                    SUM(res.quantity) as total_units,
                    COUNT(res.id) as total_reservations,
                    MIN(res."reserveDate") as first_date,
                    MAX(res."reserveDate") as last_date
                FROM "Product" pr
                JOIN "Reservation" res ON pr.id = res."productId"
                WHERE res."reserveDate" >= $1 AND res."reserveDate" <= $2
                GROUP BY pr.id, pr.name_es
                HAVING SUM(res.quantity) > 0
                ORDER BY total_units DESC;
            `;

            const result = await client.query(query, [startDate, endDate]);
            return result.rows;
        } catch (error) {
            console.error("Error en informe de productos:", error);
            throw error;
        } finally {
            if (client) client.release();
        }
    }

    /**
     * Informe 3: Usuarios con roles específicos y su gasto total.
     * 
     * Optimización: JOIN múltiple y filtrado eficiente.
     */
    async getTopSpendingUsers(minTotal: number) {
        let client;
        try {
            client = await this.pool.connect();

            const query = `
                SELECT 
                    u.email, 
                    u.role, 
                    SUM(p.total) as total_spent
                FROM "User" u
                JOIN "Purchase" p ON u.id = p."userId"
                WHERE p.status = 'PAID' OR p.status = 'PENDING'
                GROUP BY u.id, u.email, u.role
                HAVING SUM(p.total) >= $1
                ORDER BY total_spent DESC;
            `;

            const result = await client.query(query, [minTotal]);
            return result.rows;
        } catch (error) {
            console.error("Error en informe de gastos:", error);
            throw error;
        } finally {
            if (client) client.release();
        }
    }

    /**
     * Método para cerrar el pool de conexiones al finalizar la aplicación.
     */
    async shutdown() {
        await this.pool.end();
        console.log("Pool de conexiones cerrado.");
    }
}

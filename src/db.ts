import "dotenv/config";
import PrismaPkg from "@prisma/client";
const { PrismaClient } = PrismaPkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * En Prisma 7.4.1, para conexiones directas (como PostgreSQL en Docker),
 * es obligatorio el uso de un driver adapter ya que el motor nativo 
 * ha sido depreciado en favor de adaptadores basados en JS.
 */
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
export { prisma };

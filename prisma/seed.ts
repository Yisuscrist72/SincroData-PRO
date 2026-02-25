import "dotenv/config";
import PrismaPkg from "@prisma/client";
const { PrismaClient, Role } = PrismaPkg;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// En Prisma 7, para conexiones directas, debemos usar el adaptador
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("--- Iniciando Seeding ---");

    // 1. Limpieza de tablas
    console.log("Limpiando base de datos...");
    await prisma.reservation.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.token.deleteMany();
    await prisma.product.deleteMany();
    await prisma.priceInterval.deleteMany();
    await prisma.user.deleteMany();

    // 2. Crear Usuarios
    console.log("Creando usuarios...");
    const user1 = await prisma.user.create({
        data: {
            email: "admin@empresa.com",
            password: "password123",
            role: Role.ADMIN,
        },
    });

    const user2 = await prisma.user.create({
        data: {
            email: "manager@empresa.com",
            password: "password123",
            role: Role.MANAGER,
        },
    });

    const user3 = await prisma.user.create({
        data: {
            email: "user1@cliente.com",
            password: "password123",
            role: Role.USER,
        },
    });

    const user4 = await prisma.user.create({
        data: {
            email: "user2@cliente.com",
            password: "password123",
            role: Role.USER,
        },
    });

    // 3. Crear Intervalos
    console.log("Creando intervalos...");
    const interval1 = await prisma.priceInterval.create({
        data: {
            name: "Temporada Baja",
            startDate: new Date("2025-01-01"),
            endDate: new Date("2025-03-31"),
            price: 50.0,
        },
    });

    const interval2 = await prisma.priceInterval.create({
        data: {
            name: "Temporada Media",
            startDate: new Date("2025-04-01"),
            endDate: new Date("2025-06-30"),
            price: 80.0,
        },
    });

    const interval3 = await prisma.priceInterval.create({
        data: {
            name: "Temporada Alta",
            startDate: new Date("2025-07-01"),
            endDate: new Date("2025-08-31"),
            price: 150.0,
        },
    });

    const interval4 = await prisma.priceInterval.create({
        data: {
            name: "Oferta Navidad",
            startDate: new Date("2025-12-01"),
            endDate: new Date("2025-12-31"),
            price: 120.0,
        },
    });

    // 4. Crear Productos
    console.log("Creando productos...");
    const product1 = await prisma.product.create({
        data: {
            name_es: "Laptop Pro",
            name_en: "Laptop Pro",
            name_fr: "Laptop Pro",
            name_de: "Laptop Pro",
            priceIntervals: { connect: [{ id: interval1.id }] },
        },
    });

    const product2 = await prisma.product.create({
        data: {
            name_es: "Smartphone Galaxy",
            name_en: "Smartphone Galaxy",
            name_fr: "Smartphone Galaxy",
            name_de: "Smartphone Galaxy",
            priceIntervals: { connect: [{ id: interval2.id }] },
        },
    });

    // 5. Compras y Reservas
    console.log("Creando compras...");
    await prisma.purchase.create({
        data: {
            userId: user3.id,
            total: 100.0,
            reservations: {
                create: {
                    productId: product1.id,
                    reserveDate: new Date(),
                    quantity: 1,
                },
            },
        },
    });

    console.log("--- Seeding completado ---");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';
import path from 'path';

config(); // Loads .env from root directory

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL,
    },
});

import { z } from "zod";
import PrismaPkg from "@prisma/client";
const { Role } = PrismaPkg;

export const UserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(Role).default(Role.USER),
});

export const ProductSchema = z.object({
    name_es: z.string().min(1),
    name_en: z.string().min(1),
    name_fr: z.string().min(1),
    name_de: z.string().min(1),
    description_es: z.string().optional().nullable(),
    description_en: z.string().optional().nullable(),
    description_fr: z.string().optional().nullable(),
    description_de: z.string().optional().nullable(),
});

export type UserInput = z.infer<typeof UserSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;

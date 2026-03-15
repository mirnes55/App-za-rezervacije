import { PrismaClient } from "./generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL nije postavljen u .env");
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  console.error("DATABASE_URL nije postavljen.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("lozinka123", 10);
  const vlasnik = await prisma.user.upsert({
    where: { email: "vlasnik@test.ba" },
    update: {},
    create: {
      email: "vlasnik@test.ba",
      passwordHash: hash,
      ime: "Test",
      prezime: "Vlasnik",
      role: "VLASNIK",
    },
  });
  const gost = await prisma.user.upsert({
    where: { email: "gost@test.ba" },
    update: {},
    create: {
      email: "gost@test.ba",
      passwordHash: hash,
      ime: "Test",
      prezime: "Gost",
      role: "GOST",
    },
  });

  let restoran = await prisma.restaurant.findFirst({ where: { ownerId: vlasnik.id, naziv: "Test Restoran" } });
  if (!restoran) {
    restoran = await prisma.restaurant.create({
      data: {
        ownerId: vlasnik.id,
        naziv: "Test Restoran",
        opis: "Opis test restorana.",
        grad: "Sarajevo",
        adresa: "Test ulica 1",
        radnoVrijeme: "09–23",
        telefon: "+387 33 123 456",
      },
    });
  }

  let raspored = await prisma.floorPlan.findFirst({ where: { restaurantId: restoran.id, naziv: "Prizemlje" } });
  if (!raspored) {
    raspored = await prisma.floorPlan.create({
      data: { restaurantId: restoran.id, naziv: "Prizemlje", width: 10, height: 10 },
    });
  }

  const postojiSto = await prisma.table.findFirst({ where: { floorPlanId: raspored.id, naziv: "Sto 1" } });
  if (!postojiSto) {
    await prisma.table.create({
      data: { floorPlanId: raspored.id, naziv: "Sto 1", kapacitet: 4, positionX: 1, positionY: 1 },
    });
  }

  console.log("Seed završen. Korisnici: vlasnik@test.ba / gost@test.ba (lozinka: lozinka123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

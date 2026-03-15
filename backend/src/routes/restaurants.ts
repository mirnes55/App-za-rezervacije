import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { Role } from "../generated/prisma/index.js";

const router = Router();

// Javna lista restorana (svi mogu vidjeti)
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const grad = _req.query.grad;
    const gradStr = typeof grad === "string" ? grad : undefined;
    const restorani = await prisma.restaurant.findMany({
      where: gradStr ? { grad: gradStr } : {},
      include: {
        owner: { select: { ime: true, prezime: true } },
        floorPlans: { include: { tables: true } },
      },
    });
    res.json(restorani);
  } catch (e) {
    console.error(e);
    res.status(500).json({ greska: "Greška pri učitavanju restorana." });
  }
});

// Rute s /floor-plans/ moraju biti ispred /:id da "floor-plans" ne bude tretiran kao id
router.get("/floor-plans/:floorPlanId/tables", async (req: Request, res: Response): Promise<void> => {
  try {
    const tables = await prisma.table.findMany({
      where: { floorPlanId: req.params["floorPlanId"] as string },
    });
    res.json(tables);
  } catch (e) {
    console.error(e);
    res.status(500).json({ greska: "Greška pri učitavanju stolova." });
  }
});

router.post(
  "/floor-plans/:floorPlanId/tables",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const fp = await prisma.floorPlan.findUnique({
        where: { id: req.params["floorPlanId"] as string as string },
        include: { restaurant: true },
      });
      if (!fp) {
        res.status(404).json({ greska: "Raspored nije pronađen." });
        return;
      }
      if (req.auth.role === Role.VLASNIK && fp.restaurant.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Nemate dozvolu." });
        return;
      }
      const { naziv, kapacitet, positionX, positionY } = req.body as {
        naziv?: string;
        kapacitet?: number;
        positionX?: number;
        positionY?: number;
      };
      if (!naziv?.trim()) {
        res.status(400).json({ greska: "Naziv stola je obavezan." });
        return;
      }
      const table = await prisma.table.create({
        data: {
          floorPlanId: req.params["floorPlanId"] as string,
          naziv: naziv.trim(),
          kapacitet: kapacitet ?? 2,
          positionX: positionX ?? 0,
          positionY: positionY ?? 0,
        },
      });
      res.status(201).json(table);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri kreiranju stola." });
    }
  }
);

router.put(
  "/floor-plans/:floorPlanId/tables/:tableId",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const tbl = await prisma.table.findUnique({
        where: { id: req.params["tableId"] as string },
        include: { floorPlan: { include: { restaurant: true } } },
      });
      if (!tbl || tbl.floorPlanId !== (req.params["floorPlanId"] as string)) {
        res.status(404).json({ greska: "Sto nije pronađen." });
        return;
      }
      const fp = await prisma.floorPlan.findUnique({ where: { id: tbl.floorPlanId }, include: { restaurant: true } });
      if (req.auth.role === Role.VLASNIK && fp && fp.restaurant.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Nemate dozvolu." });
        return;
      }
      const { naziv, kapacitet, positionX, positionY } = req.body as {
        naziv?: string;
        kapacitet?: number;
        positionX?: number;
        positionY?: number;
      };
      const updated = await prisma.table.update({
        where: { id: req.params["tableId"] as string },
        data: {
          ...(naziv !== undefined && { naziv: naziv.trim() }),
          ...(kapacitet !== undefined && { kapacitet }),
          ...(positionX !== undefined && { positionX }),
          ...(positionY !== undefined && { positionY }),
        },
      });
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri ažuriranju stola." });
    }
  }
);

router.delete(
  "/floor-plans/:floorPlanId/tables/:tableId",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const tbl = await prisma.table.findUnique({
        where: { id: req.params["tableId"] as string },
        include: { floorPlan: { include: { restaurant: true } } },
      });
      if (!tbl || tbl.floorPlanId !== (req.params["floorPlanId"] as string)) {
        res.status(404).json({ greska: "Sto nije pronađen." });
        return;
      }
      const fpDel = await prisma.floorPlan.findUnique({ where: { id: tbl.floorPlanId }, include: { restaurant: true } });
      if (req.auth.role === Role.VLASNIK && fpDel && fpDel.restaurant.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Nemate dozvolu." });
        return;
      }
      await prisma.table.delete({ where: { id: req.params["tableId"] as string } });
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri brisanju stola." });
    }
  }
);

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params["id"] as string },
      include: {
        owner: { select: { ime: true, prezime: true, email: true } },
        floorPlans: { include: { tables: true } },
      },
    });
    if (!restaurant) {
      res.status(404).json({ greska: "Restoran nije pronađen." });
      return;
    }
    res.json(restaurant);
  } catch (e) {
    console.error(e);
    res.status(500).json({ greska: "Greška pri učitavanju restorana." });
  }
});

// Kreiranje i uređivanje – samo vlasnik ili admin
router.post(
  "/",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const { naziv, opis, adresa, grad, radnoVrijeme, telefon } = req.body as {
        naziv?: string;
        opis?: string;
        adresa?: string;
        grad?: string;
        radnoVrijeme?: string;
        telefon?: string;
      };
      if (!naziv?.trim()) {
        res.status(400).json({ greska: "Naziv restorana je obavezan." });
        return;
      }
      const ownerId = req.auth.role === Role.ADMIN ? (req.body.ownerId as string) ?? req.auth.userId : req.auth.userId;
      const restaurant = await prisma.restaurant.create({
        data: {
          ownerId,
          naziv: naziv.trim(),
          opis: opis?.trim() ?? null,
          adresa: adresa?.trim() ?? null,
          grad: grad?.trim() ?? null,
          radnoVrijeme: radnoVrijeme?.trim() ?? null,
          telefon: telefon?.trim() ?? null,
        },
      });
      res.status(201).json(restaurant);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri kreiranju restorana." });
    }
  }
);

router.put(
  "/:id",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const existing = await prisma.restaurant.findUnique({ where: { id: req.params["id"] as string } });
      if (!existing) {
        res.status(404).json({ greska: "Restoran nije pronađen." });
        return;
      }
      if (req.auth.role === Role.VLASNIK && existing.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Možete uređivati samo svoj restoran." });
        return;
      }
      const { naziv, opis, adresa, grad, radnoVrijeme, telefon } = req.body as {
        naziv?: string;
        opis?: string;
        adresa?: string;
        grad?: string;
        radnoVrijeme?: string;
        telefon?: string;
      };
      const restaurant = await prisma.restaurant.update({
        where: { id: req.params["id"] as string },
        data: {
          ...(naziv !== undefined && { naziv: naziv.trim() }),
          ...(opis !== undefined && { opis: opis?.trim() }),
          ...(adresa !== undefined && { adresa: adresa?.trim() }),
          ...(grad !== undefined && { grad: grad?.trim() }),
          ...(radnoVrijeme !== undefined && { radnoVrijeme: radnoVrijeme?.trim() }),
          ...(telefon !== undefined && { telefon: telefon?.trim() }),
        },
      });
      res.json(restaurant);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri ažuriranju restorana." });
    }
  }
);

// Rasporedi (floor plans)
router.get("/:id/floor-plans", async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.floorPlan.findMany({
      where: { restaurantId: req.params["id"] as string },
      include: { tables: true },
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ greska: "Greška pri učitavanju rasporeda." });
  }
});

router.post(
  "/:id/floor-plans",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params["id"] as string } });
      if (!restaurant) {
        res.status(404).json({ greska: "Restoran nije pronađen." });
        return;
      }
      if (req.auth.role === Role.VLASNIK && restaurant.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Nemate dozvolu." });
        return;
      }
      const { naziv, width, height } = req.body as { naziv?: string; width?: number; height?: number };
      if (!naziv?.trim()) {
        res.status(400).json({ greska: "Naziv rasporeda je obavezan." });
        return;
      }
      const floorPlan = await prisma.floorPlan.create({
        data: {
          restaurantId: req.params["id"] as string,
          naziv: naziv.trim(),
          width: width ?? 10,
          height: height ?? 10,
        },
      });
      res.status(201).json(floorPlan);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri kreiranju rasporeda." });
    }
  }
);

router.put(
  "/floor-plans/:floorPlanId",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const fp = await prisma.floorPlan.findUnique({
        where: { id: req.params["floorPlanId"] as string as string },
        include: { restaurant: true },
      });
      if (!fp) {
        res.status(404).json({ greska: "Raspored nije pronađen." });
        return;
      }
      if (req.auth.role === Role.VLASNIK && fp.restaurant.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Nemate dozvolu." });
        return;
      }
      const { naziv, width, height } = req.body as { naziv?: string; width?: number; height?: number };
      const updated = await prisma.floorPlan.update({
        where: { id: req.params["floorPlanId"] as string as string },
        data: {
          ...(naziv !== undefined && { naziv: naziv.trim() }),
          ...(width !== undefined && { width }),
          ...(height !== undefined && { height }),
        },
      });
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri ažuriranju rasporeda." });
    }
  }
);

router.delete(
  "/floor-plans/:floorPlanId",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const fp = await prisma.floorPlan.findUnique({
        where: { id: req.params["floorPlanId"] as string as string },
        include: { restaurant: true },
      });
      if (!fp) {
        res.status(404).json({ greska: "Raspored nije pronađen." });
        return;
      }
      if (req.auth.role === Role.VLASNIK && fp.restaurant.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Nemate dozvolu." });
        return;
      }
      await prisma.floorPlan.delete({ where: { id: req.params["floorPlanId"] as string } });
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri brisanju rasporeda." });
    }
  }
);

export default router;

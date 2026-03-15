import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { Role } from "../generated/prisma/index.js";
import { ReservationStatus } from "../generated/prisma/index.js";

const router = Router();

// Moje rezervacije (gost)
router.get("/me", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) return;
    const list = await prisma.reservation.findMany({
      where: { userId: req.auth.userId },
      include: {
        restaurant: { select: { id: true, naziv: true, adresa: true, grad: true } },
        table: { select: { id: true, naziv: true } },
      },
      orderBy: { datumVrijemeOd: "desc" },
    });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ greska: "Greška pri učitavanju rezervacija." });
  }
});

// Rezervacije restorana (vlasnik/admin) – mogu filtrirati po datumu i statusu
router.get(
  "/restaurant/:restaurantId",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: req.params["restaurantId"] as string },
      });
      if (!restaurant) {
        res.status(404).json({ greska: "Restoran nije pronađen." });
        return;
      }
      if (req.auth.role === Role.VLASNIK && restaurant.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Nemate dozvolu." });
        return;
      }
      const od = typeof req.query.od === "string" ? req.query.od : undefined;
      const do_ = typeof req.query.do === "string" ? req.query.do : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const list = await prisma.reservation.findMany({
        where: {
          restaurantId: req.params["restaurantId"] as string,
          ...(od && do_ && {
            datumVrijemeOd: { gte: new Date(od) },
            datumVrijemeDo: { lte: new Date(do_) },
          }),
          ...(status && { status: status as ReservationStatus }),
        },
        include: {
          user: { select: { id: true, ime: true, prezime: true, email: true } },
          table: { select: { id: true, naziv: true } },
        },
        orderBy: { datumVrijemeOd: "asc" },
      });
      res.json(list);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri učitavanju rezervacija." });
    }
  }
);

// Kreiranje rezervacije (gost) – provjera zauzetosti
router.post(
  "/restaurant/:restaurantId",
  authMiddleware,
  requireRole(Role.GOST, Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const { tableId, brojOsoba, datumVrijemeOd, datumVrijemeDo, napomena } = req.body as {
        tableId?: string;
        brojOsoba?: number;
        datumVrijemeOd?: string;
        datumVrijemeDo?: string;
        napomena?: string;
      };
      const restaurantId = req.params["restaurantId"] as string;
      if (!brojOsoba || brojOsoba < 1 || !datumVrijemeOd || !datumVrijemeDo) {
        res.status(400).json({
          greska: "Potrebni su: brojOsoba, datumVrijemeOd i datumVrijemeDo.",
        });
        return;
      }
      const od = new Date(datumVrijemeOd);
      const do_ = new Date(datumVrijemeDo);
      if (isNaN(od.getTime()) || isNaN(do_.getTime()) || od >= do_) {
        res.status(400).json({ greska: "Neispravan datum ili vrijeme." });
        return;
      }
      if (od < new Date()) {
        res.status(400).json({ greska: "Rezervacija ne može biti u prošlosti." });
        return;
      }
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        res.status(404).json({ greska: "Restoran nije pronađen." });
        return;
      }
      if (tableId) {
        const table = await prisma.table.findFirst({
          where: { id: tableId, floorPlan: { restaurantId } },
        });
        if (!table) {
          res.status(400).json({ greska: "Sto nije pronađen u ovom restoranu." });
          return;
        }
        if (table.kapacitet < brojOsoba) {
          res.status(400).json({ greska: "Sto nema dovoljno mjesta." });
          return;
        }
        const preklapanje = await prisma.reservation.findFirst({
          where: {
            tableId,
            status: { in: [ReservationStatus.NA_CEKANJU, ReservationStatus.POTVRDJENA] },
            OR: [
              { datumVrijemeOd: { lt: do_ }, datumVrijemeDo: { gt: od } },
            ],
          },
        });
        if (preklapanje) {
          res.status(409).json({ greska: "Sto je već rezervisan u odabranom terminu." });
          return;
        }
      }
      const reservation = await prisma.reservation.create({
        data: {
          restaurantId,
          tableId: tableId ?? null,
          userId: req.auth.userId,
          brojOsoba,
          datumVrijemeOd: od,
          datumVrijemeDo: do_,
          napomena: napomena?.trim() ?? null,
        },
        include: {
          restaurant: { select: { naziv: true } },
          table: { select: { naziv: true } },
        },
      });
      res.status(201).json(reservation);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri kreiranju rezervacije." });
    }
  }
);

// Ažuriranje statusa rezervacije (vlasnik/admin)
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole(Role.VLASNIK, Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.auth) return;
      const { status } = req.body as { status?: string };
      const validStatuses = [ReservationStatus.NA_CEKANJU, ReservationStatus.POTVRDJENA, ReservationStatus.OTAKZANA];
      if (!status || !validStatuses.includes(status as ReservationStatus)) {
        res.status(400).json({ greska: "Status mora biti: NA_CEKANJU, POTVRDJENA ili OTAKZANA." });
        return;
      }
const reservation = await prisma.reservation.findUnique({
      where: { id: req.params["id"] as string },
      include: { restaurant: true },
    });
    if (!reservation) {
      res.status(404).json({ greska: "Rezervacija nije pronađena." });
      return;
    }
    if (req.auth.role === Role.VLASNIK && reservation.restaurant.ownerId !== req.auth.userId) {
        res.status(403).json({ greska: "Nemate dozvolu." });
        return;
      }
      const updated = await prisma.reservation.update({
        where: { id: req.params["id"] as string },
        data: { status: status as ReservationStatus },
      });
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ greska: "Greška pri ažuriranju statusa." });
    }
  }
);

export default router;

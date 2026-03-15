import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { Role } from "../generated/prisma/index.js";
import type { AuthPayload } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env["JWT_SECRET"] ?? "dev-secret-promijeni";

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, lozinka, ime, prezime, uloga } = req.body as {
      email?: string;
      lozinka?: string;
      ime?: string;
      prezime?: string;
      uloga?: string;
    };
    if (!email || !lozinka || !ime || !prezime) {
      res.status(400).json({
        greska: "Potrebni su: email, lozinka, ime i prezime.",
      });
      return;
    }
    const role = uloga === "VLASNIK" ? Role.VLASNIK : Role.GOST;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ greska: "Korisnik s ovim emailom već postoji." });
      return;
    }
    const passwordHash = await bcrypt.hash(lozinka, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        ime,
        prezime,
        role,
      },
    });
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      korisnik: {
        id: user.id,
        email: user.email,
        ime: user.ime,
        prezime: user.prezime,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ greska: "Greška pri registraciji." });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, lozinka } = req.body as { email?: string; lozinka?: string };
    if (!email || !lozinka) {
      res.status(400).json({ greska: "Unesite email i lozinku." });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(lozinka, user.passwordHash))) {
      res.status(401).json({ greska: "Pogrešan email ili lozinka." });
      return;
    }
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      korisnik: {
        id: user.id,
        email: user.email,
        ime: user.ime,
        prezime: user.prezime,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ greska: "Greška pri prijavi." });
  }
});

router.get("/me", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ greska: "Niste prijavljeni." });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, email: true, ime: true, prezime: true, role: true },
    });
    if (!user) {
      res.status(404).json({ greska: "Korisnik nije pronađen." });
      return;
    }
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ greska: "Greška pri učitavanju profila." });
  }
});

export default router;

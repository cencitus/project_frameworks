import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  role: z.enum(["ENGINEER","MANAGER","VIEWER"]).optional()
});

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await query("SELECT 1 FROM users WHERE email=$1", [data.email]);
    if (exists.rowCount > 0) return res.status(409).json({ error: "User already exists" });

    const hash = await bcrypt.hash(data.password, 10);
    const role = data.role || "ENGINEER";

    const result = await query(
      `INSERT INTO users (email,password,full_name,role) 
       VALUES ($1,$2,$3,$4) 
       RETURNING id,email,full_name AS "fullName",role,created_at AS "createdAt"`, 
      [data.email, hash, data.fullName, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await query(
      'SELECT id,email,password,full_name AS "fullName", role FROM users WHERE email=$1',
      [email]
    );
    if (result.rowCount === 0) return res.status(401).json({ error: "Invalid credentials" });
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || "devsecret", { expiresIn: "8h" });
    res.json({ token, user: { id:user.id, email:user.email, fullName:user.fullName, role:user.role } });
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

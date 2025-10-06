import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { authRequired, allowRoles } from "../middleware/auth.js";

const router = Router();

// получить список проектов
router.get("/", authRequired, async (_req, res) => {
  try {
    const r = await query(
      'SELECT id, name, created_at AS "createdAt" FROM projects ORDER BY created_at DESC'
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// создать новый проект (только менеджер)
const schema = z.object({ name: z.string().min(1) });
router.post("/", authRequired, allowRoles("MANAGER"), async (req, res) => {
  try {
    const data = schema.parse(req.body);
    const r = await query(
      'INSERT INTO projects (name) VALUES ($1) RETURNING id, name, created_at AS "createdAt"',
      [data.name]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

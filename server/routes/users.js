import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// список пользователей (для назначения исполнителя)
router.get("/", authRequired, async (_req, res) => {
  try {
    const r = await query(
      'SELECT id, full_name AS "fullName", email, role FROM users ORDER BY full_name'
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

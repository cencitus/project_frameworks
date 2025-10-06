import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/status-counts", authRequired, async (_req, res) => {
  try {
    const r = await query(
      "SELECT status, COUNT(*)::int AS count FROM defects GROUP BY status"
    );
    const data = {};
    for (const row of r.rows) data[row.status] = row.count;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

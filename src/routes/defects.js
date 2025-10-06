import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { authRequired, allowRoles } from "../middleware/auth.js";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
  status: z.enum(["NEW","IN_PROGRESS","IN_REVIEW","CLOSED","CANCELLED"]).optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

router.get("/", authRequired, async (req, res) => {
  try {
    const { status, projectId, assigneeId, q } = req.query;
    const where = [];
    const params = [];
    let i = 1;

    if (status) { where.push(`d.status = $${i++}`); params.push(status); }
    if (projectId) { where.push(`d.project_id = $${i++}`); params.push(projectId); }
    if (assigneeId) { where.push(`d.assignee_id = $${i++}`); params.push(assigneeId); }
    if (q) { where.push(`(d.title ILIKE $${i} OR d.description ILIKE $${i})`); params.push(`%${q}%`); i++; }

    const sql = `
      SELECT 
        d.id, d.title, d.description, d.priority, d.status, d.due_date AS "dueDate",
        d.created_at AS "createdAt", d.updated_at AS "updatedAt",
        d.project_id AS "projectId", d.created_by_id AS "createdById", d.assignee_id AS "assigneeId",
        (SELECT json_build_object('id', p.id, 'name', p.name) FROM projects p WHERE p.id=d.project_id) AS project,
        (SELECT json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) FROM users u WHERE u.id=d.assignee_id) AS assignee,
        (SELECT json_build_object('id', u2.id, 'fullName', u2.full_name, 'email', u2.email) FROM users u2 WHERE u2.id=d.created_by_id) AS "createdBy",
        (SELECT COUNT(*)::int FROM comments c WHERE c.defect_id=d.id) AS "commentsCount"
      FROM defects d
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY d.created_at DESC
    `;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authRequired, allowRoles("ENGINEER","MANAGER"), async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const result = await query(
      `INSERT INTO defects (title,description,priority,status,project_id,assignee_id,due_date,created_by_id)
       VALUES ($1,$2,$3,COALESCE($4,'NEW')::status_enum,$5,$6,$7,$8)
       RETURNING id,title,description,priority,status,project_id AS "projectId",assignee_id AS "assigneeId",created_by_id AS "createdById", due_date AS "dueDate", created_at AS "createdAt"`,
      [
        data.title,
        data.description,
        data.priority,
        data.status || null,
        data.projectId,
        data.assigneeId ?? null,
        data.dueDate ? new Date(data.dueDate) : null,
        req.user.id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const def = await query(
    `SELECT 
      d.id, d.title, d.description, d.priority, d.status, d.due_date AS "dueDate",
      d.created_at AS "createdAt", d.updated_at AS "updatedAt",
      d.project_id AS "projectId", d.created_by_id AS "createdById", d.assignee_id AS "assigneeId",
      (SELECT json_build_object('id', p.id, 'name', p.name) FROM projects p WHERE p.id=d.project_id) AS project,
      (SELECT json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) FROM users u WHERE u.id=d.assignee_id) AS assignee,
      (SELECT json_build_object('id', u2.id, 'fullName', u2.full_name, 'email', u2.email) FROM users u2 WHERE u2.id=d.created_by_id) AS "createdBy"
    FROM defects d WHERE d.id=$1`,
    [id]
  );

    if (def.rowCount == 0) return res.status(404).json({ error: "Not found" });

    const comments = await query(
      `SELECT c.id, c.text, c.created_at AS "createdAt",
              json_build_object('id', u.id, 'fullName', u.full_name) AS author
       FROM comments c
       LEFT JOIN users u ON u.id = c.author_id
       WHERE c.defect_id=$1
       ORDER BY c.created_at ASC`,
      [id]
    );

    const defect = def.rows[0];
    defect.comments = comments.rows;
    res.json(defect);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

const updateSchema = createSchema.partial();

router.patch("/:id", authRequired, allowRoles("ENGINEER","MANAGER"), async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);

    const sets = [];
    const params = [];
    let i = 1;

    if (data.title !== undefined) { sets.push(`title=$${i++}`); params.push(data.title); }
    if (data.description !== undefined) { sets.push(`description=$${i++}`); params.push(data.description); }
    if (data.priority !== undefined) { sets.push(`priority=$${i++}::priority_enum`); params.push(data.priority); }
    if (data.status !== undefined) { sets.push(`status=$${i++}::status_enum`); params.push(data.status); }
    if (data.projectId !== undefined) { sets.push(`project_id=$${i++}`); params.push(data.projectId); }
    if (data.assigneeId !== undefined) { sets.push(`assignee_id=$${i++}`); params.push(data.assigneeId); }
    if (data.dueDate !== undefined) { sets.push(`due_date=$${i++}`); params.push(data.dueDate ? new Date(data.dueDate) : null); }

    if (!sets.length) return res.status(400).json({ error: "No fields to update" });

    const sql = `UPDATE defects SET ${sets.join(", ")}, updated_at=now() WHERE id=$${i} RETURNING *`;
    params.push(id);
    const result = await query(sql, params);
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authRequired, allowRoles("MANAGER"), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM defects WHERE id=$1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

const commentSchema = z.object({ text: z.string().min(1) });

router.post("/:id/comments", authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = commentSchema.parse(req.body);
    const result = await query(
      `INSERT INTO comments (text, defect_id, author_id) VALUES ($1,$2,$3)
       RETURNING id,text,created_at AS "createdAt"`,
      [text, id, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e?.errors) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import authRouter from "./routes/auth.js";
import defectsRouter from "./routes/defects.js";
import projectsRouter from "./routes/projects.js";
import usersRouter from "./routes/users.js";
import reportsRouter from "./routes/reports.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ ok: true, name: "defects-app-backend-pg" }));

app.use("/auth", authRouter);
app.use("/defects", defectsRouter);
app.use("/projects", projectsRouter);
app.use("/users", usersRouter);
app.use("/reports", reportsRouter);


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

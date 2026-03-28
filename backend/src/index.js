const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "demanda",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

// Inicializar tabla
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS demandas (
      id SERIAL PRIMARY KEY,
      jira_key VARCHAR(20) UNIQUE NOT NULL,
      summary TEXT NOT NULL,
      priority VARCHAR(20),
      status VARCHAR(30),
      points INTEGER,
      squad VARCHAR(50),
      quarter VARCHAR(10),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ DB inicializada");
}

app.get("/health", (req, res) => res.json({ status: "ok", service: "demanda-backend" }));

app.get("/api/demandas", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM demandas ORDER BY created_at DESC");
  res.json({ data: rows, total: rows.length });
});

app.post("/api/demandas/sync", async (req, res) => {
  const lambdaUrl = process.env.LAMBDA_URL;
  const response = await fetch(`${lambdaUrl}?action=list`);
  const { issues } = await response.json();

  for (const issue of issues) {
    await pool.query(`
      INSERT INTO demandas (jira_key, summary, priority, status, points, squad, quarter)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (jira_key) DO UPDATE
      SET summary=$2, priority=$3, status=$4, points=$5, squad=$6, quarter=$7, updated_at=NOW()
    `, [issue.key, issue.summary, issue.priority, issue.status, issue.points, issue.squad, issue.quarter]);
  }

  res.json({ message: `${issues.length} demandas sincronizadas`, synced: issues.length });
});

app.get("/api/stats", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) as total,
      SUM(points) as total_points,
      COUNT(CASE WHEN status='In Progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status='Done' THEN 1 END) as done,
      COUNT(CASE WHEN status='To Do' THEN 1 END) as todo
    FROM demandas
  `);
  res.json(rows[0]);
});

const PORT = process.env.PORT || 3001;
initDB().then(() => app.listen(PORT, () => console.log(`🚀 Backend corriendo en puerto ${PORT}`)));

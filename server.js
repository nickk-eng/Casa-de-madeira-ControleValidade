"use strict";
const express = require("express");
const { Pool } = require("pg");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { timingSafeEqual, randomBytes } = require("node:crypto");
if (!process.env.DATABASE_URL || !process.env.APP_PASSWORD)
  throw new Error("Configure DATABASE_URL e APP_PASSWORD.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.disable("x-powered-by");
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.sendStatus(503);
  }
});
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const sessions = new Map();
const attempts = new Map();
const duration = 8 * 60 * 60 * 1000;
const username = process.env.APP_USERNAME || "funcionarios";
const secure =
  process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
function equal(a, b) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function token(req) {
  return (req.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("cm_validade_session="))
    ?.slice("cm_validade_session=".length);
}
function cookie(value, age) {
  return (
    "cm_validade_session=" +
    value +
    "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" +
    age +
    (secure ? "; Secure" : "")
  );
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) if (v <= now) sessions.delete(k);
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
}, 60000).unref();
app.get("/style.css", (req, res) =>
  res.sendFile(path.join(__dirname, "style.css")),
);
app.get("/login.js", (req, res) =>
  res.sendFile(path.join(__dirname, "login.js")),
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "login.html")),
);
app.post("/api/login", (req, res) => {
  const ip = req.ip,
    now = Date.now(),
    previous = attempts.get(ip);
  if (previous && previous.until > now && previous.count >= 10)
    return res
      .status(429)
      .json({ error: "Muitas tentativas. Aguarde 15 minutos." });
  const { usuario, senha } = req.body || {};
  if (
    typeof usuario !== "string" ||
    typeof senha !== "string" ||
    !equal(usuario, username) ||
    !equal(senha, process.env.APP_PASSWORD)
  ) {
    const attempt =
      previous && previous.until > now
        ? previous
        : { count: 0, until: now + 15 * 60000 };
    attempt.count++;
    attempts.set(ip, attempt);
    return res.status(401).json({ error: "Usuário ou senha incorretos." });
  }
  attempts.delete(ip);
  const id = randomBytes(32).toString("hex");
  sessions.set(id, now + duration);
  res.set("Set-Cookie", cookie(id, duration / 1000)).json({ ok: true });
});
app.post("/api/logout", (req, res) => {
  sessions.delete(token(req));
  res.set("Set-Cookie", cookie("", 0)).sendStatus(204);
});
app.use((req, res, next) => {
  const id = token(req),
    expires = sessions.get(id);
  if (expires && expires > Date.now()) return next();
  if (id) sessions.delete(id);
  if (req.path.startsWith("/api/"))
    return res.status(401).json({ error: "Entre para continuar." });
  res.redirect("/login");
});
const fields =
  "id, nome, quantidade, unidade, to_char(validade, 'YYYY-MM-DD') AS validade";
app.get("/api/alimentos", async (req, res) =>
  res.json(
    (await pool.query(`SELECT ${fields} FROM alimentos ORDER BY validade,nome`))
      .rows,
  ),
);
app.put("/api/alimentos/:id", async (req, res) => {
  const { nome, quantidade, unidade, validade } = req.body;
  const date = new Date(validade + "T12:00:00Z");
  if (
    !req.params.id ||
    req.params.id.length > 120 ||
    typeof nome !== "string" ||
    !nome.trim() ||
    nome.trim().length > 80 ||
    !Number.isFinite(quantidade) ||
    quantidade <= 0 ||
    !["kg", "g", "L", "mL", "unidade(s)", "pacote(s)"].includes(unidade) ||
    typeof validade !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(validade) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== validade
  )
    return res.status(400).json({ error: "Dados inválidos." });
  const result = await pool.query(
    `INSERT INTO alimentos(id,nome,quantidade,unidade,validade) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET nome=$2,quantidade=$3,unidade=$4,validade=$5 RETURNING ${fields}`,
    [req.params.id, nome.trim(), quantidade, unidade, validade],
  );
  res.json(result.rows[0]);
});
app.delete("/api/alimentos/:id", async (req, res) => {
  await pool.query("DELETE FROM alimentos WHERE id=$1", [req.params.id]);
  res.sendStatus(204);
});
for (const file of ["index.html", "script.js", "style.css"])
  app.get(file === "index.html" ? "/" : "/" + file, (req, res) =>
    res.sendFile(path.join(__dirname, file)),
  );
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: "Não foi possível concluir a operação." });
});
async function start() {
  await pool.query(readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  app.listen(process.env.PORT || 3000, "0.0.0.0");
}
start().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

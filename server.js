'use strict';
const express = require('express');
const { Pool } = require('pg');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { timingSafeEqual } = require('node:crypto');
if (!process.env.DATABASE_URL || !process.env.APP_PASSWORD) throw new Error('Configure DATABASE_URL e APP_PASSWORD.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.disable('x-powered-by');
app.get('/health', async (req,res) => { try { await pool.query('SELECT 1'); res.json({ok:true}); } catch { res.sendStatus(503); } });
app.use((req,res,next) => {
 let password = '';
 try { password = Buffer.from((req.headers.authorization || '').split(' ')[1] || '', 'base64').toString().split(':').slice(1).join(':'); } catch {}
 const a = Buffer.from(password), b = Buffer.from(process.env.APP_PASSWORD);
 if (a.length === b.length && timingSafeEqual(a,b)) return next();
 res.set('WWW-Authenticate','Basic realm="Casa de Madeira", charset="UTF-8"').status(401).send('Informe a senha do restaurante.');
});
app.use(express.json({limit:'32kb'}));
const fields = "id, nome, quantidade, unidade, to_char(validade, 'YYYY-MM-DD') AS validade";
app.get('/api/alimentos', async (req,res) => res.json((await pool.query(`SELECT ${fields} FROM alimentos ORDER BY validade,nome`)).rows));
app.put('/api/alimentos/:id', async (req,res) => {
 const {nome,quantidade,unidade,validade} = req.body;
 const date = new Date(validade + 'T12:00:00Z');
 if (!req.params.id || req.params.id.length > 120 || typeof nome !== 'string' || !nome.trim() || nome.trim().length > 80 || !Number.isFinite(quantidade) || quantidade <= 0 || !['kg','g','L','mL','unidade(s)','pacote(s)'].includes(unidade) || typeof validade !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(validade) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== validade) return res.status(400).json({error:'Dados inválidos.'});
 const result = await pool.query(`INSERT INTO alimentos(id,nome,quantidade,unidade,validade) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET nome=$2,quantidade=$3,unidade=$4,validade=$5 RETURNING ${fields}`, [req.params.id,nome.trim(),quantidade,unidade,validade]);
 res.json(result.rows[0]);
});
app.delete('/api/alimentos/:id', async (req,res) => { await pool.query('DELETE FROM alimentos WHERE id=$1',[req.params.id]); res.sendStatus(204); });
for (const file of ['index.html','script.js','style.css']) app.get(file === 'index.html' ? '/' : '/' + file, (req,res) => res.sendFile(path.join(__dirname,file)));
app.use((err,req,res,next) => { console.error(err.message); res.status(500).json({error:'Não foi possível concluir a operação.'}); });
async function start() { await pool.query(readFileSync(path.join(__dirname,'schema.sql'),'utf8')); app.listen(process.env.PORT || 3000,'0.0.0.0'); }
start().catch(err => { console.error(err.message); process.exit(1); });

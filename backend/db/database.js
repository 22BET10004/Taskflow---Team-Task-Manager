const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'taskflow.db');

let db;

function persist() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('DB persist error:', e.message);
  }
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0];
}

async function init() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
    owner_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, user_id TEXT NOT NULL,
    role TEXT NOT NULL, joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, user_id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL,
    description TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium', assigned_to TEXT, created_by TEXT NOT NULL,
    due_date TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  )`);

  persist();
  console.log('DB ready at', DB_PATH);
}

module.exports = { init, run, all, get, persist };

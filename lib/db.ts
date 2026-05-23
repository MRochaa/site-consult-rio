import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Interface definitions
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  name: string;
  created_at?: string;
}

export interface Link {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  is_public: boolean | number;
  icon: string;
  created_at?: string;
}

/**
 * bcrypt work factor. 12 is the modern default; raise further if login
 * latency is acceptable on the target hardware.
 */
const BCRYPT_ROUNDS = 12;

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
let db: Database.Database | null = null;

function newId(): string {
  // crypto.randomUUID() is unpredictable and collision-resistant, unlike the
  // previous Date.now() scheme which allowed trivial enumeration of users
  // and links via the API.
  return crypto.randomUUID();
}

function strongRandomPassword(): string {
  // 24 url-safe bytes → ~32 chars. Strong enough that leaking it via logs
  // once is still fine, and users are expected to change it immediately.
  return crypto.randomBytes(24).toString('base64url');
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.join(dataDir, 'dental-office.db'));

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS links (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        url TEXT NOT NULL,
        is_public INTEGER NOT NULL DEFAULT 1,
        icon TEXT NOT NULL DEFAULT 'FileText',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    seedInitialAdmin(db);
  }

  return db;
}

/**
 * Seed the initial admin user on first boot.
 *
 * - If INITIAL_ADMIN_PASSWORD is set, use it (operator explicitly chose it).
 * - Otherwise, generate a strong random password and log it ONCE so the
 *   operator can capture it from the container logs. The previous code
 *   shipped a hard-coded public password ("MudeEstaSenha123!") which meant
 *   any fresh database was trivially compromised.
 *
 * The existence check + insert must be atomic — otherwise two concurrent
 * workers could both observe count=0 and race to create admin. SQLite gives
 * us a UNIQUE constraint on username, so we wrap it in a transaction and
 * tolerate the unique violation.
 */
function seedInitialAdmin(database: Database.Database): void {
  const tx = database.transaction(() => {
    const existing = database
      .prepare("SELECT id FROM users WHERE username = 'admin'")
      .get();
    if (existing) return;

    const envPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const password =
      envPassword && envPassword.length >= 8 ? envPassword : strongRandomPassword();
    const hashed = bcrypt.hashSync(password, BCRYPT_ROUNDS);

    database
      .prepare(
        `INSERT INTO users (id, username, password, name, role)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(newId(), 'admin', hashed, 'Administrador', 'admin');

    if (!envPassword) {
      // eslint-disable-next-line no-console
      console.warn(
        '\n================================================================\n' +
          '  Initial admin account created with a RANDOM password.\n' +
          '  Username: admin\n' +
          `  Password: ${password}\n` +
          '  Change it immediately after first login.\n' +
          '================================================================\n'
      );
    }
  });

  try {
    tx();
  } catch (err: any) {
    // UNIQUE constraint: another worker won the race — that's fine.
    if (!/UNIQUE/i.test(String(err?.message))) throw err;
  }
}

// User functions
export function getAllUsers(): User[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM users ORDER BY created_at DESC')
    .all() as User[];
  return rows;
}

export function getUserByUsername(username: string): User | null {
  const db = getDb();
  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username) as User | undefined;
  return user || null;
}

export function createUser(user: Omit<User, 'id' | 'created_at'>): User {
  const db = getDb();
  const id = newId();
  const hashedPassword = bcrypt.hashSync(user.password, BCRYPT_ROUNDS);

  db.prepare(
    `INSERT INTO users (id, username, password, name, role)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, user.username, hashedPassword, user.name, user.role);

  return { id, ...user, password: hashedPassword };
}

export function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): void {
  const db = getDb();
  const updateFields: string[] = [];
  const values: any[] = [];

  if (updates.username) {
    updateFields.push('username = ?');
    values.push(updates.username);
  }
  if (updates.password) {
    updateFields.push('password = ?');
    values.push(bcrypt.hashSync(updates.password, BCRYPT_ROUNDS));
  }
  if (updates.name) {
    updateFields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.role) {
    updateFields.push('role = ?');
    values.push(updates.role);
  }

  if (updateFields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(
      ...values
    );
  }
}

export function deleteUser(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Link functions
export function getAllLinks(): Link[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM links ORDER BY created_at DESC')
    .all() as Link[];
  return rows.map((link) => ({
    ...link,
    is_public: link.is_public === 1,
  }));
}

export function createLink(link: Omit<Link, 'id' | 'created_at'>): Link {
  const db = getDb();
  const id = newId();

  db.prepare(
    `INSERT INTO links (id, name, subtitle, url, is_public, icon)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, link.name, link.subtitle, link.url, link.is_public ? 1 : 0, link.icon);

  return { id, ...link };
}

export function updateLink(id: string, updates: Partial<Omit<Link, 'id'>>): void {
  const db = getDb();
  const updateFields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.subtitle !== undefined) {
    updateFields.push('subtitle = ?');
    values.push(updates.subtitle);
  }
  if (updates.url !== undefined) {
    updateFields.push('url = ?');
    values.push(updates.url);
  }
  if (updates.is_public !== undefined) {
    updateFields.push('is_public = ?');
    values.push(updates.is_public ? 1 : 0);
  }
  if (updates.icon !== undefined) {
    updateFields.push('icon = ?');
    values.push(updates.icon);
  }

  if (updateFields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE links SET ${updateFields.join(', ')} WHERE id = ?`).run(
      ...values
    );
  }
}

export function deleteLink(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM links WHERE id = ?').run(id);
}

// Settings functions
export function getSetting(key: string): string | null {
  const db = getDb();
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return result?.value || null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

// Export/Import functions
export function exportData() {
  const db = getDb();
  const users = getAllUsers();
  const links = getAllLinks();
  const settings: Record<string, string> = {};

  const allSettings = db
    .prepare('SELECT key, value FROM settings')
    .all() as Array<{ key: string; value: string }>;
  allSettings.forEach((s) => {
    settings[s.key] = s.value;
  });

  return {
    users: users.map((u) => ({ ...u, password: '***' })), // Hide passwords in export
    links,
    settings,
    exportDate: new Date().toISOString(),
    version: '2.0',
  };
}

/**
 * Import a previously exported backup.
 *
 * Passwords are never present in a backup (export strips them). For users
 * that existed before the import we preserve their current hash; for users
 * introduced by the backup we assign a fresh random password and log it
 * once, forcing the operator to reset it — this prevents the old hard-coded
 * "TempPassword123!" fallback from being used to log in to a newly-created
 * account.
 *
 * The caller is responsible for validating `data` with validateBackup()
 * before calling this function.
 */
export function importData(data: {
  users: Array<{ id: string; username: string; name: string; role: 'admin' | 'user' }>;
  links: Array<{
    id: string;
    name: string;
    subtitle: string;
    url: string;
    is_public: boolean | number;
    icon: string;
  }>;
  settings?: Record<string, string>;
}) {
  const db = getDb();

  // Snapshot existing password hashes so we can preserve them.
  const existingUsers = getAllUsers();
  const passwordMap = new Map(existingUsers.map((u) => [u.username, u.password]));

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM links').run();
    db.prepare('DELETE FROM settings').run();

    const newCredentials: Array<{ username: string; password: string }> = [];

    for (const user of data.users) {
      let password = passwordMap.get(user.username);
      if (!password) {
        const generated = strongRandomPassword();
        password = bcrypt.hashSync(generated, BCRYPT_ROUNDS);
        newCredentials.push({ username: user.username, password: generated });
      }
      db.prepare(
        `INSERT INTO users (id, username, password, name, role)
         VALUES (?, ?, ?, ?, ?)`
      ).run(user.id, user.username, password, user.name, user.role);
    }

    for (const link of data.links) {
      db.prepare(
        `INSERT INTO links (id, name, subtitle, url, is_public, icon)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        link.id,
        link.name,
        link.subtitle,
        link.url,
        link.is_public ? 1 : 0,
        link.icon
      );
    }

    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(
          key,
          value
        );
      }
    }

    return newCredentials;
  });

  const created = tx();

  if (created.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[backup import] Generated new random passwords for users missing from ' +
        'the previous DB:\n' +
        created.map((c) => `  - ${c.username}: ${c.password}`).join('\n') +
        '\nCommunicate them securely and force a reset on first login.'
    );
  }
}

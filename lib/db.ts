import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
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

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Create database connection
let db: Database.Database | null = null;

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
    
    // Initialize with admin user if no users exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count === 0) {
      const adminPassword = bcrypt.hashSync('MudeEstaSenha123!', 10);
      db.prepare(`
        INSERT INTO users (id, username, password, name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('1', 'admin', adminPassword, 'Administrador', 'admin');
    }
  }
  
  return db;
}

// User functions
export function getAllUsers(): User[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as User[];
  return rows;
}

export function getUserByUsername(username: string): User | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  return user || null;
}

export function createUser(user: Omit<User, 'id' | 'created_at'>): User {
  const db = getDb();
  const id = Date.now().toString();
  const hashedPassword = bcrypt.hashSync(user.password, 10);
  
  db.prepare(`
    INSERT INTO users (id, username, password, name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, user.username, hashedPassword, user.name, user.role);
  
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
    values.push(bcrypt.hashSync(updates.password, 10));
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
    db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
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
  const rows = db.prepare('SELECT * FROM links ORDER BY created_at DESC').all() as Link[];
  return rows.map(link => ({
    ...link,
    is_public: link.is_public === 1
  }));
}

export function createLink(link: Omit<Link, 'id' | 'created_at'>): Link {
  const db = getDb();
  const id = Date.now().toString();
  
  db.prepare(`
    INSERT INTO links (id, name, subtitle, url, is_public, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, link.name, link.subtitle, link.url, link.is_public ? 1 : 0, link.icon);
  
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
    db.prepare(`UPDATE links SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
  }
}

export function deleteLink(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM links WHERE id = ?').run(id);
}

// Settings functions
export function getSetting(key: string): string | null {
  const db = getDb();
  const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return result?.value || null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

// Export/Import functions
export function exportData() {
  const db = getDb();
  const users = getAllUsers();
  const links = getAllLinks();
  const settings: Record<string, string> = {};
  
  const allSettings = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  allSettings.forEach(s => { settings[s.key] = s.value; });
  
  return {
    users: users.map(u => ({ ...u, password: '***' })), // Hide passwords in export
    links,
    settings,
    exportDate: new Date().toISOString(),
    version: '2.0'
  };
}

export function importData(data: any) {
  const db = getDb();
  
  // Start transaction
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // Clear existing data
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM links').run();
    db.prepare('DELETE FROM settings').run();
    
    // Import users (keeping existing passwords)
    const existingUsers = getAllUsers();
    const passwordMap = new Map(existingUsers.map(u => [u.username, u.password]));
    
    data.users.forEach((user: any) => {
      const password = passwordMap.get(user.username) || bcrypt.hashSync('TempPassword123!', 10);
      db.prepare(`
        INSERT INTO users (id, username, password, name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.id, user.username, password, user.name, user.role);
    });
    
    // Import links
    data.links.forEach((link: any) => {
      db.prepare(`
        INSERT INTO links (id, name, subtitle, url, is_public, icon)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(link.id, link.name, link.subtitle, link.url, link.is_public ? 1 : 0, link.icon);
    });
    
    // Import settings
    if (data.settings) {
      Object.entries(data.settings).forEach(([key, value]) => {
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value as string);
      });
    }
    
    db.prepare('COMMIT').run();
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
}

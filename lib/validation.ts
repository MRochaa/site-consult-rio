/**
 * Lightweight input validators for the API routes. We intentionally avoid
 * pulling in a full schema library (zod etc.) since the surface is small and
 * the extra dependency costs more than it buys here.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function str(v: unknown, field: string, { min = 1, max = 500 }: { min?: number; max?: number } = {}): string {
  if (typeof v !== 'string') {
    throw new ValidationError(`${field} deve ser texto`);
  }
  const trimmed = v.trim();
  if (trimmed.length < min) {
    throw new ValidationError(`${field} deve ter pelo menos ${min} caractere(s)`);
  }
  if (trimmed.length > max) {
    throw new ValidationError(`${field} deve ter no máximo ${max} caracteres`);
  }
  return trimmed;
}

function optionalStr(
  v: unknown,
  field: string,
  opts?: { min?: number; max?: number }
): string | undefined {
  if (v === undefined || v === null) return undefined;
  return str(v, field, opts);
}

function bool(v: unknown, field: string): boolean {
  if (typeof v !== 'boolean') {
    throw new ValidationError(`${field} deve ser booleano`);
  }
  return v;
}

function optionalBool(v: unknown, field: string): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  return bool(v, field);
}

const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;
const ICON_RE = /^[A-Za-z][A-Za-z0-9]*$/;

function validateUrl(v: unknown, field: string): string {
  const s = str(v, field, { max: 2048 });
  let parsed: URL;
  try {
    parsed = new URL(s);
  } catch {
    throw new ValidationError(`${field} não é uma URL válida`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError(`${field} deve usar http ou https`);
  }
  return s;
}

export interface LoginInput {
  username: string;
  password: string;
}

export function validateLogin(body: unknown): LoginInput {
  const b = body as Record<string, unknown>;
  return {
    username: str(b?.username, 'username', { min: 1, max: 64 }),
    password: str(b?.password, 'password', { min: 1, max: 200 }),
  };
}

export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

export function validateCreateUser(body: unknown): CreateUserInput {
  const b = body as Record<string, unknown>;
  const username = str(b?.username, 'username', { min: 3, max: 64 });
  if (!USERNAME_RE.test(username)) {
    throw new ValidationError(
      'username só pode conter letras, números, ".", "_" ou "-"'
    );
  }
  const password = str(b?.password, 'password', { min: 8, max: 200 });
  const name = str(b?.name, 'name', { min: 1, max: 120 });
  const role = b?.role;
  if (role !== 'admin' && role !== 'user') {
    throw new ValidationError("role deve ser 'admin' ou 'user'");
  }
  return { username, password, name, role };
}

export interface UpdateUserInput {
  id: string;
  username?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'user';
}

export function validateUpdateUser(body: unknown): UpdateUserInput {
  const b = body as Record<string, unknown>;
  const id = str(b?.id, 'id', { min: 1, max: 64 });
  const username = optionalStr(b?.username, 'username', { min: 3, max: 64 });
  if (username !== undefined && !USERNAME_RE.test(username)) {
    throw new ValidationError(
      'username só pode conter letras, números, ".", "_" ou "-"'
    );
  }
  const password = optionalStr(b?.password, 'password', { min: 8, max: 200 });
  const name = optionalStr(b?.name, 'name', { min: 1, max: 120 });
  let role: 'admin' | 'user' | undefined;
  if (b?.role !== undefined && b?.role !== null) {
    if (b.role !== 'admin' && b.role !== 'user') {
      throw new ValidationError("role deve ser 'admin' ou 'user'");
    }
    role = b.role;
  }
  return { id, username, password, name, role };
}

export interface CreateLinkInput {
  name: string;
  subtitle: string;
  url: string;
  is_public: boolean;
  icon: string;
}

function validateIcon(v: unknown): string {
  const s = str(v, 'icon', { min: 1, max: 64 });
  if (!ICON_RE.test(s)) {
    throw new ValidationError('icon inválido');
  }
  return s;
}

export function validateCreateLink(body: unknown): CreateLinkInput {
  const b = body as Record<string, unknown>;
  return {
    name: str(b?.name, 'name', { min: 1, max: 200 }),
    subtitle: str(b?.subtitle, 'subtitle', { min: 1, max: 300 }),
    url: validateUrl(b?.url, 'url'),
    is_public: bool(b?.is_public, 'is_public'),
    icon: validateIcon(b?.icon),
  };
}

export interface UpdateLinkInput {
  id: string;
  name?: string;
  subtitle?: string;
  url?: string;
  is_public?: boolean;
  icon?: string;
}

export function validateUpdateLink(body: unknown): UpdateLinkInput {
  const b = body as Record<string, unknown>;
  const id = str(b?.id, 'id', { min: 1, max: 64 });
  const out: UpdateLinkInput = { id };
  if (b?.name !== undefined) out.name = str(b.name, 'name', { min: 1, max: 200 });
  if (b?.subtitle !== undefined)
    out.subtitle = str(b.subtitle, 'subtitle', { min: 1, max: 300 });
  if (b?.url !== undefined) out.url = validateUrl(b.url, 'url');
  const ip = optionalBool(b?.is_public, 'is_public');
  if (ip !== undefined) out.is_public = ip;
  if (b?.icon !== undefined) out.icon = validateIcon(b.icon);
  return out;
}

/**
 * Validate the shape of a backup payload before touching the database.
 * The import call wipes all users/links, so we must not accept garbage.
 */
export function validateBackup(data: unknown): {
  users: Array<{ id: string; username: string; name: string; role: 'admin' | 'user' }>;
  links: Array<{
    id: string;
    name: string;
    subtitle: string;
    url: string;
    is_public: boolean | number;
    icon: string;
  }>;
  settings: Record<string, string>;
} {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Formato de backup inválido');
  }
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.users)) {
    throw new ValidationError('Backup inválido: users ausente');
  }
  if (!Array.isArray(d.links)) {
    throw new ValidationError('Backup inválido: links ausente');
  }
  if (d.users.length > 10_000 || d.links.length > 10_000) {
    throw new ValidationError('Backup excede o tamanho máximo permitido');
  }

  const users = d.users.map((u: any, i: number) => {
    if (!u || typeof u !== 'object') {
      throw new ValidationError(`users[${i}] inválido`);
    }
    const id = str(u.id, `users[${i}].id`, { min: 1, max: 64 });
    const username = str(u.username, `users[${i}].username`, {
      min: 1,
      max: 64,
    });
    if (!USERNAME_RE.test(username)) {
      throw new ValidationError(`users[${i}].username inválido`);
    }
    const name = str(u.name, `users[${i}].name`, { min: 1, max: 120 });
    if (u.role !== 'admin' && u.role !== 'user') {
      throw new ValidationError(`users[${i}].role inválido`);
    }
    return { id, username, name, role: u.role as 'admin' | 'user' };
  });

  const links = d.links.map((l: any, i: number) => {
    if (!l || typeof l !== 'object') {
      throw new ValidationError(`links[${i}] inválido`);
    }
    return {
      id: str(l.id, `links[${i}].id`, { min: 1, max: 64 }),
      name: str(l.name, `links[${i}].name`, { min: 1, max: 200 }),
      subtitle: str(l.subtitle, `links[${i}].subtitle`, { min: 1, max: 300 }),
      url: validateUrl(l.url, `links[${i}].url`),
      is_public:
        typeof l.is_public === 'boolean'
          ? l.is_public
          : l.is_public === 1 || l.is_public === 0
            ? l.is_public
            : (() => {
                throw new ValidationError(`links[${i}].is_public inválido`);
              })(),
      icon: validateIcon(l.icon),
    };
  });

  const settings: Record<string, string> = {};
  if (d.settings && typeof d.settings === 'object') {
    const entries = Object.entries(d.settings as Record<string, unknown>);
    if (entries.length > 500) {
      throw new ValidationError('Muitas configurações no backup');
    }
    for (const [k, v] of entries) {
      if (k.length > 128) throw new ValidationError('Chave de settings muito longa');
      if (typeof v !== 'string' || v.length > 4096) {
        throw new ValidationError(`settings[${k}] inválido`);
      }
      settings[k] = v;
    }
  }

  return { users, links, settings };
}

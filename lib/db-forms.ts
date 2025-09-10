import { getDb } from './db';

export interface FormField {
  id: string;
  type: string;
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  multipleChoice?: boolean;
  condition?: any;
  style?: FieldStyle; // Estilos individuais do campo
  position?: {
    row: number;
    col: number;
    width: number; // 1-12 (grid de 12 colunas)
  };
}

export interface FieldStyle {
  labelColor?: string;
  labelSize?: string;
  labelFont?: string;
  labelWeight?: string;
  fieldBackgroundColor?: string;
  fieldBorderColor?: string;
  fieldBorderWidth?: string;
  fieldBorderRadius?: string;
  fieldTextColor?: string;
  fieldTextSize?: string;
  fieldHeight?: string;
  fieldPadding?: string;
  fieldFont?: string;
  optionsLayout?: 'vertical' | 'horizontal' | 'grid';
  optionsColumns?: number;
}

export interface FormStyle {
  // Container
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  containerWidth?: string;
  containerPadding?: string;
  containerBorderRadius?: string;
  containerShadow?: string;
  
  // Typography
  fontFamily?: string;
  headingColor?: string;
  headingSize?: string;
  headingAlign?: 'left' | 'center' | 'right';
  descriptionColor?: string;
  descriptionSize?: string;
  
  // Buttons
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: string;
  buttonPadding?: string;
  buttonFontSize?: string;
  buttonHoverColor?: string;
  
  // Layout
  fieldSpacing?: string;
  sectionSpacing?: string;
  layout?: 'single' | 'two-column' | 'custom';
  
  // Theme presets
  theme?: 'default' | 'modern' | 'minimal' | 'dark' | 'colorful' | 'custom';
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  description: string;
  fields: string | FormField[]; // JSON ou array
  style?: string | FormStyle; // JSON ou objeto
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: string;
  signature?: string;
  submitted_at?: string;
  ip_address?: string;
}

// Inicializar tabelas de formulários
export function initFormTables() {
  const db = getDb();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      fields TEXT NOT NULL,
      style TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS form_submissions (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      data TEXT NOT NULL,
      signature TEXT,
      ip_address TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS form_themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      style TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
    CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON form_submissions(form_id);
  `);
  
  // Adicionar coluna style se não existir (para bancos existentes)
  try {
    db.exec(`ALTER TABLE forms ADD COLUMN style TEXT`);
  } catch (e) {
    // Coluna já existe
  }
}

// Funções para gerenciar formulários
export function getAllForms(): Form[] {
  const db = getDb();
  const forms = db.prepare('SELECT * FROM forms ORDER BY created_at DESC').all() as Form[];
  return forms.map(form => ({
    ...form,
    fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    style: form.style ? (typeof form.style === 'string' ? JSON.parse(form.style) : form.style) : undefined,
    is_active: form.is_active === 1
  }));
}

export function getFormBySlug(slug: string): Form | null {
  const db = getDb();
  const form = db.prepare('SELECT * FROM forms WHERE slug = ? AND is_active = 1').get(slug) as Form | undefined;
  if (!form) return null;
  
  return {
    ...form,
    fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    style: form.style ? (typeof form.style === 'string' ? JSON.parse(form.style) : form.style) : undefined,
    is_active: form.is_active === 1
  };
}

export function getFormById(id: string): Form | null {
  const db = getDb();
  const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(id) as Form | undefined;
  if (!form) return null;
  
  return {
    ...form,
    fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    style: form.style ? (typeof form.style === 'string' ? JSON.parse(form.style) : form.style) : undefined,
    is_active: form.is_active === 1
  };
}

export function createForm(form: Omit<Form, 'id' | 'created_at' | 'updated_at'>): Form {
  const db = getDb();
  const id = Date.now().toString();
  
  db.prepare(`
    INSERT INTO forms (id, slug, title, description, fields, style, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, 
    form.slug, 
    form.title, 
    form.description || '', 
    JSON.stringify(form.fields),
    form.style ? JSON.stringify(form.style) : null,
    form.is_active ? 1 : 0
  );
  
  return { id, ...form };
}

export function updateForm(id: string, updates: Partial<Omit<Form, 'id'>>): void {
  const db = getDb();
  const updateFields: string[] = [];
  const values: any[] = [];
  
  if (updates.slug !== undefined) {
    updateFields.push('slug = ?');
    values.push(updates.slug);
  }
  if (updates.title !== undefined) {
    updateFields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    updateFields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.fields !== undefined) {
    updateFields.push('fields = ?');
    values.push(JSON.stringify(updates.fields));
  }
  if (updates.style !== undefined) {
    updateFields.push('style = ?');
    values.push(JSON.stringify(updates.style));
  }
  if (updates.is_active !== undefined) {
    updateFields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }
  
  if (updateFields.length > 0) {
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    db.prepare(`UPDATE forms SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
  }
}

export function deleteForm(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM forms WHERE id = ?').run(id);
}

// Funções para themes
export function getFormThemes() {
  const db = getDb();
  const themes = db.prepare('SELECT * FROM form_themes ORDER BY name').all() as any[];
  return themes.map(theme => ({
    ...theme,
    style: JSON.parse(theme.style)
  }));
}

export function createFormTheme(name: string, style: FormStyle) {
  const db = getDb();
  const id = Date.now().toString();
  
  db.prepare(`
    INSERT INTO form_themes (id, name, style)
    VALUES (?, ?, ?)
  `).run(id, name, JSON.stringify(style));
  
  return { id, name, style };
}

// Funções para submissions
export function createSubmission(submission: Omit<FormSubmission, 'id' | 'submitted_at'>): FormSubmission {
  const db = getDb();
  const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  
  db.prepare(`
    INSERT INTO form_submissions (id, form_id, data, signature, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    submission.form_id,
    JSON.stringify(submission.data),
    submission.signature || null,
    submission.ip_address || null
  );
  
  return { id, ...submission };
}

export function getFormSubmissions(formId: string): FormSubmission[] {
  const db = getDb();
  const submissions = db.prepare(
    'SELECT * FROM form_submissions WHERE form_id = ? ORDER BY submitted_at DESC'
  ).all(formId) as FormSubmission[];
  
  return submissions.map(sub => ({
    ...sub,
    data: JSON.parse(sub.data)
  }));
}

export function getSubmissionById(id: string): FormSubmission | null {
  const db = getDb();
  const submission = db.prepare('SELECT * FROM form_submissions WHERE id = ?').get(id) as FormSubmission | undefined;
  
  if (!submission) return null;
  
  return {
    ...submission,
    data: JSON.parse(submission.data)
  };
}

// Inicializar tabelas na primeira execução
initFormTables();

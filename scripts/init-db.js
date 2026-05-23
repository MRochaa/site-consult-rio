const fs = require('fs');
const path = require('path');

// Funciona tanto local quanto no Docker build.
let Database;

try {
  Database = require('better-sqlite3');
} catch (error) {
  console.log('Dependências ainda não instaladas, pulando inicialização do banco...');
  process.exit(0);
}

// Criar diretório data se não existir
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Criar ou conectar ao banco
const db = new Database(path.join(dataDir, 'dental-office.db'));

// Criar tabelas
db.exec(`
  -- Tabela de usuários
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de links
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    url TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 1,
    icon TEXT NOT NULL DEFAULT 'FileText',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de configurações
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// IMPORTANTE: o usuário admin não é mais criado aqui.
// A criação é feita no primeiro boot pela aplicação (lib/db.ts -> seedInitialAdmin),
// que usa INITIAL_ADMIN_PASSWORD do ambiente ou gera uma senha aleatória e a
// imprime nos logs. Isso evita ter uma senha padrão hardcoded em código.

// Links padrão (apenas IDs e URLs que não expõem informação sensível adicional
// além do que já seria visível em um site público).
const linksCount = db.prepare('SELECT COUNT(*) as count FROM links').get().count;

function newId() {
  return require('crypto').randomUUID();
}

if (linksCount === 0) {
  console.log('Adicionando links padrão...');

  const defaultLinks = [
    {
      name: 'Ficha de Cadastro',
      subtitle: 'Anamnese',
      url: 'https://form.jotform.com/251813725963059',
      is_public: 1,
      icon: 'FileText',
    },
    {
      name: 'Cadastro de novos clientes',
      subtitle: 'Preenchimento de Contrato',
      url: 'https://n8n.drmarcosrocha.com/form/9e8ed6ec-f5e9-4e6c-a42c-31e6f9473e9e',
      is_public: 1,
      icon: 'FileCheck',
    },
    {
      name: 'Aquisição de contrato de serviços odontológicos',
      subtitle: 'Criação de Prontuários',
      url: 'https://form.jotform.com/251894751611057',
      is_public: 1,
      icon: 'ClipboardList',
    },
    {
      name: 'Exclusivo para os dentistas',
      subtitle: 'Buscar Prontuários',
      url: 'https://n8n.drmarcosrocha.com/form/5190a59c-251d-443c-b532-9454b6e01545',
      is_public: 0,
      icon: 'FileText',
    },
    {
      name: 'Buscar ficha de prontuário do cliente',
      subtitle: 'Atualizar Contrato',
      url: 'https://n8n.drmarcosrocha.com/form/80660c9b-d65c-4807-9863-8cb4c090f982',
      is_public: 0,
      icon: 'FileCheck',
    },
    {
      name: 'Atualizar contrato antigo para contrato com carnê',
      subtitle: 'Atualizar contrato antigo para contrato com carnê',
      url: 'https://n8n.drmarcosrocha.com/form/80660c9b-d65c-4807-9863-8cb4c090f982',
      is_public: 0,
      icon: 'FileCheck',
    },
  ];

  const insertLink = db.prepare(`
    INSERT INTO links (id, name, subtitle, url, is_public, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const link of defaultLinks) {
    insertLink.run(newId(), link.name, link.subtitle, link.url, link.is_public, link.icon);
  }

  console.log('Links padrão adicionados.');
}

// Configurações padrão
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
if (settingsCount === 0) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(
    'site_title',
    'Consultório Dr. Marcos Rocha'
  );
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(
    'logo_url',
    '/dental-office-logo.png'
  );
  console.log('Configurações padrão adicionadas.');
}

db.close();

console.log('\nSchema do banco de dados pronto.');
console.log('Localização: data/dental-office.db');
console.log(
  'O usuário admin será criado no primeiro boot da aplicação. ' +
    'Defina INITIAL_ADMIN_PASSWORD para escolher a senha inicial, ' +
    'ou veja os logs do container após o primeiro start.'
);

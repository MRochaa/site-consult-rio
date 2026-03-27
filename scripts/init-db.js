const fs = require('fs');
const path = require('path');

// Para funcionar tanto localmente quanto no Docker
let Database, bcrypt;

try {
  Database = require('better-sqlite3');
  bcrypt = require('bcryptjs');
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

// Verificar se já existe admin
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');

if (!adminExists) {
  console.log('🚀 Inicializando sistema com usuário admin padrão...');
  
  // Criar usuário admin padrão
  const adminPassword = bcrypt.hashSync('MudeEstaSenha123!', 10);
  
  db.prepare(`
    INSERT INTO users (id, username, password, name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('1', 'admin', adminPassword, 'Administrador', 'admin');
  
  console.log('✅ Usuário admin criado!');
  console.log('   Usuário: admin');
  console.log('   Senha: MudeEstaSenha123!');
  console.log('   ⚠️  MUDE ESTA SENHA NO PRIMEIRO ACESSO!');
}

// Verificar se existem links
const linksCount = db.prepare('SELECT COUNT(*) as count FROM links').get().count;

if (linksCount === 0) {
  console.log('📋 Adicionando links padrão...');
  
  const defaultLinks = [
    {
      id: '1',
      name: 'Ficha de Cadastro',
      subtitle: 'Anamnese',
      url: 'https://form.jotform.com/251813725963059',
      is_public: 1,
      icon: 'FileText'
    },
    {
      id: '2',
      name: 'Cadastro de novos clientes',
      subtitle: 'Preenchimento de Contrato',
      url: 'https://n8n.drmarcosrocha.com/form/9e8ed6ec-f5e9-4e6c-a42c-31e6f9473e9e',
      is_public: 1,
      icon: 'FileCheck'
    },
    {
      id: '3',
      name: 'Aquisição de contrato de serviços odontológicos',
      subtitle: 'Criação de Prontuários',
      url: 'https://form.jotform.com/251894751611057',
      is_public: 1,
      icon: 'ClipboardList'
    },
    {
      id: '4',
      name: 'Exclusivo para os dentistas',
      subtitle: 'Buscar Prontuários',
      url: 'https://n8n.drmarcosrocha.com/form/5190a59c-251d-443c-b532-9454b6e01545',
      is_public: 0,
      icon: 'FileText'
    },
    {
      id: '5',
      name: 'Buscar ficha de prontuário do cliente',
      subtitle: 'Atualizar Contrato',
      url: 'https://n8n.drmarcosrocha.com/form/80660c9b-d65c-4807-9863-8cb4c090f982',
      is_public: 0,
      icon: 'FileCheck'
    },
    {
      id: '6',
      name: 'Atualizar contrato antigo para contrato com carnê',
      subtitle: 'Atualizar contrato antigo para contrato com carnê',
      url: 'https://n8n.drmarcosrocha.com/form/80660c9b-d65c-4807-9863-8cb4c090f982',
      is_public: 0,
      icon: 'FileCheck'
    }
  ];
  
  const insertLink = db.prepare(`
    INSERT INTO links (id, name, subtitle, url, is_public, icon)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const link of defaultLinks) {
    insertLink.run(link.id, link.name, link.subtitle, link.url, link.is_public, link.icon);
  }
  
  console.log('✅ Links padrão adicionados!');
}

// Adicionar configurações padrão
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;

if (settingsCount === 0) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('site_title', 'Consultório Dr. Marcos Rocha');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('logo_url', '/dental-office-logo.png');
  console.log('⚙️  Configurações padrão adicionadas!');
}

db.close();

console.log('\n✅ Banco de dados inicializado com sucesso!');
console.log('📁 Localização: data/dental-office.db\n');

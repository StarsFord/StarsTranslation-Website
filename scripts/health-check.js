import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('\n🔍 StarsTranslations Health Check\n');
console.log('═'.repeat(60));

let issues = [];
let warnings = [];

// Check .env file
console.log('\n📋 Checking configuration files...');
const envPath = join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');

  const envContent = fs.readFileSync(envPath, 'utf8');

  if (envContent.includes('your-patreon-client-id-here')) {
    issues.push('.env: Patreon Client ID not configured');
  }

  if (envContent.includes('your-patreon-client-secret-here')) {
    issues.push('.env: Patreon Client Secret not configured');
  }

  if (envContent.includes('change-this-to')) {
    warnings.push('.env: JWT_SECRET or SESSION_SECRET using default values (change for production)');
  }
} else {
  issues.push('.env file not found - copy from .env.example');
}

// Check package.json
console.log('✅ package.json exists');

// Check database directory
const dataDir = join(rootDir, 'data');
if (fs.existsSync(dataDir)) {
  console.log('✅ data/ directory exists');

  const dbPath = join(dataDir, 'stars-translations.db');
  if (fs.existsSync(dbPath)) {
    console.log('✅ Database file exists');
  } else {
    warnings.push('Database not initialized - run: npm run setup-db');
  }
} else {
  warnings.push('data/ directory not found - will be created on setup');
}

// Check uploads directories
console.log('\n📁 Checking upload directories...');
const uploadsDir = join(rootDir, 'uploads');
if (fs.existsSync(uploadsDir)) {
  console.log('✅ uploads/ directory exists');

  const attachmentsDir = join(uploadsDir, 'attachments');
  const imagesDir = join(uploadsDir, 'images');

  if (fs.existsSync(attachmentsDir)) {
    console.log('✅ uploads/attachments/ exists');
  } else {
    warnings.push('uploads/attachments/ not found - create it or files upload will fail');
  }

  if (fs.existsSync(imagesDir)) {
    console.log('✅ uploads/images/ exists');
  } else {
    warnings.push('uploads/images/ not found - create it or image upload will fail');
  }
} else {
  warnings.push('uploads/ directory not found - create it before uploading files');
}

// Check node_modules
console.log('\n📦 Checking dependencies...');
const nodeModules = join(rootDir, 'node_modules');
if (fs.existsSync(nodeModules)) {
  console.log('✅ node_modules exists');

  // Check critical dependencies
  const criticalDeps = ['express', 'react', 'better-sqlite3', 'passport'];
  criticalDeps.forEach(dep => {
    const depPath = join(nodeModules, dep);
    if (fs.existsSync(depPath)) {
      console.log(`✅ ${dep} installed`);
    } else {
      issues.push(`Missing dependency: ${dep} - run npm install`);
    }
  });
} else {
  issues.push('node_modules not found - run: npm install');
}

// Check source files
console.log('\n📄 Checking source files...');
const criticalFiles = [
  'server/index.js',
  'server/database/db.js',
  'src/main.jsx',
  'src/App.jsx',
  'index.html'
];

criticalFiles.forEach(file => {
  const filePath = join(rootDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    issues.push(`Missing file: ${file}`);
  }
});

// Summary
console.log('\n' + '═'.repeat(60));
console.log('\n📊 Summary:\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('🎉 All checks passed! Your installation looks good.\n');
  console.log('Next steps:');
  console.log('  1. Configure Patreon OAuth in .env');
  console.log('  2. Run: npm run setup-db');
  console.log('  3. Run: npm run dev');
  console.log('  4. Login with Patreon');
  console.log('  5. Run: npm run create-admin\n');
} else {
  if (issues.length > 0) {
    console.log('❌ Issues found:\n');
    issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
    console.log('');
  }

  console.log('Please fix the issues above before running the application.\n');
}

console.log('═'.repeat(60) + '\n');

process.exit(issues.length > 0 ? 1 : 0);

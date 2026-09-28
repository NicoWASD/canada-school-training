import fs from 'fs';
import path from 'path';

function checkDir(dir: string, forbiddenTokens: string[]) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      checkDir(full, forbiddenTokens);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      for (const token of forbiddenTokens) {
        if (content.includes(token)) {
          console.error(`Violation in ${full}: contains '${token}'`);
          process.exit(1);
        }
      }
    }
  }
}

// 1. domain no debe importar react, supabase, ni application ni presentation
console.log('Testing domain purity...');
checkDir('src/domain', ['react', '@supabase', 'application', 'infrastructure', 'presentation', 'container']);
console.log('Domain is 100% pure.');

// 2. application no debe importar supabase, infrastructure, ni presentation ni react
console.log('Testing application purity...');
checkDir('src/application', ['react', '@supabase', 'infrastructure', 'presentation', 'container']);
console.log('Application is 100% pure.');

// 3. ports no debe importar infrastructure
console.log('Testing ports purity...');
checkDir('src/application/ports', ['infrastructure', '@supabase']);
console.log('Ports are 100% decoupled.');
console.log('ALL ARCHITECTURAL RULES MET!');

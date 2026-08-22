const fs = require('fs');
const glob = require('glob'); // Note: glob might not be installed, use child_process or standard fs traversal
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const pagesToStrip = [
  'src/app/shop/settings/payment/page.tsx',
  'src/app/shop/settings/page.tsx',
  'src/app/shop/history/page.tsx',
  'src/app/shop/staff/page.tsx',
  'src/app/shop/orders/page.tsx',
  'src/app/shop/pricing/page.tsx',
  'src/app/shop/reports/page.tsx'
];

walkDir('./src', (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Pages to strip getServiceRoleClient
  if (pagesToStrip.includes(filePath)) {
    content = content.replace(/import \{ getServiceRoleClient, createClient \} from "@\/lib\/supabase\/server";/g, 'import { createClient } from "@/lib/supabase/server";');
    content = content.replace(/const supabase = getServiceRoleClient\(\);\n\s*/g, '');
    
    // Some pages used supabase.from, we replace it with supabaseAuth.from
    content = content.replace(/supabase\.from/g, 'supabaseAuth.from');
    changed = true;
  } else {
    if (content.includes('getServiceRoleClient')) {
      if (content.includes('import { getServiceRoleClient } from "@/lib/supabase/server"')) {
        content = content.replace(/import \{ getServiceRoleClient \} from "@\/lib\/supabase\/server";/g, 'import { getServiceRoleClient } from "@/lib/supabase/admin";');
        changed = true;
      }
      if (content.includes('import { getServiceRoleClient, createClient } from "@/lib/supabase/server"')) {
        content = content.replace(/import \{ getServiceRoleClient, createClient \} from "@\/lib\/supabase\/server";/g, 'import { createClient } from "@/lib/supabase/server";\nimport { getServiceRoleClient } from "@/lib/supabase/admin";');
        changed = true;
      }
      if (content.includes('const { getServiceRoleClient } = await import("@/lib/supabase/server")')) {
        content = content.replace(/const \{ getServiceRoleClient \} = await import\("@\/lib\/supabase\/server"\);/g, 'const { getServiceRoleClient } = await import("@/lib/supabase/admin");');
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + filePath);
  }
});

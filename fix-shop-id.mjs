import fs from 'fs';
import path from 'path';

const files = [
  "src/app/shop/settings/payment/page.tsx",
  "src/app/shop/settings/page.tsx",
  "src/app/shop/history/page.tsx",
  "src/app/shop/staff/page.tsx",
  "src/app/shop/orders/page.tsx",
  "src/app/shop/pricing/page.tsx",
  "src/app/shop/reports/page.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace getServiceRoleClient with createClient if it's there
  if (content.includes('import { getServiceRoleClient }')) {
    content = content.replace(
      'import { getServiceRoleClient } from "@/lib/supabase/server";',
      'import { getServiceRoleClient, createClient } from "@/lib/supabase/server";'
    );
  } else {
    content = content.replace(
      'from "@/lib/supabase/server";',
      'from "@/lib/supabase/server";\nimport { createClient } from "@/lib/supabase/server";'
    );
  }

  // Replace supabase.auth.getUser() with createClient().auth.getUser()
  if (content.includes('const supabase = getServiceRoleClient();')) {
    content = content.replace(
      'const supabase = getServiceRoleClient();',
      'const supabase = getServiceRoleClient();\n  const supabaseAuth = await createClient();'
    );
    content = content.replace(
      'const { data: { user } } = await supabase.auth.getUser();',
      'const { data: { user } } = await supabaseAuth.auth.getUser();'
    );
  } else {
    // some files might not have getServiceRoleClient but still have mock-shop-id
    // staff, reports etc.
    content = content.replace(
      'let shopId = "mock-shop-id";',
      'const supabaseAuth = await createClient();\n  const { data: { user } } = await supabaseAuth.auth.getUser();\n  let shopId = "mock-shop-id";\n  if (user) {\n    const { data: shop } = await supabaseAuth.from("shops").select("id").eq("owner_id", user.id).single();\n    if (shop) shopId = shop.id;\n  }'
    );
  }

  fs.writeFileSync(file, content);
}
console.log("Fixed mock-shop-id in UI pages.");

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, serviceKey);

  // Fetch 1 row from documents to see keys
  const { data: docs } = await supabase.from("documents").select("*").limit(1);
  if (docs && docs.length > 0) {
    console.log("Documents columns:", Object.keys(docs[0]));
  } else {
    // If empty, insert a dummy record and let it fail to see error or use RPC if available
    console.log("Documents table is empty, can't infer schema easily from REST.");
  }

  // Fetch 1 row from orders
  const { data: orders } = await supabase.from("orders").select("*").limit(1);
  if (orders && orders.length > 0) {
    console.log("Orders columns:", Object.keys(orders[0]));
  } else {
    console.log("Orders table is empty.");
  }
}
run();

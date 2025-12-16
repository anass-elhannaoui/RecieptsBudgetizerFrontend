import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupCategories() {
  console.log("🧹 Cleaning up old categories...");

  // Categories to keep
  const keepCategories = [
    "Groceries",
    "Dining",
    "Transport",
    "Entertainment",
    "Shopping",
    "Health",
    "Utilities",
    "Uncategorized"
  ];

  try {
    // Get all categories
    const { data: allCategories, error: fetchError } = await supabase
      .from("categories")
      .select("id, name");

    if (fetchError) {
      console.error("❌ Error fetching categories:", fetchError);
      return;
    }

    // Find categories to delete (not in keep list)
    const categoriesToDelete = allCategories?.filter(
      c => !keepCategories.includes(c.name)
    ) || [];

    if (categoriesToDelete.length === 0) {
      console.log("✅ No old categories to remove!");
      return;
    }

    console.log(`🗑️  Found ${categoriesToDelete.length} categories to remove:`);
    categoriesToDelete.forEach(c => console.log(`   - ${c.name}`));

    // Delete old categories
    const idsToDelete = categoriesToDelete.map(c => c.id);
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      console.error("❌ Error deleting categories:", deleteError);
      console.log("\n💡 Note: If categories are used in budgets/receipts, you'll need to:");
      console.log("   1. Update those records to use different categories");
      console.log("   2. Or set up CASCADE delete in your database");
      return;
    }

    console.log("✅ Successfully removed old categories!");
    console.log("\n📝 Next step: Run 'npx tsx seed-categories.ts' to ensure all categories exist");

  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

cleanupCategories();

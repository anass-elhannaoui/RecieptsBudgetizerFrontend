import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials!");
  console.error("Please check your .env.local file contains:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url");
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedCategories() {
  console.log("🌱 Starting category seeding...");

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log("⚠️  Not authenticated. Categories should be global (user_id = null)");
  }

  // Default categories with icons and descriptions
  const defaultCategories = [
    { name: "Groceries", icon: "🛒", description: "Regular food shopping" },
    { name: "Dining", icon: "🍽️", description: "Restaurants and takeout" },
    { name: "Transport", icon: "🚗", description: "Gas, public transit, ride-sharing" },
    { name: "Entertainment", icon: "🎬", description: "Movies, games, hobbies" },
    { name: "Shopping", icon: "🛍️", description: "Clothing, general purchases" },
    { name: "Health", icon: "🏥", description: "Medical, pharmacy, fitness" },
    { name: "Utilities", icon: "💡", description: "Bills, internet, phone" },
    { name: "Uncategorized", icon: "📦", description: "Everything else" },
  ];

  try {
    // Check if categories already exist
    const { data: existingCategories, error: checkError } = await supabase
      .from("categories")
      .select("name");

    if (checkError) {
      console.error("❌ Error checking existing categories:", checkError);
      return;
    }

    const existingNames = new Set(existingCategories?.map(c => c.name) || []);
    const categoriesToInsert = defaultCategories.filter(c => !existingNames.has(c.name));

    if (categoriesToInsert.length === 0) {
      console.log("✅ All default categories already exist!");
      console.log("\n📝 Updating descriptions for existing categories...");
      
      // Update descriptions for existing categories
      for (const category of defaultCategories) {
        const { error: updateError } = await supabase
          .from("categories")
          .update({ description: category.description })
          .eq("name", category.name);
        
        if (updateError) {
          console.error(`❌ Error updating ${category.name}:`, updateError);
        } else {
          console.log(`✓ Updated ${category.name}`);
        }
      }
      
      console.log("\n✅ All categories updated with descriptions!");
      return;
    }

    console.log(`📁 Creating ${categoriesToInsert.length} new categories...`);

    const userId = user?.id || null;

    const { data, error } = await supabase
      .from("categories")
      .insert(
        categoriesToInsert.map((c) => ({
          name: c.name,
          icon: c.icon,
          description: c.description,
          user_id: userId,
        }))
      )
      .select();

    if (error) {
      console.error("❌ Error inserting categories:", error);
      console.log("\n💡 Possible solutions:");
      console.log("   1. Make sure you're authenticated (use service_role key)");
      console.log("   2. Check RLS policies allow INSERT on categories table");
      console.log("   3. Verify categories table has 'description' column");
      return;
    }

    console.log(`✅ Successfully created ${data?.length || 0} categories!`);
    data?.forEach(c => console.log(`   ✓ ${c.name} - ${c.description}`));
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

seedCategories();

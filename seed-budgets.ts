import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

import { createBudget, getCategories } from "./src/lib/api-client";

async function seedBudgets() {
  console.log("🌱 Starting budget seeding...");

  try {
    // Get all available categories
    const categories = await getCategories();
    console.log(`📁 Found ${categories.length} categories`);

    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    console.log(`📅 Creating budgets for month: ${currentMonth}`);

    // Define default budget limits for each category (in EUR)
    const defaultBudgets: Record<string, number> = {
      "Food": 500,
      "Groceries": 400,
      "Transport": 200,
      "Entertainment": 150,
      "Shopping": 300,
      "Health": 200,
      "Utilities": 150,
      "Tech": 250,
      "Travel": 500,
      "Dining": 300,
      "Other": 200,
    };

    // Create budgets for each category
    for (const category of categories) {
      const limit = defaultBudgets[category.name] || 200; // Default to 200 if not specified
      
      try {
        console.log(`\n💰 Creating budget for ${category.name}...`);
        
        const budget = await createBudget({
          categoryId: category.id,
          limit: limit,
          month: currentMonth,
        });

        console.log(`  ✅ Created: ${budget.categoryName} - Limit: €${budget.limit}`);
      } catch (error: any) {
        // Check if budget already exists
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          console.log(`  ⚠️ Budget already exists for ${category.name}`);
        } else {
          console.error(`  ❌ Error creating budget for ${category.name}:`, error.message);
        }
      }
    }

    console.log("\n✨ Budget seeding completed!");
  } catch (error) {
    console.error("❌ Budget seeding failed:", error);
  }
}

// Run the seeding script
seedBudgets().catch(console.error);

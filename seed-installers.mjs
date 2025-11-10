import { drizzle } from "drizzle-orm/mysql2";
import { installers } from "./drizzle/schema.js";

const predefinedInstallers = [
  "AFIZ",
  "AMMAR",
  "KLAVINN",
  "JEEVAN",
  "EDWIN",
  "MANI",
  "SATHIS",
  "SOLOMON",
  "KM SIVA",
  "RAVEEN",
  "SHXFIALAN",
  "SIVANES",
  "RAJEN",
  "RAZAK",
  "SASI",
  "TAKYIN"
];

async function seedInstallers() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Seeding installers...");

  for (const name of predefinedInstallers) {
    try {
      await db.insert(installers).values({
        name,
        isActive: 1,
      }).onDuplicateKeyUpdate({
        set: { name },
      });
      console.log(`✓ Added installer: ${name}`);
    } catch (error) {
      console.error(`✗ Failed to add installer ${name}:`, error.message);
    }
  }

  console.log("Seeding completed!");
  process.exit(0);
}

seedInstallers();

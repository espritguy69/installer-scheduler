import { drizzle } from "drizzle-orm/mysql2";
import { orders } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const testOrder = {
  orderNumber: "WO-TEST-001",
  serviceNumber: "SVC-12345",
  customerName: "John Doe",
  customerPhone: "555-1234",
  serviceType: "Installation",
  salesModiType: "New",
  address: "123 Main Street",
  appointmentDate: "2025-11-15",
  appointmentTime: "10:00 AM",
  buildingName: "Sunshine Towers",
  estimatedDuration: 120,
  priority: "high",
  status: "pending",
  notes: "Test order to verify card layout"
};

await db.insert(orders).values(testOrder);
console.log("Test order created successfully!");

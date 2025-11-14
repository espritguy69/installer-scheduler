import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { assignmentHistory, assignments, InsertAssignment, InsertAssignmentHistory, InsertInstaller, InsertNote, InsertOrder, InsertOrderHistory, installers, InsertTimeSlot, InsertUser, notes, orderHistory, orders, timeSlots, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values(user);
  return result;
}

export async function updateUser(id: number, user: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(user).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}

// Orders queries
export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order);
  return result;
}

export async function updateOrder(id: number, order: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(order).where(eq(orders.id, id));
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(orders).where(eq(orders.id, id));
}

export async function updateOrderDocketFile(orderId: number, fileUrl: string, fileName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ 
    docketFileUrl: fileUrl, 
    docketFileName: fileName 
  }).where(eq(orders.id, orderId));
}

export async function clearAllOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete all assignments first (foreign key constraint)
  await db.delete(assignments);
  // Then delete all orders
  await db.delete(orders);
}

export async function bulkCreateOrders(orderList: InsertOrder[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (orderList.length === 0) return;
  
  // Check for duplicates based on Service ID + WO No. combination
  // Service ID alone is NOT a duplicate (same service can have multiple WOs)
  // Service ID + WO No. combination IS a duplicate
  const duplicates: Array<{ serviceNumber: string; orderNumber: string | null }> = [];
  
  for (const order of orderList) {
    if (!order.serviceNumber) continue;
    
    // Build the where condition based on whether WO No. exists
    const whereCondition = order.orderNumber && order.orderNumber.trim() !== ''
      ? and(
          eq(orders.serviceNumber, order.serviceNumber),
          eq(orders.orderNumber, order.orderNumber)
        )
      : and(
          eq(orders.serviceNumber, order.serviceNumber),
          or(
            eq(orders.orderNumber, ''),
            isNull(orders.orderNumber)
          )
        );
    
    const existing = await db.select().from(orders).where(whereCondition).limit(1);
    
    if (existing.length > 0) {
      duplicates.push({
        serviceNumber: order.serviceNumber,
        orderNumber: order.orderNumber || null
      });
    }
  }
  
  if (duplicates.length > 0) {
    const duplicateList = duplicates.map(d => 
      d.orderNumber 
        ? `Service: ${d.serviceNumber}, WO: ${d.orderNumber}`
        : `Service: ${d.serviceNumber} (no WO)`
    ).join('; ');
    throw new Error(`Duplicate orders found: ${duplicateList}`);
  }
  
  await db.insert(orders).values(orderList);
}

export async function bulkUpsertOrders(orderList: InsertOrder[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (orderList.length === 0) return;
  
  // For each order, check if it exists and update, otherwise insert
  for (const order of orderList) {
    if (!order.serviceNumber) continue;
    
    // Build the where condition based on whether WO No. exists
    const whereCondition = order.orderNumber && order.orderNumber.trim() !== ''
      ? and(
          eq(orders.serviceNumber, order.serviceNumber),
          eq(orders.orderNumber, order.orderNumber)
        )
      : and(
          eq(orders.serviceNumber, order.serviceNumber),
          or(
            eq(orders.orderNumber, ''),
            isNull(orders.orderNumber)
          )
        );
    
    const existing = await db.select().from(orders).where(whereCondition).limit(1);
    
    if (existing.length > 0) {
      // Update existing order
      await db.update(orders).set(order).where(eq(orders.id, existing[0].id));
    } else {
      // Insert new order
      await db.insert(orders).values(order);
    }
  }
}

// Installers queries
export async function getAllInstallers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(installers);
}

export async function getInstallerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(installers).where(eq(installers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createInstaller(installer: InsertInstaller) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(installers).values(installer);
  return result;
}

export async function updateInstaller(id: number, installer: Partial<InsertInstaller>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(installers).set(installer).where(eq(installers.id, id));
}

export async function deleteInstaller(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(installers).where(eq(installers.id, id));
}

export async function bulkCreateInstallers(installerList: InsertInstaller[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (installerList.length === 0) return;
  await db.insert(installers).values(installerList);
}

export async function linkUserToInstaller(installerId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(installers).set({ userId }).where(eq(installers.id, installerId));
}

export async function unlinkUserFromInstaller(installerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(installers).set({ userId: null }).where(eq(installers.id, installerId));
}

export async function getInstallerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(installers).where(eq(installers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Assignments queries
export async function getAllAssignments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assignments);
}

export async function getAssignmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAssignmentsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assignments)
    .where(and(
      gte(assignments.scheduledDate, startDate),
      lte(assignments.scheduledDate, endDate)
    ));
}

export async function getAssignmentsByOrder(orderId: number) {
  const database = await getDb();
  if (!database) return [];
  return await database.select().from(assignments).where(eq(assignments.orderId, orderId));
}

export async function getAssignmentsByInstaller(installerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assignments).where(eq(assignments.installerId, installerId));
}



export async function createAssignment(assignment: InsertAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assignments).values(assignment);
  return result;
}

export async function updateAssignment(id: number, assignment: Partial<InsertAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(assignments).set(assignment).where(eq(assignments.id, id));
}

export async function deleteAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assignments).where(eq(assignments.id, id));
}


// Notes queries
export async function getAllNotes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notes).orderBy(notes.createdAt);
}

export async function getNoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getNotesByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notes).where(eq(notes.date, date)).orderBy(notes.createdAt);
}

export async function getNotesByServiceNumber(serviceNumber: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notes).where(eq(notes.serviceNumber, serviceNumber)).orderBy(notes.createdAt);
}

export async function getNotesByDateRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notes).where(
    and(
      gte(notes.date, startDate),
      lte(notes.date, endDate)
    )
  ).orderBy(notes.createdAt);
}

export async function createNote(note: InsertNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notes).values(note);
  return result;
}

export async function updateNote(id: number, note: Partial<InsertNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notes).set(note).where(eq(notes.id, id));
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notes).where(eq(notes.id, id));
}

// Order History / Audit Log queries
export async function getOrderHistory(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orderHistory)
    .where(eq(orderHistory.orderId, orderId))
    .orderBy(orderHistory.createdAt);
}

export async function logOrderHistory(entry: InsertOrderHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orderHistory).values(entry);
}

export async function logOrderCreation(orderId: number, userId: number | null, userName: string | null, orderData: any) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(orderHistory).values({
    orderId,
    userId,
    userName,
    action: "created",
    fieldName: null,
    oldValue: null,
    newValue: JSON.stringify(orderData),
  });
}

export async function logOrderUpdate(orderId: number, userId: number | null, userName: string | null, changes: Record<string, { old: any, new: any }>) {
  const db = await getDb();
  if (!db) return;
  
  const entries: InsertOrderHistory[] = [];
  
  for (const [fieldName, { old: oldValue, new: newValue }] of Object.entries(changes)) {
    // Skip if values are the same
    if (oldValue === newValue) continue;
    
    entries.push({
      orderId,
      userId,
      userName,
      action: fieldName === "status" ? "status_changed" : "updated",
      fieldName,
      oldValue: oldValue != null ? String(oldValue) : null,
      newValue: newValue != null ? String(newValue) : null,
    });
  }
  
  if (entries.length > 0) {
    await db.insert(orderHistory).values(entries);
  }
}

// ============= Assignment History Functions =============

export async function logAssignmentHistory(entry: InsertAssignmentHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(assignmentHistory).values(entry);
}

export async function getAssignmentHistory(filters?: {
  startDate?: string;
  endDate?: string;
  installerId?: number;
  orderId?: number;
  action?: "created" | "updated" | "deleted" | "reassigned";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  
  if (filters?.startDate) {
    conditions.push(gte(assignmentHistory.scheduledDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(assignmentHistory.scheduledDate, filters.endDate));
  }
  if (filters?.installerId) {
    conditions.push(eq(assignmentHistory.installerId, filters.installerId));
  }
  if (filters?.orderId) {
    conditions.push(eq(assignmentHistory.orderId, filters.orderId));
  }
  if (filters?.action) {
    conditions.push(eq(assignmentHistory.action, filters.action));
  }

  const query = db
    .select()
    .from(assignmentHistory)
    .$dynamic();

  if (conditions.length > 0) {
    return await query.where(and(...conditions)).orderBy(assignmentHistory.createdAt);
  }

  return await query.orderBy(assignmentHistory.createdAt);
}


// ==================== TIME SLOTS ====================

export async function getAllTimeSlots() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(timeSlots).orderBy(timeSlots.sortOrder);
}

export async function getActiveTimeSlots() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(timeSlots).where(eq(timeSlots.isActive, 1)).orderBy(timeSlots.sortOrder);
}

export async function createTimeSlot(timeSlot: InsertTimeSlot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(timeSlots).values(timeSlot);
  return result;
}

export async function updateTimeSlot(id: number, updates: Partial<InsertTimeSlot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(timeSlots).set(updates).where(eq(timeSlots.id, id));
}

export async function deleteTimeSlot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(timeSlots).where(eq(timeSlots.id, id));
}

export async function reorderTimeSlots(timeSlotIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update sortOrder for each time slot based on array index
  for (let i = 0; i < timeSlotIds.length; i++) {
    await db.update(timeSlots).set({ sortOrder: i }).where(eq(timeSlots.id, timeSlotIds[i]));
  }
}

export async function seedDefaultTimeSlots() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if time slots already exist
  const existing = await db.select().from(timeSlots).limit(1);
  if (existing.length > 0) {
    return; // Already seeded
  }
  
  // Insert default time slots
  const defaultSlots = [
    { time: "9:00 AM", sortOrder: 0, isActive: 1 },
    { time: "10:00 AM", sortOrder: 1, isActive: 1 },
    { time: "11:00 AM", sortOrder: 2, isActive: 1 },
    { time: "11:30 AM", sortOrder: 3, isActive: 1 },
    { time: "1:00 PM", sortOrder: 4, isActive: 1 },
    { time: "2:30 PM", sortOrder: 5, isActive: 1 },
    { time: "3:00 PM", sortOrder: 6, isActive: 1 },
    { time: "4:00 PM", sortOrder: 7, isActive: 1 },
    { time: "6:00 PM", sortOrder: 8, isActive: 1 },
  ];
  
  for (const slot of defaultSlots) {
    await db.insert(timeSlots).values(slot);
  }
}

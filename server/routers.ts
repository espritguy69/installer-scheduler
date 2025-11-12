import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOrderAssigned, notifyOrderCompleted, notifyOrderRescheduled, notifyOrderWithdrawn } from "./notifications";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Only admin can list users
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return await db.getAllUsers();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return await db.getUserById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      openId: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      loginMethod: z.string().optional(),
      role: z.enum(['user', 'admin', 'supervisor']),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return await db.createUser(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      role: z.enum(['user', 'admin', 'supervisor']).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      const { id, ...data } = input;
      await db.updateUser(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      // Prevent deleting yourself
      if (ctx.user.id === input.id) {
        throw new Error('Cannot delete your own account');
      }
      await db.deleteUser(input.id);
      return { success: true };
    }),
  }),

  orders: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllOrders();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getOrderById(input.id);
    }),
    getHistory: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ input }) => {
      return await db.getOrderHistory(input.orderId);
    }),
    create: protectedProcedure.input(z.object({
      orderNumber: z.string().optional(),
      ticketNumber: z.string().optional(),
      serviceNumber: z.string(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      serviceType: z.string().optional(),
      salesModiType: z.string().optional(),
      address: z.string().optional(),
      appointmentDate: z.string().optional(),
      appointmentTime: z.string().optional(),
      buildingName: z.string().optional(),
      estimatedDuration: z.number().default(60),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await db.createOrder(input);
      
      // Log order creation in audit log
      const insertId = (result as any).insertId || (result as any)[0]?.insertId;
      if (insertId) {
        await db.logOrderCreation(
          insertId,
          ctx.user?.id || null,
          ctx.user?.name || null,
          input
        );
      }
      
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      orderNumber: z.string().optional(),
      ticketNumber: z.string().optional(),
      serviceNumber: z.string().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      serviceType: z.string().optional(),
      salesModiType: z.string().optional(),
      address: z.string().optional(),
      appointmentDate: z.string().optional(),
      appointmentTime: z.string().optional(),
      buildingName: z.string().optional(),
      estimatedDuration: z.number().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      status: z.enum(["pending", "assigned", "on_the_way", "met_customer", "order_completed", "docket_received", "docket_uploaded", "ready_to_invoice", "invoiced", "completed", "customer_issue", "building_issue", "network_issue", "rescheduled", "withdrawn"]).optional(),
      rescheduleReason: z.enum(["customer_issue", "building_issue", "network_issue"]).optional(),
      rescheduledDate: z.date().optional(),
      rescheduledTime: z.string().optional(),
      notes: z.string().optional(),
      docketFileUrl: z.string().optional(),
      docketFileName: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      
      // Get old order data for audit log
      const oldOrder = await db.getOrderById(id);
      
      await db.updateOrder(id, data);
      
      // Log changes in audit log
      if (oldOrder) {
        const changes: Record<string, { old: any, new: any }> = {};
        for (const [key, newValue] of Object.entries(data)) {
          if (newValue !== undefined) {
            const oldValue = oldOrder[key as keyof typeof oldOrder];
            if (oldValue !== newValue) {
              changes[key] = { old: oldValue, new: newValue };
            }
          }
        }
        
        if (Object.keys(changes).length > 0) {
          await db.logOrderUpdate(
            id,
            ctx.user?.id || null,
            ctx.user?.name || null,
            changes
          );
        }
      }
      
      // Send notifications for status changes
      try {
        const updatedOrder = await db.getOrderById(id);
        if (updatedOrder) {
          if (data.status === "completed") {
            // Get installer name from assignment
            const assignments = await db.getAssignmentsByOrder(id);
            const installerName = assignments.length > 0 
              ? (await db.getInstallerById(assignments[0].installerId))?.name || "Unknown"
              : "Unknown";
            
            await notifyOrderCompleted({
              orderNumber: updatedOrder.orderNumber || updatedOrder.serviceNumber,
              installerName,
              customerName: updatedOrder.customerName,
            });
          } else if (data.status === "rescheduled" && data.rescheduleReason) {
            // Get installer name from assignment
            const assignments = await db.getAssignmentsByOrder(id);
            const installerName = assignments.length > 0 
              ? (await db.getInstallerById(assignments[0].installerId))?.name || "Unknown"
              : "Unknown";
            
            await notifyOrderRescheduled({
              orderNumber: updatedOrder.orderNumber || updatedOrder.serviceNumber,
              installerName,
              customerName: updatedOrder.customerName,
              reason: data.rescheduleReason,
              newDate: data.rescheduledDate?.toLocaleDateString() || "TBD",
              newTime: data.rescheduledTime || "TBD",
            });
          } else if (data.status === "withdrawn") {
            await notifyOrderWithdrawn({
              orderNumber: updatedOrder.orderNumber || updatedOrder.serviceNumber,
              customerName: updatedOrder.customerName,
            });
          }
        }
      } catch (error) {
        console.error("Failed to send status change notification:", error);
      }
      
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteOrder(input.id);
      return { success: true };
    }),
    bulkCreate: protectedProcedure.input(z.array(z.object({
      orderNumber: z.string().optional(),
      ticketNumber: z.string().optional(),
      serviceNumber: z.string(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      serviceType: z.string().optional(),
      salesModiType: z.string().optional(),
      address: z.string().optional(),
      appointmentDate: z.string().optional(),
      appointmentTime: z.string().optional(),
      buildingName: z.string().optional(),
      estimatedDuration: z.number().default(60),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      notes: z.string().optional(),
    }))).mutation(async ({ input }) => {
      await db.bulkCreateOrders(input);
      return { success: true, count: input.length };
    }),
    clearAll: protectedProcedure.mutation(async () => {
      await db.clearAllOrders();
      return { success: true };
    }),
    uploadDocketFile: protectedProcedure.input(z.object({
      orderId: z.number(),
      fileData: z.string(), // base64 encoded file
      fileName: z.string(),
      fileType: z.string(),
    })).mutation(async ({ input }) => {
      // Import storage helper
      const { storagePut } = await import("./storage");
      
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(input.fileData, "base64");
      
      // Upload to S3 with unique key
      const fileKey = `dockets/${input.orderId}-${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, fileBuffer, input.fileType);
      
      // Update order with docket file info
      await db.updateOrderDocketFile(input.orderId, url, input.fileName);
      
      return { success: true, url };
    }),
  }),

  installers: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllInstallers();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getInstallerById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      skills: z.string().optional(),
      isActive: z.number().default(1),
    })).mutation(async ({ input }) => {
      return await db.createInstaller(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      skills: z.string().optional(),
      isActive: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateInstaller(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteInstaller(input.id);
      return { success: true };
    }),
    bulkCreate: protectedProcedure.input(z.array(z.object({
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      skills: z.string().optional(),
      isActive: z.number().default(1),
    }))).mutation(async ({ input }) => {
      await db.bulkCreateInstallers(input);
      return { success: true, count: input.length };
    }),
    linkUser: protectedProcedure.input(z.object({
      installerId: z.number(),
      userId: z.number(),
    })).mutation(async ({ input }) => {
      await db.linkUserToInstaller(input.installerId, input.userId);
      return { success: true };
    }),
    unlinkUser: protectedProcedure.input(z.object({
      installerId: z.number(),
    })).mutation(async ({ input }) => {
      await db.unlinkUserFromInstaller(input.installerId);
      return { success: true };
    }),
  }),

  assignments: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllAssignments();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getAssignmentById(input.id);
    }),
    getByDateRange: protectedProcedure.input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    })).query(async ({ input }) => {
      return await db.getAssignmentsByDateRange(input.startDate, input.endDate);
    }),
    getByInstaller: protectedProcedure.input(z.object({ installerId: z.number() })).query(async ({ input }) => {
      return await db.getAssignmentsByInstaller(input.installerId);
    }),
    getByOrder: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ input }) => {
      return await db.getAssignmentsByOrder(input.orderId);
    }),
    create: protectedProcedure.input(z.object({
      orderId: z.number(),
      installerId: z.number(),
      scheduledDate: z.date(),
      scheduledStartTime: z.string().regex(/^\d{2}:\d{2}$/),
      scheduledEndTime: z.string().regex(/^\d{2}:\d{2}$/),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await db.createAssignment(input);
      const insertId = (result as any).insertId || (result as any)[0]?.insertId;
      
      // Log assignment history and send notification
      try {
        const order = await db.getOrderById(input.orderId);
        const installer = await db.getInstallerById(input.installerId);
        if (order && installer) {
          // Log history
          await db.logAssignmentHistory({
            assignmentId: insertId,
            orderId: input.orderId,
            orderNumber: order.orderNumber,
            installerId: input.installerId,
            installerName: installer.name,
            scheduledDate: input.scheduledDate.toISOString().split('T')[0],
            scheduledStartTime: input.scheduledStartTime,
            scheduledEndTime: input.scheduledEndTime,
            action: "created",
            assignedBy: ctx.user?.id || null,
            assignedByName: ctx.user?.name || null,
            notes: input.notes || null,
          });
          
          // Send notification
          await notifyOrderAssigned({
            orderNumber: order.orderNumber || order.serviceNumber,
            installerName: installer.name,
            customerName: order.customerName,
            scheduledDate: input.scheduledDate.toLocaleDateString(),
            scheduledTime: `${input.scheduledStartTime} - ${input.scheduledEndTime}`,
          });
        }
      } catch (error) {
        console.error("Failed to log assignment history or send notification:", error);
      }
      
      return result;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      orderId: z.number().optional(),
      installerId: z.number().optional(),
      scheduledDate: z.date().optional(),
      scheduledStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      scheduledEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      
      // Get old assignment for history
      const oldAssignment = await db.getAssignmentById(id);
      
      await db.updateAssignment(id, data);
      
      // Log history if installer or schedule changed (reassignment)
      if (oldAssignment && (data.installerId || data.scheduledDate || data.scheduledStartTime)) {
        try {
          const order = await db.getOrderById(oldAssignment.orderId);
          const newInstallerId = data.installerId || oldAssignment.installerId;
          const installer = await db.getInstallerById(newInstallerId);
          
          if (order && installer) {
            const action = data.installerId && data.installerId !== oldAssignment.installerId ? "reassigned" : "updated";
            
            await db.logAssignmentHistory({
              assignmentId: id,
              orderId: oldAssignment.orderId,
              orderNumber: order.orderNumber,
              installerId: newInstallerId,
              installerName: installer.name,
              scheduledDate: data.scheduledDate ? data.scheduledDate.toISOString().split('T')[0] : oldAssignment.scheduledDate.toISOString().split('T')[0],
              scheduledStartTime: data.scheduledStartTime || oldAssignment.scheduledStartTime,
              scheduledEndTime: data.scheduledEndTime || oldAssignment.scheduledEndTime,
              action,
              assignedBy: ctx.user?.id || null,
              assignedByName: ctx.user?.name || null,
              notes: data.notes || null,
            });
          }
        } catch (error) {
          console.error("Failed to log assignment history:", error);
        }
      }
      
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      // Get assignment before deletion for history
      const assignment = await db.getAssignmentById(input.id);
      
      await db.deleteAssignment(input.id);
      
      // Log deletion
      if (assignment) {
        try {
          const order = await db.getOrderById(assignment.orderId);
          const installer = await db.getInstallerById(assignment.installerId);
          
          if (order && installer) {
            await db.logAssignmentHistory({
              assignmentId: null, // Assignment is deleted
              orderId: assignment.orderId,
              orderNumber: order.orderNumber,
              installerId: assignment.installerId,
              installerName: installer.name,
              scheduledDate: assignment.scheduledDate.toISOString().split('T')[0],
              scheduledStartTime: assignment.scheduledStartTime,
              scheduledEndTime: assignment.scheduledEndTime,
              action: "deleted",
              assignedBy: ctx.user?.id || null,
              assignedByName: ctx.user?.name || null,
              notes: null,
            });
          }
        } catch (error) {
          console.error("Failed to log assignment deletion:", error);
        }
      }
      
      return { success: true };
    }),
  }),

  notes: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllNotes();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getNoteById(input.id);
    }),
    getByDate: protectedProcedure.input(z.object({ date: z.string() })).query(async ({ input }) => {
      return await db.getNotesByDate(input.date);
    }),
    getByServiceNumber: protectedProcedure.input(z.object({ serviceNumber: z.string() })).query(async ({ input }) => {
      return await db.getNotesByServiceNumber(input.serviceNumber);
    }),
    getByDateRange: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })).query(async ({ input }) => {
      return await db.getNotesByDateRange(input.startDate, input.endDate);
    }),

    create: protectedProcedure.input(z.object({
      date: z.string(),
      serviceNumber: z.string().optional(),
      orderNumber: z.string().optional(),
      customerName: z.string().optional(),
      noteType: z.enum(["general", "reschedule", "follow_up", "incident", "complaint"]).default("general"),
      title: z.string(),
      content: z.string(),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
      createdBy: z.string().optional(),
    })).mutation(async ({ input }) => {
      return await db.createNote(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      date: z.string().optional(),
      serviceNumber: z.string().optional(),
      orderNumber: z.string().optional(),
      customerName: z.string().optional(),
      noteType: z.enum(["general", "reschedule", "follow_up", "incident", "complaint"]).optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      createdBy: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateNote(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteNote(input.id);
      return { success: true };
    }),
  }),

  assignmentHistory: router({
    list: protectedProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      installerId: z.number().optional(),
      orderId: z.number().optional(),
      action: z.enum(["created", "updated", "deleted", "reassigned"]).optional(),
    }).optional()).query(async ({ input }) => {
      return await db.getAssignmentHistory(input);
    }),
    log: protectedProcedure.input(z.object({
      assignmentId: z.number().optional(),
      orderId: z.number(),
      orderNumber: z.string().optional(),
      installerId: z.number(),
      installerName: z.string().optional(),
      scheduledDate: z.string().optional(),
      scheduledStartTime: z.string().optional(),
      scheduledEndTime: z.string().optional(),
      action: z.enum(["created", "updated", "deleted", "reassigned"]),
      assignedBy: z.number().optional(),
      assignedByName: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.logAssignmentHistory(input);
      return { success: true };
    }),
  }),

  timeSlots: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTimeSlots();
    }),
    listActive: protectedProcedure.query(async () => {
      return await db.getActiveTimeSlots();
    }),
    create: protectedProcedure.input(z.object({
      time: z.string(),
      sortOrder: z.number(),
      isActive: z.number().default(1),
    })).mutation(async ({ input }) => {
      return await db.createTimeSlot(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      time: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTimeSlot(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input }) => {
      await db.deleteTimeSlot(input.id);
      return { success: true };
    }),
    reorder: protectedProcedure.input(z.object({
      timeSlotIds: z.array(z.number()),
    })).mutation(async ({ input }) => {
      await db.reorderTimeSlots(input.timeSlotIds);
      return { success: true };
    }),
    seedDefaults: protectedProcedure.mutation(async () => {
      await db.seedDefaultTimeSlots();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;

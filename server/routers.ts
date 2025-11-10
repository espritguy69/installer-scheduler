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

  orders: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllOrders();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getOrderById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      orderNumber: z.string(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      serviceType: z.string().optional(),
      address: z.string().optional(),
      estimatedDuration: z.number().default(60),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      return await db.createOrder(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      orderNumber: z.string().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      serviceType: z.string().optional(),
      address: z.string().optional(),
      estimatedDuration: z.number().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      status: z.enum(["pending", "assigned", "on_the_way", "met_customer", "completed", "rescheduled", "withdrawn"]).optional(),
      rescheduleReason: z.enum(["customer_issue", "building_issue", "network_issue"]).optional(),
      rescheduledDate: z.date().optional(),
      rescheduledTime: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      // Get order and assignment info before update for notifications
      const order = await db.getOrderById(id);
      const oldStatus = order?.status;
      
      await db.updateOrder(id, data);
      
      // Send notifications based on status change
      if (data.status && data.status !== oldStatus) {
        try {
          // Get assignment to find installer name
          const assignments = await db.getAssignmentsByOrder(id);
          const assignment = assignments[0];
          let installerName = "Unknown";
          
          if (assignment) {
            const installer = await db.getInstallerById(assignment.installerId);
            installerName = installer?.name || "Unknown";
          }
          
          if (data.status === "completed" && order) {
            await notifyOrderCompleted({
              orderNumber: order.orderNumber,
              installerName,
              customerName: order.customerName,
            });
          } else if (data.status === "rescheduled" && order && data.rescheduleReason && data.rescheduledDate && data.rescheduledTime) {
            await notifyOrderRescheduled({
              orderNumber: order.orderNumber,
              installerName,
              customerName: order.customerName,
              reason: data.rescheduleReason,
              newDate: new Date(data.rescheduledDate).toLocaleDateString(),
              newTime: data.rescheduledTime,
            });
          } else if (data.status === "withdrawn" && order) {
            await notifyOrderWithdrawn({
              orderNumber: order.orderNumber,
              customerName: order.customerName,
            });
          }
        } catch (error) {
          console.error("Failed to send status change notification:", error);
        }
      }
      
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteOrder(input.id);
      return { success: true };
    }),
    bulkCreate: protectedProcedure.input(z.array(z.object({
      orderNumber: z.string(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
      serviceType: z.string().optional(),
      salesModiType: z.string().optional(),
      address: z.string().optional(),
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
    })).mutation(async ({ input }) => {
      const result = await db.createAssignment(input);
      
      // Send notification
      try {
        const order = await db.getOrderById(input.orderId);
        const installer = await db.getInstallerById(input.installerId);
        if (order && installer) {
          await notifyOrderAssigned({
            orderNumber: order.orderNumber,
            installerName: installer.name,
            customerName: order.customerName,
            scheduledDate: input.scheduledDate.toLocaleDateString(),
            scheduledTime: `${input.scheduledStartTime} - ${input.scheduledEndTime}`,
          });
        }
      } catch (error) {
        console.error("Failed to send assignment notification:", error);
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
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateAssignment(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteAssignment(input.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;

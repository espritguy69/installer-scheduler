import { notifyOwner } from "./_core/notification";

/**
 * Send notification when a new order is assigned to an installer
 */
export async function notifyOrderAssigned(params: {
  orderNumber: string;
  installerName: string;
  customerName: string;
  scheduledDate: string;
  scheduledTime: string;
}) {
  const { orderNumber, installerName, customerName, scheduledDate, scheduledTime } = params;
  
  const title = `Order Assigned: ${orderNumber}`;
  const content = `Order ${orderNumber} for customer ${customerName} has been assigned to ${installerName} on ${scheduledDate} at ${scheduledTime}.`;
  
  return await notifyOwner({ title, content });
}

/**
 * Send notification when an order is completed
 */
export async function notifyOrderCompleted(params: {
  orderNumber: string;
  installerName: string;
  customerName: string;
}) {
  const { orderNumber, installerName, customerName } = params;
  
  const title = `Order Completed: ${orderNumber}`;
  const content = `Order ${orderNumber} for customer ${customerName} has been completed by ${installerName}.`;
  
  return await notifyOwner({ title, content });
}

/**
 * Send notification when an order is rescheduled
 */
export async function notifyOrderRescheduled(params: {
  orderNumber: string;
  installerName: string;
  customerName: string;
  reason: string;
  newDate: string;
  newTime: string;
}) {
  const { orderNumber, installerName, customerName, reason, newDate, newTime } = params;
  
  const reasonText = reason.replace("_", " ");
  const title = `Order Rescheduled: ${orderNumber}`;
  const content = `Order ${orderNumber} for customer ${customerName} has been rescheduled by ${installerName} due to ${reasonText}. New schedule: ${newDate} at ${newTime}.`;
  
  return await notifyOwner({ title, content });
}

/**
 * Send notification when an order is withdrawn
 */
export async function notifyOrderWithdrawn(params: {
  orderNumber: string;
  customerName: string;
}) {
  const { orderNumber, customerName } = params;
  
  const title = `Order Withdrawn: ${orderNumber}`;
  const content = `Order ${orderNumber} for customer ${customerName} has been withdrawn (customer not interested).`;
  
  return await notifyOwner({ title, content });
}

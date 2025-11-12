/**
 * Mock data generators for Storybook stories
 * 
 * This file provides realistic mock data for testing components in isolation.
 */

export type OrderStatus =
  | "pending"
  | "assigned"
  | "on_the_way"
  | "met_customer"
  | "completed"
  | "docket_received"
  | "docket_uploaded"
  | "rescheduled"
  | "withdrawn";

export type Order = {
  id: number;
  orderNumber: string;
  ticketNumber: string | null;
  serviceNumber: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceType: string | null;
  salesModiType: string | null;
  address: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  buildingName: string | null;
  estimatedDuration: number;
  priority: "low" | "medium" | "high";
  status: OrderStatus;
  rescheduleReason: "customer_issue" | "building_issue" | "network_issue" | null;
  rescheduledDate: Date | null;
  rescheduledTime: string | null;
  notes: string | null;
  docketFileUrl: string | null;
  docketFileName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Installer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string | null;
  isActive: number;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Assignment = {
  id: number;
  orderId: number;
  installerId: number;
  assignedAt: Date;
  status: string;
};

export type TimeSlot = {
  id: number;
  time: string;
  sortOrder: number;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
};

// Mock orders
export const mockOrders: Order[] = [
  {
    id: 1,
    orderNumber: "AWO437076",
    ticketNumber: "TTKT202511108600382",
    serviceNumber: "TBBN560139G",
    customerName: "PAIS SERHII",
    customerPhone: "1051186478",
    customerEmail: null,
    serviceType: "Installation",
    salesModiType: "New",
    address: "123 Main St, Kuala Lumpur",
    appointmentDate: "2025-11-12",
    appointmentTime: "9:00 AM",
    buildingName: "THE WESTSIDE I",
    estimatedDuration: 60,
    priority: "medium",
    status: "pending",
    rescheduleReason: null,
    rescheduledDate: null,
    rescheduledTime: null,
    notes: null,
    docketFileUrl: null,
    docketFileName: null,
    createdAt: new Date("2025-11-10"),
    updatedAt: new Date("2025-11-10"),
  },
  {
    id: 2,
    orderNumber: "A1793156",
    ticketNumber: "TTKT202511098599461",
    serviceNumber: "TBBNB018400G",
    customerName: "MOHD ZAHID ZAIDI BIN ZAKI",
    customerPhone: "013-8100632",
    customerEmail: null,
    serviceType: "Repair",
    salesModiType: "Maintenance",
    address: "456 Park Ave, Petaling Jaya",
    appointmentDate: "2025-11-12",
    appointmentTime: "10:00 AM",
    buildingName: "RESIDENSI SUNWAY ARTESSA",
    estimatedDuration: 90,
    priority: "high",
    status: "assigned",
    rescheduleReason: null,
    rescheduledDate: null,
    rescheduledTime: null,
    notes: null,
    docketFileUrl: null,
    docketFileName: null,
    createdAt: new Date("2025-11-09"),
    updatedAt: new Date("2025-11-11"),
  },
  {
    id: 3,
    orderNumber: "M1795186",
    ticketNumber: null,
    serviceNumber: "DIGI0017299",
    customerName: "NUR NAJLAA 'AQILAH",
    customerPhone: "012-3456789",
    customerEmail: "najlaa@example.com",
    serviceType: "Upgrade",
    salesModiType: "Modi",
    address: "789 Central Rd, Shah Alam",
    appointmentDate: "2025-11-12",
    appointmentTime: "11:00 AM",
    buildingName: "SRI PENARA",
    estimatedDuration: 120,
    priority: "low",
    status: "completed",
    rescheduleReason: null,
    rescheduledDate: null,
    rescheduledTime: null,
    notes: "Completed successfully",
    docketFileUrl: "/uploads/docket-123.pdf",
    docketFileName: "docket-123.pdf",
    createdAt: new Date("2025-11-08"),
    updatedAt: new Date("2025-11-12"),
  },
];

// Mock installers
export const mockInstallers: Installer[] = [
  {
    id: 1,
    name: "AFIZ",
    email: "afiz@example.com",
    phone: "012-1234567",
    skills: "Installation, Repair",
    isActive: 1,
    userId: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: 2,
    name: "AMMAR",
    email: "ammar@example.com",
    phone: "012-2345678",
    skills: "Installation, Maintenance",
    isActive: 1,
    userId: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: 3,
    name: "KLAVIN",
    email: "klavin@example.com",
    phone: "012-3456789",
    skills: "Repair, Upgrade",
    isActive: 1,
    userId: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

// Mock assignments
export const mockAssignments: Assignment[] = [
  {
    id: 1,
    orderId: 2,
    installerId: 1,
    assignedAt: new Date("2025-11-11"),
    status: "active",
  },
];

// Mock time slots
export const mockTimeSlots: TimeSlot[] = [
  { id: 1, time: "9:00 AM", sortOrder: 0, isActive: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, time: "10:00 AM", sortOrder: 1, isActive: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, time: "11:00 AM", sortOrder: 2, isActive: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, time: "1:00 PM", sortOrder: 3, isActive: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 5, time: "2:30 PM", sortOrder: 4, isActive: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 6, time: "3:00 PM", sortOrder: 5, isActive: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 7, time: "6:00 PM", sortOrder: 6, isActive: 1, createdAt: new Date(), updatedAt: new Date() },
];

// Helper functions to generate additional mock data
export function generateMockOrders(count: number): Order[] {
  const orders: Order[] = [];
  const statuses: OrderStatus[] = ["pending", "assigned", "on_the_way", "met_customer", "completed"];
  const priorities: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
  const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:30 PM", "3:00 PM"];

  for (let i = 0; i < count; i++) {
    orders.push({
      id: i + 100,
      orderNumber: `WO${100000 + i}`,
      ticketNumber: `TTKT${Date.now() + i}`,
      serviceNumber: `SVC${10000 + i}`,
      customerName: `Customer ${i + 1}`,
      customerPhone: `012-${String(i).padStart(7, "0")}`,
      customerEmail: `customer${i}@example.com`,
      serviceType: "Installation",
      salesModiType: "New",
      address: `${i + 1} Test Street, Kuala Lumpur`,
      appointmentDate: "2025-11-12",
      appointmentTime: times[i % times.length],
      buildingName: `Building ${i + 1}`,
      estimatedDuration: 60 + (i % 3) * 30,
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      rescheduleReason: null,
      rescheduledDate: null,
      rescheduledTime: null,
      notes: null,
      docketFileUrl: null,
      docketFileName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return orders;
}

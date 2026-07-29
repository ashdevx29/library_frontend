import { z } from 'zod';

export const shiftSchema = z.object({
  shiftName: z.string().min(2, 'Name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  description: z.string().optional(),
});

export const seatSchema = z.object({
  seatNumber: z.string().min(1, 'Seat number is required'),
  floor: z.string().min(1, 'Floor is required'),
  seatType: z.enum(['Standard', 'Premium', 'AC', 'VIP'], { required_error: 'Type is required' }),
  status: z.enum(['Available', 'Occupied', 'Reserved', 'Inactive']).optional(),
  shiftId: z.string().optional(),
});

export const paymentSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  amount: z.string().min(1, 'Amount is required'),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Online'], { required_error: 'Method is required' }),
  paymentDate: z.string().min(1, 'Date is required'),
  transactionId: z.string().optional(),
  status: z.enum(['Paid', 'Pending', 'Failed']).optional(),
  description: z.string().optional(),
});

export const expenseSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
  expenseDate: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank Transfer']).optional(),
});

export const notificationSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  message: z.string().min(5, 'Message is required'),
  type: z.enum(['Fee Reminder', 'Membership Expiry', 'Attendance Alert', 'General Notice'], { required_error: 'Type is required' }),
  targetRole: z.enum(['All', 'Student', 'Staff']).optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(5, 'Description is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['Active', 'Inactive']).optional(),
});

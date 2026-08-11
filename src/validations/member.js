import { z } from 'zod';

export const memberSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  mobile: z.string().length(10, 'Mobile must be 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  shiftId: z.string().min(1, 'Shift is required'),
  seatId: z.string().min(1, 'Seat is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  joiningDate: z.string().min(1, 'Joining date is required'),
  membershipPlan: z.enum(['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'], { required_error: 'Plan is required' }),
  amount: z.union([z.string(), z.number()]).optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
}).refine(data => {
  if (data.password && data.password !== data.confirmPassword) return false;
  return true;
}, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const memberEditSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  mobile: z.string().length(10, 'Mobile must be 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  shiftId: z.string().min(1, 'Shift is required'),
  seatId: z.string().min(1, 'Seat is required'),
});

export const renewSchema = z.object({
  membershipPlan: z.enum(['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'], { required_error: 'Plan is required' }),
  amount: z.string().min(1, 'Amount is required'),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Online'], { required_error: 'Payment method is required' }),
});

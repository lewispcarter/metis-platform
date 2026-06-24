/**
 * SHARED VALIDATION PACKAGE
 * Purpose: Publishes reusable validation schemas for API and UI contracts.
 * Role: Keeps request validation consistent across system boundaries.
 */
import { z } from 'zod';

export const organizationIdSchema = z.string().uuid();
export const nonEmptyStringSchema = z.string().min(1);
export const isoDateStringSchema = z.string().datetime();

export const eventPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']);
export const eventSeveritySchema = z.enum(['S1_CRITICAL', 'S2_HIGH', 'S3_MEDIUM', 'S4_LOW']);

export const createOperationalEventSchema = z.object({
  organizationId: organizationIdSchema,
  departmentId: z.string().uuid().optional(),
  eventType: nonEmptyStringSchema,
  eventCategory: nonEmptyStringSchema,
  title: nonEmptyStringSchema,
  description: z.string().optional(),
  source: nonEmptyStringSchema,
  severity: eventSeveritySchema,
  priority: eventPrioritySchema,
  metadata: z.record(z.unknown()).optional(),
});

export const createPersonnelSchema = z.object({
  organizationId: organizationIdSchema,
  departmentId: z.string().uuid().optional(),
  displayName: nonEmptyStringSchema,
  roleTitle: nonEmptyStringSchema,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

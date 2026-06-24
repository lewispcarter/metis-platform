// @ts-nocheck
/**
 * CREATE PERSONNEL DTO
 * Purpose: Defines validated input for creating personnel records.
 * Role: Keeps worker identity, contact, role, and certification data structured at the API boundary.
 */
import { IsArray, IsEmail, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePersonnelDto {
  @IsString()
  organizationId!: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsString()
  displayName!: string;

  @IsString()
  roleTitle!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

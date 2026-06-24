// @ts-nocheck
/**
 * CREATE ORGANIZATION DTO
 * Purpose: Validates organization creation input.
 * Role: Keeps tenant creation explicit and safe at the API boundary.
 */
import { IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

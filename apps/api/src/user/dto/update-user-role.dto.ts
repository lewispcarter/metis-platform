// @ts-nocheck
/**
 * UPDATE USER ROLE DTO
 * Purpose: Defines the admin payload for changing a user's platform role.
 * Role: Keeps role mutation inputs explicit and validation-friendly.
 */
import { IsString } from 'class-validator';
import type { PlatformRole } from '../../identity/types/role.types';

export class UpdateUserRoleDto {
  @IsString()
  roleName!: PlatformRole;
}

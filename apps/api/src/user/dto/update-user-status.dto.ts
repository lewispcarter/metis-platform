// @ts-nocheck
/**
 * UPDATE USER STATUS DTO
 * Purpose: Defines the admin payload for activating, inviting, suspending, or deactivating a platform user.
 * Role: Keeps user lifecycle updates explicit at the API boundary.
 */
import { IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @IsIn(['INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'])
  status!: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

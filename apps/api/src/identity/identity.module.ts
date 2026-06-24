// @ts-nocheck
/**
 * IDENTITY MODULE
 * Purpose: Centralizes authentication, authorization, tenant context, and permission enforcement.
 * Role: Provides the security boundary used by every operational platform module.
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthBoundaryService } from './auth-boundary.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformUserService } from './platform-user.service';
import { ClerkAuthProvider } from './providers/clerk-auth.provider';
import { RbacGuard } from './guards/rbac.guard';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    ClerkAuthProvider,
    PlatformUserService,
    AuthBoundaryService,
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
  exports: [AuthBoundaryService, ClerkAuthProvider, PlatformUserService],
})
export class IdentityModule {}

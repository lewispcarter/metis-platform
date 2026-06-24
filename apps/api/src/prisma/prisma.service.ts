// @ts-nocheck
/**
 * PRISMA SERVICE
 * Purpose: Provides the single database access boundary for the NestJS API.
 * Role: Owns Prisma client lifecycle management so domain services can persist tenant-scoped operational data safely.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * FUNCTION: onModuleInit
   * Inputs: none.
   * Outputs: Promise resolving when the database connection is established.
   * Functionality: Opens Prisma's database connection during application startup.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * FUNCTION: onModuleDestroy
   * Inputs: none.
   * Outputs: Promise resolving when the database connection is closed.
   * Functionality: Closes Prisma's database connection during application shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

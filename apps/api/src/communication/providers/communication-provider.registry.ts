// @ts-nocheck
/**
 * COMMUNICATION PROVIDER REGISTRY
 * Purpose: Selects the correct provider implementation for each outbound communication channel.
 * Role: Prevents workflows/controllers from knowing provider details and centralizes fallback provider selection.
 */
import { Injectable } from '@nestjs/common';
import type { CommunicationChannel } from '../communication.types';
import { EmailCommunicationProvider } from './email-communication.provider';
import { NoopCommunicationProvider } from './noop-communication.provider';
import { TwilioCommunicationProvider } from './twilio-communication.provider';
import type { CommunicationProvider } from './communication-provider.types';

@Injectable()
export class CommunicationProviderRegistry {
  constructor(
    private readonly noopProvider: NoopCommunicationProvider,
    private readonly twilioProvider: TwilioCommunicationProvider,
    private readonly emailProvider: EmailCommunicationProvider,
  ) {}

  /**
   * FUNCTION: getProvider
   * Inputs: communication channel.
   * Outputs: provider that supports the requested channel.
   * Functionality: Returns explicit production provider boundaries for SMS/VOICE/EMAIL and deterministic noop fallback for DASHBOARD/local behavior.
   */
  getProvider(channel: CommunicationChannel): CommunicationProvider {
    const providers: CommunicationProvider[] = [this.twilioProvider, this.emailProvider, this.noopProvider];
    return providers.find((provider) => provider.supports(channel)) ?? this.noopProvider;
  }
}

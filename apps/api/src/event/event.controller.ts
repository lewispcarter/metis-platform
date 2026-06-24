import { Body, Controller, Get, Post } from '@nestjs/common';
import { createLocalEvent, listLocalEvents } from './event.local-store';

@Controller('events')
export class EventController {
  @Get()
  listEvents() {
    return {
      ok: true,
      source: 'api-local-fallback',
      events: listLocalEvents(),
    };
  }

  @Post()
  createEvent(@Body() body: any) {
    const event = createLocalEvent(body ?? {});
    return {
      ok: true,
      source: 'api-local-fallback',
      event,
    };
  }
}

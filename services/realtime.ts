import { EventEmitter } from 'node:events';

export type RealtimeEvent =
  | {
      type: 'lead.assigned';
      leadId: string;
      serviceId: number;
    }
  | {
      type: 'lead.created';
      leadId: string;
      serviceId: number;
      status: 'ASSIGNED' | 'ALLOCATION_FAILED';
    }
  | {
      type: 'quota.reset';
      eventId: string;
    };

const globalForRealtime = globalThis as unknown as {
  realtimeEmitter?: EventEmitter;
};

const emitter = globalForRealtime.realtimeEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForRealtime.realtimeEmitter = emitter;
}

export function publishRealtimeEvent(event: RealtimeEvent) {
  emitter.emit('event', event);
}

export function subscribeRealtimeEvents(listener: (event: RealtimeEvent) => void) {
  emitter.on('event', listener);

  return () => {
    emitter.off('event', listener);
  };
}

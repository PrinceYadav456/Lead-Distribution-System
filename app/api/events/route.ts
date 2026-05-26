import { subscribeRealtimeEvents } from '@/services/realtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  let cleanup: () => void = () => undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode('retry: 3000\n\n'));

      const pingTimer = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 25_000);

      cleanup = subscribeRealtimeEvents((event) => {
        controller.enqueue(encoder.encode(`event: ${event.type}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });

      const cancel = cleanup;
      cleanup = () => {
        clearInterval(pingTimer);
        cancel();
      };
    },
    cancel() {
      cleanup();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

const client = createTRPCProxyClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      headers: {
        'x-admin-token': process.env.OWNER_OPEN_ID || 'admin',
      },
    }),
  ],
});

try {
  console.log('Triggering bot restart...');
  const result = await client.botControl.restart.mutate();
  console.log('Bot restart result:', result);
} catch (error) {
  console.error('Failed to restart bot:', error.message);
  process.exit(1);
}

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server';
import superjson from 'superjson';
import type {inferRouterInputs, inferRouterOutputs} from "@trpc/server";

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

const trpc = createTRPCProxyClient<AppRouter>({
    links: [
        httpBatchLink({ url: '/api/trpc',}),
    ],
    transformer: superjson,
});

export { trpc };
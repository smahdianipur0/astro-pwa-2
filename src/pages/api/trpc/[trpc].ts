import type {APIRoute} from "astro";
import {fetchRequestHandler} from "@trpc/server/adapters/fetch";
import {appRouter} from "../../../server";
import {createContext} from "../../../server/context.ts";

export const prerender = false;

export const ALL: APIRoute = ({ request }) => {
    return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext
    });
};
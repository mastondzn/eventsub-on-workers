import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { Environment } from '../env';
import { withStateService } from '../middlewares/states';

export const loginRoute = new Hono<{ Bindings: Environment }>().get(
    '/login',
    withStateService,
    zValidator('query', z.object({ scopes: z.array(z.string()).default(['channel:bot']) })),
    async (ctx) => {
        const url = new URL('https://id.twitch.tv/oauth2/authorize');
        const scopes = ctx.req.valid('query').scopes;

        url.searchParams.set('client_id', ctx.env.TWITCH_CLIENT_ID);
        url.searchParams.set('redirect_uri', 'http://localhost:3005/acknowledge');
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', scopes.join(' '));
        url.searchParams.set('state', await ctx.var.states.create());

        return ctx.redirect(url.href);
    },
);

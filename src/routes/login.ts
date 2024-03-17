import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { withStateService } from '../middlewares/states';
import { getOrigin } from '../utils/origin';
import { createRoute } from '../utils/route';

const querySchema = z.object({
    scopes: z
        .union([
            z.array(z.string()).transform((v) => v.flatMap((element) => element.split(' '))),
            z.string().transform((v) => [v]),
        ])
        .default(['user:read:chat', 'user:bot', 'channel:bot']),
});

export const loginRoute = createRoute(
    ['GET'],
    '/login',
    withStateService,
    zValidator('query', querySchema),
    async (ctx) => {
        const url = new URL('https://id.twitch.tv/oauth2/authorize');
        const scopes = ctx.req.valid('query').scopes;

        url.searchParams.set('client_id', ctx.env.TWITCH_CLIENT_ID);
        url.searchParams.set('redirect_uri', `${getOrigin(ctx)}/acknowledge`);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', scopes.join(' '));
        url.searchParams.set('state', await ctx.var.states.create());

        return ctx.redirect(url.href);
    },
);

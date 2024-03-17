import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { withStateService } from '../middlewares/states';
import { withUsersService } from '../middlewares/users';
import { createRoute } from '../utils/route';
import { zfetch } from '../utils/zfetch';

export const acknowledgeRoute = createRoute(
    ['GET'],
    '/acknowledge',
    withStateService,
    withUsersService,
    zValidator('query', z.object({ code: z.string(), state: z.string() })),
    async (ctx) => {
        const query = ctx.req.valid('query');
        const consumed = await ctx.var.states.consume(query.state);

        if (!consumed) {
            return ctx.json({ success: false, error: 'Invalid state' }, { status: 400 });
        }

        const {
            body: {
                access_token: accessToken,
                refresh_token: refreshToken,
                scope: scopesFromTwitch,
            },
        } = await zfetch({
            url: 'https://id.twitch.tv/oauth2/token',
            schema: z.object({
                access_token: z.string(),
                expires_in: z.number(),
                refresh_token: z.string(),
                scope: z.array(z.string()).default([]),
                token_type: z.literal('bearer'),
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
            body: [
                `client_id=${ctx.env.TWITCH_CLIENT_ID}`,
                `client_secret=${ctx.env.TWITCH_CLIENT_SECRET}`,
                `code=${query.code}`,
                'grant_type=authorization_code',
                `redirect_uri=http://localhost:3005/acknowledge`,
            ].join('&'),
        });

        const {
            body: { login, user_id: userId, expires_in: expiresIn },
        } = await zfetch({
            url: 'https://id.twitch.tv/oauth2/validate',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            schema: z.object({
                login: z.string(),
                user_id: z.string(),
                expires_in: z.number(),
            }),
        });

        await ctx.var.users.put({
            login,
            id: userId,
            scopes: scopesFromTwitch,
            refreshToken,
            accessToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            updatedAt: new Date(),
        });

        return ctx.json({ success: true });
    },
);

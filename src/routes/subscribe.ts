import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { withAppToken } from '../middlewares/app-token';
import { getOrigin } from '../utils/origin';
import { createRoute } from '../utils/route';
import { jfetch } from '../utils/zfetch';

// example of a route that triggers a subscription
export const subscribeRoute = createRoute(
    ['GET'],
    '/subscribe',
    withAppToken,
    zValidator('query', z.object({ broadcaster: z.string(), user: z.string() })),
    async (ctx) => {
        const { broadcaster, user } = ctx.req.valid('query');

        const { response } = await jfetch({
            url: 'https://api.twitch.tv/helix/eventsub/subscriptions',
            method: 'POST',
            body: {
                version: '1',
                type: 'channel.chat.message',
                transport: {
                    method: 'webhook',
                    callback: `${getOrigin(ctx)}/eventsub`,
                    // we use an arbitrary secret here, you can use something else
                    // but you must add logic to validate the signature in the eventsub route
                    secret: ctx.env.APP_SECRET,
                },
                condition: {
                    broadcaster_user_id: broadcaster,
                    user_id: user,
                },
            },
            headers: {
                'Client-ID': ctx.env.TWITCH_CLIENT_ID,
                Authorization: `Bearer ${await ctx.var.getAppToken()}`,
            },
        });

        return ctx.json({ success: response.ok }, { status: response.status });
    },
);

import { zValidator } from '@hono/zod-validator';
import { Hono, type MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import type { Environment } from '../env';

const validateSignature: MiddlewareHandler<{ Bindings: Environment }> = async (ctx, next) => {
    const signature = ctx.req.header('twitch-eventsub-message-signature');
    const messageId = ctx.req.header('twitch-eventsub-message-id');
    const timestamp = ctx.req.header('twitch-eventsub-message-timestamp');

    if (!signature || !messageId || !timestamp) {
        throw new HTTPException(400, {
            message: 'Missing signature, message id, or timestamp',
        });
    }

    const body = await ctx.req.raw.clone().text();
    const message = messageId + timestamp + body;

    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(ctx.env.APP_SECRET),
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign'],
    );

    const wantedSignatureBuffer = await crypto.subtle.sign(
        { name: 'HMAC' },
        key,
        encoder.encode(message),
    );

    const wantedSignature = [...new Uint8Array(wantedSignatureBuffer)]
        .map((byte) => `0${(byte & 0xff).toString(16)}`.slice(-2))
        .join('');

    if (signature !== `sha256=${wantedSignature}`) {
        throw new HTTPException(403, {
            message: 'Invalid signature',
        });
    }

    return next();
};

export const eventSubRoute = new Hono<{ Bindings: Environment }>().post(
    '/eventsub',
    validateSignature,
    zValidator(
        'header',
        z.object({
            'twitch-eventsub-message-type': z.enum([
                'notification',
                'revocation',
                'webhook_callback_verification',
            ]),
        }),
    ),
    async (ctx) => {
        const type = ctx.req.valid('header')['twitch-eventsub-message-type'];

        if (type === 'webhook_callback_verification') {
            const challengeSchema = z.object({ challenge: z.string() });
            const { challenge } = challengeSchema.parse(await ctx.req.json());

            return ctx.text(challenge, {
                headers: { 'content-type': 'text/plain' },
            });
        }

        if (type === 'revocation') {
            // do something with the revocation (resubscribe, remove data, etc.)
            return ctx.newResponse(null, { status: 204 });
        }

        // do something with the notification, you can use waitUntil to not block the response for a longer time
        // ctx.executionCtx.waitUntil(handleEventSubNotification(ctx.req.json());
        // eslint-disable-next-line no-console
        console.log(await ctx.req.json());

        return ctx.newResponse(null, { status: 204 });
    },
);

import type { MiddlewareHandler } from 'hono';
import superjson from 'superjson';
import { z } from 'zod';

import type { Environment } from '../env';
import { zfetch } from '../utils/zfetch';

interface AppTokenData {
    token: string;
    expiresAt: Date;
}

/** Service to create and refresh app tokens */
export class AppTokenService {
    kv: KVNamespace;
    secret: string;
    clientId: string;

    constructor({ kv, secret, clientId }: { kv: KVNamespace; secret: string; clientId: string }) {
        this.kv = kv;
        this.secret = secret;
        this.clientId = clientId;
    }

    key(): string {
        return 'app-token';
    }

    async get(): Promise<string> {
        const existing = await this.kv.get<AppTokenData>(this.key(), 'json');
        if (existing && existing.expiresAt > new Date()) {
            return existing.token;
        }

        const { body } = await zfetch({
            url: 'https://id.twitch.tv/oauth2/token',
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: [
                `client_id=${this.clientId}`,
                `client_secret=${this.secret}`,
                'grant_type=client_credentials',
            ].join('&'),
            schema: z.object({
                access_token: z.string(),
                expires_in: z.number(),
            }),
        });

        const expiresAt = new Date(Date.now() + body.expires_in * 1000);

        await this.kv.put(
            this.key(),
            superjson.stringify({
                token: body.access_token,
                expiresAt,
            }),
        );

        return body.access_token;
    }
}

let cachedTokenService: AppTokenService | null = null;

export const withAppToken: MiddlewareHandler<{
    Bindings: Environment;
    Variables: { getAppToken: () => Promise<string> };
}> = (ctx, next) => {
    if (!cachedTokenService) {
        cachedTokenService = new AppTokenService({
            kv: ctx.env.KV,
            secret: ctx.env.TWITCH_CLIENT_SECRET,
            clientId: ctx.env.TWITCH_CLIENT_ID,
        });
    }
    ctx.set('getAppToken', cachedTokenService.get.bind(cachedTokenService));
    return next();
};

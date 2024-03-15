import type { MiddlewareHandler } from 'hono';

/**
 * Service to verify and consume auth state to prevent CSRF attacks
 * @see [link](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow)
 */
export class StateService {
    kv: KVNamespace;

    constructor(kv: KVNamespace) {
        this.kv = kv;
    }

    key(state: string): string {
        return `states:${state}`;
    }

    /**
     * Consume a state
     * @param state The state to consume
     * @returns `true` if the key was consumed, `false` if the key was not found
     */
    async consume(state: string): Promise<boolean> {
        const value = await this.kv.get(this.key(state));
        if (value === null) return false;
        await this.kv.delete(this.key(state));
        return true;
    }

    async create(): Promise<string> {
        const random = Math.random().toString(36).slice(7);
        await this.kv.put(this.key(random), '1', { expirationTtl: 120 });
        return random;
    }
}

let cachedStateService: StateService | null = null;

export const withStateService: MiddlewareHandler<{
    Bindings: { KV: KVNamespace };
    Variables: { states: StateService };
}> = (ctx, next) => {
    if (!cachedStateService) cachedStateService = new StateService(ctx.env.KV);
    ctx.set('states', cachedStateService);
    return next();
};

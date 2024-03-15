// eslint-disable-next-line ts/consistent-type-definitions
export type Environment = {
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    KV: KVNamespace;
    DB: D1Database;
};

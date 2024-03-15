import type { MiddlewareHandler } from 'hono';
import superjson from 'superjson';

import type { Environment } from '../env';

export interface User {
    login: string;
    id: string;
    scopes: string[];
    refreshToken: string;
    accessToken: string;
    expiresAt: Date;
    updatedAt: Date;
}

export class UsersService {
    kv: KVNamespace;

    constructor(kv: KVNamespace) {
        this.kv = kv;
    }

    key(id: string): string {
        return `users:${id}`;
    }

    async get(userId: string): Promise<User | null> {
        const user = await this.kv.get(this.key(userId));
        if (!user) return null;
        return superjson.parse(user);
    }

    async put(user: User): Promise<void> {
        await this.kv.put(this.key(user.id), superjson.stringify(user));
    }

    async update(user: Partial<User> & Pick<User, 'id'>) {
        const existing = await this.get(user.id);
        if (!existing) throw new Error('User not found');
        await this.put({ ...existing, ...user });
    }
}

let cachedUsersService: UsersService | null = null;

export const withUsersService: MiddlewareHandler<{
    Bindings: Environment;
    Variables: { users: UsersService };
}> = (ctx, next) => {
    if (!cachedUsersService) cachedUsersService = new UsersService(ctx.env.KV);
    ctx.set('users', cachedUsersService);
    return next();
};

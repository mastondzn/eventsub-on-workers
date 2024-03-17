import { Hono } from 'hono';
import type { OnHandlerInterface } from 'hono/types';

import type { Environment } from '../env';

export const createRoute: OnHandlerInterface<{ Bindings: Environment }> = (
    ...args: Parameters<OnHandlerInterface<{ Bindings: Environment }>>
) => {
    return new Hono<{ Bindings: Environment }>().on(...args);
};

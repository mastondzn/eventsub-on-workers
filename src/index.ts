import { Hono } from 'hono';

import type { Environment } from './env';

const app = new Hono<{ Bindings: Environment }>();

export default app;

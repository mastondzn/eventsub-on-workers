import { Hono } from 'hono';
import { logger } from 'hono/logger';

import type { Environment } from './env';
import { acknowledgeRoute } from './routes/acknowledge';
import { loginRoute } from './routes/login';

const app = new Hono<{ Bindings: Environment }>()
    .use(logger())
    .route('/', loginRoute)
    .route('/', acknowledgeRoute);

export default app;

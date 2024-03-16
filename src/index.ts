import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Environment } from './env';
import { acknowledgeRoute } from './routes/acknowledge';
import { eventSubRoute } from './routes/eventsub';
import { loginRoute } from './routes/login';
import { subscribeRoute } from './routes/subscribe';

const app = new Hono<{ Bindings: Environment }>()
    .route('/', loginRoute)
    .route('/', acknowledgeRoute)
    .route('/', eventSubRoute)
    .route('/', subscribeRoute)
    .get('/', (ctx) => ctx.json({ message: 'Hello from Workers!' }));

app.onError((error, ctx) => {
    if (error instanceof HTTPException) return error.getResponse();
    console.error(error);
    return ctx.json({ error: 'Internal Server Error' }, { status: 500 });
});

export default app;

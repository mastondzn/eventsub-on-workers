import type { z } from 'zod';

// tiny wrapper around fetch that uses zod to validate the response

type BaseOptions = Omit<RequestInit, 'body'> & {
    url: string | URL;
    body?: unknown;
    throwHttpErrors?: boolean;
};

export async function jfetch({ url, throwHttpErrors, body, ...rest }: BaseOptions): Promise<{
    response: Response;
    body: unknown;
}> {
    const response = await fetch(url, {
        ...rest,
        body: typeof body === 'string' ? body : JSON.stringify(body),
    });

    if (throwHttpErrors && !response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    return {
        response,
        body: json,
    };
}

export async function zfetch<TSchema extends z.ZodType>(
    options: BaseOptions & { schema: TSchema },
): Promise<{
    response: Response;
    body: z.infer<TSchema>;
}> {
    const { response, body } = await jfetch(options);

    return {
        response,
        body: options.schema.parse(body) as z.infer<TSchema>,
    };
}

export type AsyncMethod<I, R> = (...args: I[]) => Promise<R | null>;

export type Decorator = <I, R>(originalMethod: AsyncMethod<I, R>) => AsyncMethod<I, R>;

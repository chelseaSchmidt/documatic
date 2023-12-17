import { drive_v3 } from 'googleapis';

export type Nullable<T> = T | undefined | null;

export type StringDictionary = { [key: string]: string };

export type AsyncMethod<I, R> = (...args: I[]) => Promise<R | null>;

export type Decorator = <I, R>(originalMethod: AsyncMethod<I, R>) => AsyncMethod<I, R>;

export type File = { metadata: drive_v3.Schema$File; placeholders: string[] };

export type FileResponse = { data: File };

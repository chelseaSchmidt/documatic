import { docs_v1, drive_v3 } from 'googleapis';

export type Nullable<T> = T | undefined | null;

export type StringDictionary = { [key: string]: string };

export type AsyncMethod<I, R> = (...args: I[]) => Promise<R | null>;

export type Decorator = <I, R>(originalMethod: AsyncMethod<I, R>) => AsyncMethod<I, R>;

export type Row = { placeholders: string[]; metadata: docs_v1.Schema$TableRow };

export type Table = Nullable<{ rows: Row[] }>;

export type File = { metadata: drive_v3.Schema$File; placeholders: string[]; tables: Table[] };

export type FileResponse = { data: File };

export type RowReplacements = {
  metadata: docs_v1.Schema$TableRow;
  textReplacements: StringDictionary;
};

export type TableReplacement = Nullable<{ rows: RowReplacements[] }>;

export type FileCreationFormValues = {
  [key: string]: string | TableReplacement[];
};

type AwaitedReturn<T extends (...args: any) => Promise<any>> = Awaited<ReturnType<T>>;
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type PageParams<K extends Record<string, string>, S extends Record<string, string> = {}> = {
    params: K,
    searchParams: S
}
export {};

declare global {
    interface String {
        toLowerCase<T extends string>(this: T): Lowercase<T>;
    }
}

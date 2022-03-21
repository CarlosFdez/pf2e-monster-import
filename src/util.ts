type Abstract<T> = Function & { prototype: T };
type Constructor<T> = new (...args: unknown[]) => T;
type Class<T> = Abstract<T> | Constructor<T>;
type UnknownFunction = (...args: unknown[]) => unknown;

/** Does what libwrapper does. Monkeypatches an existing object. But without any of the mangling. */
export function replaceMethod<T, K extends keyof T>(
    object: Class<T>,
    name: K,
    impl: (
        this: T,
        original: T[K],
        ...args: T[K] extends UnknownFunction ? Parameters<T[K]> : never
    ) => T[K] extends UnknownFunction ? ReturnType<T[K]> : never,
) {
    if (!object)
        throw new Error(
            `PF2E Action Tracking | Attempted to override property ${name} for an object that does not exist`,
        );
    const original = object.prototype[name];
    object.prototype[name] = function (...args) {
        return impl.apply(this, [original, ...args]);
    };
}

/**
 * Check if a key is present in a given object in a type safe way
 *
 * @param obj The object to check
 * @param key The key to check
 */
export function objectHasKey<O extends object>(obj: O, key: unknown): key is keyof O {
    return (typeof key === "string" || typeof key === "number") && key in obj;
}

/**
 * Check if a value is present in the provided array. Especially useful for checking against literal tuples
 */
export function tupleHasValue<A extends readonly unknown[]>(array: A, value: unknown): value is A[number] {
    return array.includes(value);
}

export function sluggify(name: string) {
    return name
        .replace(/([a-z])([A-Z])\B/g, "$1-$2")
        .toLowerCase()
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/gi, " ")
        .trim()
        .replace(/[-\s]+/g, "-");
}

export function capitalizeWords(string: string): string {
    return string
        .split(" ")
        .map((word) => {
            // capitalize name
            word = word.toLowerCase();
            word = word.charAt(0).toUpperCase() + word.slice(1);
            return word;
        })
        .join(" ")
        .trim();
}

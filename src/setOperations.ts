/**
 * Adds all elements from the given iterable to the given set.
 * @param set
 * @param elements
 */
export function addAllFrom<T>(set: Set<T>, elements: Iterable<T>) {
    for (const element of elements) {
        set.add(element);
    }
}

/**
 * Tests whether the two given sets are equal.
 * @param set1
 * @param set2
 */
export function sameSet<T>(set1: Set<T>, set2: Set<T>) {
    return (
        set1.size === set2.size && [...set1].every((value) => set2.has(value))
    );
}

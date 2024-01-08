import { sameSet } from "../src/setOperations";

export function sameFunctionMap<K, V>(
    map1: Map<K, Set<V>>,
    map2: Map<K, Set<V>>,
) {
    return (
        map1.size === map2.size &&
        [...map1].every(([key, value]) => {
            const otherValue = map2.get(key)!;
            return otherValue !== undefined && sameSet(value, otherValue);
        })
    );
}

export function same2DFunctionMap<K1, K2, V>(
    map1: Map<K1, Map<K2, Set<V>>>,
    map2: Map<K1, Map<K2, Set<V>>>,
) {
    return (
        map1.size === map2.size &&
        [...map1].every(([key, value]) => {
            const otherValue = map2.get(key)!;
            return (
                otherValue !== undefined && sameFunctionMap(value, otherValue)
            );
        })
    );
}

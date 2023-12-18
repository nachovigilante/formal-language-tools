import { EOF, EPSILON, firstSymbols, firstsOf, followSymbols } from "../src";

const sameSet = <T>(set1: Set<T>, set2: Set<T>) => {
    return (
        set1.size === set2.size && [...set1].every((value) => set2.has(value))
    );
};

describe("FIRST function tests", () => {
    it("should compute the FIRST for a basic grammar", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "B", body: ["b"] },
            ],
            startSymbol: "S",
        };

        const expectedMap = new Map([
            ["S", new Set(["a", "b"])],
            ["A", new Set(["a"])],
            ["B", new Set(["b"])],
            ["a", new Set(["a"])],
            ["b", new Set(["b"])],
        ]);

        firstSymbols(grammar).forEach((firstSet, symbol) => {
            expect(expectedMap.has(symbol)).toBe(true);

            const expectedSet = expectedMap.get(symbol)!;
            expect(sameSet(firstSet, expectedSet)).toBe(true);
        });
    });

    it("should compute the FIRST for a basic grammar with epsilon productions", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            startSymbol: "S",
        };

        const expectedMap = new Map([
            ["S", new Set(["a", "b", EPSILON])],
            ["A", new Set(["a", EPSILON])],
            ["B", new Set(["b"])],
            ["a", new Set(["a"])],
            ["b", new Set(["b"])],
        ]);

        firstSymbols(grammar).forEach((firstSet, symbol) => {
            expect(expectedMap.has(symbol)).toBe(true);

            const expectedSet = expectedMap.get(symbol)!;
            expect(sameSet(firstSet, expectedSet)).toBe(true);
        });
    });

    it("should compute the FIRST for a grammar with epsilon productions and cycles", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["A", "a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b", "B"] },
                { head: "B", body: [EPSILON] },
            ],
            startSymbol: "S",
        };

        const expectedMap = new Map([
            ["S", new Set(["a", "b", EPSILON])],
            ["A", new Set(["a", EPSILON])],
            ["B", new Set(["b", EPSILON])],
            ["a", new Set(["a"])],
            ["b", new Set(["b"])],
        ]);

        firstSymbols(grammar).forEach((firstSet, symbol) => {
            expect(expectedMap.has(symbol)).toBe(true);

            const expectedSet = expectedMap.get(symbol)!;
            expect(sameSet(firstSet, expectedSet)).toBe(true);
        });
    });
});

describe("firstOf function tests", () => {
    it("should compute the FIRST symbols of a string of terminal symbols", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            startSymbol: "S",
        };

        const firstMap = firstSymbols(grammar);

        const expectedSet = new Set(["a"]);
        expect(sameSet(firstsOf(firstMap, ["a", "b", "a"]), expectedSet)).toBe(
            true,
        );
    });

    it("should compute the FIRST symbols of a string of non-terminal symbols", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            startSymbol: "S",
        };

        const firstMap = firstSymbols(grammar);

        const expectedSet = new Set(["a", "b"]);
        expect(sameSet(firstsOf(firstMap, ["A", "B"]), expectedSet)).toBe(true);
    });

    it("should compute the FIRST symbols of the empty string", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            startSymbol: "S",
        };

        const firstMap = firstSymbols(grammar);

        const expectedSet = new Set([EPSILON]);
        expect(sameSet(firstsOf(firstMap, []), expectedSet)).toBe(true);
    });
});

describe("FOLLOW function tests", () => {
    it("should compute the FOLLOW for a basic grammar", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["a"] },
                { head: "B", body: ["b"] },
            ],
            startSymbol: "S",
        };

        const firstMap = firstSymbols(grammar);

        const expectedMap = new Map([
            ["S", new Set([EOF])],
            ["A", new Set(["b"])],
            ["B", new Set([EOF])],
        ]);

        followSymbols(grammar, firstMap).forEach((followSet, symbol) => {
            expect(expectedMap.has(symbol)).toBe(true);

            const expectedSet = expectedMap.get(symbol)!;
            expect(sameSet(followSet, expectedSet)).toBe(true);
        });
    });

    it("should compute the FOLLOW for a grammar with epsilon productions", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["a"] },
                { head: "B", body: ["b"] },
                { head: "B", body: [EPSILON] },
            ],
            startSymbol: "S",
        };

        const firstMap = firstSymbols(grammar);

        const expectedMap = new Map([
            ["S", new Set([EOF])],
            ["A", new Set(["b", EOF])],
            ["B", new Set([EOF])],
        ]);

        followSymbols(grammar, firstMap).forEach((followSet, symbol) => {
            expect(expectedMap.has(symbol)).toBe(true);

            const expectedSet = expectedMap.get(symbol)!;
            expect(sameSet(followSet, expectedSet)).toBe(true);
        });
    });

    it("should compute the FOLLOW for a grammar with epsilon productions and cycles", () => {
        const grammar = {
            nonTerminals: new Set(["S", "A", "B"]),
            terminals: new Set(["a", "b"]),
            productions: [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["A", "a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b", "B"] },
                { head: "B", body: [EPSILON] },
            ],
            startSymbol: "S",
        };

        const firstMap = firstSymbols(grammar);

        const expectedMap = new Map([
            ["S", new Set([EOF])],
            ["A", new Set(["a", "b", EOF])],
            ["B", new Set([EOF])],
        ]);

        followSymbols(grammar, firstMap).forEach((followSet, symbol) => {
            expect(expectedMap.has(symbol)).toBe(true);

            const expectedSet = expectedMap.get(symbol)!;
            expect(sameSet(followSet, expectedSet)).toBe(true);
        });
    });
});

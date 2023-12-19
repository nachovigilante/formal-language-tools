import { EOF, EPSILON, CFG } from "../src/cfg";
import { computeGuidelineSymbols } from "../src/grammarProperties";
import { sameSet } from "../src/setOperations";

const sameFunctionMap = <K, V>(map1: Map<K, Set<V>>, map2: Map<K, Set<V>>) => {
    return (
        map1.size === map2.size &&
        [...map1].every(([key, value]) => {
            const otherValue = map2.get(key)!;
            return otherValue !== undefined && sameSet(value, otherValue);
        })
    );
};

describe("CFG validation tests", () => {
    it("should not allow terminals in production heads", () => {
        const terminals = new Set(["a", "b"]);
        const nonTerminals = new Set(["S"]);
        const productions = [
            { head: "S", body: ["a"] },
            { head: "a", body: ["b"] },
        ];
        expect(
            () => new CFG(nonTerminals, terminals, productions, "S"),
        ).toThrow();
    });

    it("should ensure all production body symbols are terminals or non-terminals", () => {
        const terminals = new Set(["a", "b"]);
        const nonTerminals = new Set(["S"]);
        const productions = [
            { head: "S", body: ["a", "b"] },
            { head: "S", body: ["b", "c"] },
        ];
        expect(
            () => new CFG(nonTerminals, terminals, productions, "S"),
        ).toThrow();
    });
});

describe("FIRST function tests", () => {
    it("should compute the FIRST function for a basic grammar", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "B", body: ["b"] },
            ],
            "S",
        );

        const expectedMap = new Map([
            ["S", new Set(["a", "b"])],
            ["A", new Set(["a"])],
            ["B", new Set(["b"])],
            ["a", new Set(["a"])],
            ["b", new Set(["b"])],
        ]);

        expect(sameFunctionMap(grammar.firstMap, expectedMap)).toBe(true);
    });

    it("should compute the FIRST function for a basic grammar with epsilon productions", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            "S",
        );

        const expectedMap = new Map([
            ["S", new Set(["a", "b", EPSILON])],
            ["A", new Set(["a", EPSILON])],
            ["B", new Set(["b"])],
            ["a", new Set(["a"])],
            ["b", new Set(["b"])],
        ]);

        expect(sameFunctionMap(grammar.firstMap, expectedMap)).toBe(true);
    });

    it("should compute the FIRST function for a grammar with epsilon productions and cycles", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["A", "a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b", "B"] },
                { head: "B", body: [EPSILON] },
            ],
            "S",
        );

        const expectedMap = new Map([
            ["S", new Set(["a", "b", EPSILON])],
            ["A", new Set(["a", EPSILON])],
            ["B", new Set(["b", EPSILON])],
            ["a", new Set(["a"])],
            ["b", new Set(["b"])],
        ]);

        expect(sameFunctionMap(grammar.firstMap, expectedMap)).toBe(true);
    });
});

describe("firstOf function tests", () => {
    it("should compute the FIRST symbols of a string of terminal symbols", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            "S",
        );

        const inputWord = ["a", "b", "a"];
        const expectedSet = new Set(["a"]);
        expect(sameSet(grammar.firstsOf(inputWord), expectedSet)).toBe(true);
    });

    it("should compute the FIRST symbols of a string of non-terminal symbols", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            "S",
        );

        const inputWord = ["A", "B"];
        const expectedSet = new Set(["a", "b"]);
        expect(sameSet(grammar.firstsOf(inputWord), expectedSet)).toBe(true);
    });

    it("should compute the FIRST symbols of the empty string", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A"] },
                { head: "S", body: ["B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            "S",
        );

        const inputWord: string[] = [];
        const expectedSet = new Set([EPSILON]);
        expect(sameSet(grammar.firstsOf(inputWord), expectedSet)).toBe(true);
    });
});

describe("FOLLOW function tests", () => {
    it("should compute the FOLLOW function for a basic grammar", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["a"] },
                { head: "B", body: ["b"] },
            ],
            "S",
        );

        const expectedMap = new Map([
            ["S", new Set([EOF])],
            ["A", new Set(["b"])],
            ["B", new Set([EOF])],
        ]);

        expect(sameFunctionMap(grammar.followMap, expectedMap)).toBe(true);
    });

    it("should compute the FOLLOW function for a grammar with epsilon productions", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["a"] },
                { head: "B", body: ["b"] },
                { head: "B", body: [EPSILON] },
            ],
            "S",
        );

        const expectedMap = new Map([
            ["S", new Set([EOF])],
            ["A", new Set(["b", EOF])],
            ["B", new Set([EOF])],
        ]);

        expect(sameFunctionMap(grammar.followMap, expectedMap)).toBe(true);
    });

    it("should compute the FOLLOW function for a grammar with epsilon productions and cycles", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b"]),
            [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["A", "a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b", "B"] },
                { head: "B", body: [EPSILON] },
            ],
            "S",
        );

        const expectedMap = new Map([
            ["S", new Set([EOF])],
            ["A", new Set(["a", "b", EOF])],
            ["B", new Set([EOF])],
        ]);

        expect(sameFunctionMap(grammar.followMap, expectedMap)).toBe(true);
    });
});

describe("Guideline Symbols function tests", () => {
    it("should compute the guideline symbols for a basic grammar", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b", "c"]),
            [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["a"] },
                { head: "B", body: ["b"] },
            ],
            "S",
        );

        const expectedMap = new Map([
            [grammar.productions[0], new Set(["a"])],
            [grammar.productions[1], new Set(["a"])],
            [grammar.productions[2], new Set(["b"])],
        ]);

        expect(
            sameFunctionMap(
                computeGuidelineSymbols(
                    grammar.firstMap,
                    grammar.followMap,
                    grammar.productions,
                ),
                expectedMap,
            ),
        ).toBe(true);
    });

    it("should compute the guideline symbols for a grammar with epsilon productions", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b", "c"]),
            [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b"] },
            ],
            "S",
        );

        const expectedMap = new Map([
            [grammar.productions[0], new Set(["a", "b"])],
            [grammar.productions[1], new Set(["a"])],
            [grammar.productions[2], new Set(["b"])],
            [grammar.productions[3], new Set(["b"])],
        ]);

        expect(
            sameFunctionMap(
                computeGuidelineSymbols(
                    grammar.firstMap,
                    grammar.followMap,
                    grammar.productions,
                ),
                expectedMap,
            ),
        ).toBe(true);
    });

    it("should compute the guideline symbols for a grammar with epsilon productions and cycles", () => {
        const grammar = new CFG(
            new Set(["S", "A", "B"]),
            new Set(["a", "b", "c"]),
            [
                { head: "S", body: ["A", "B"] },
                { head: "A", body: ["A", "a"] },
                { head: "A", body: [EPSILON] },
                { head: "B", body: ["b", "B"] },
                { head: "B", body: [EPSILON] },
            ],
            "S",
        );

        const expectedMap = new Map([
            [grammar.productions[0], new Set(["a", "b", "$"])],
            [grammar.productions[1], new Set(["a"])],
            [grammar.productions[2], new Set(["a", "b", "$"])],
            [grammar.productions[3], new Set(["b"])],
            [grammar.productions[4], new Set(["$"])],
        ]);

        console.log(
            computeGuidelineSymbols(
                grammar.firstMap,
                grammar.followMap,
                grammar.productions,
            ),
        );

        expect(
            sameFunctionMap(
                computeGuidelineSymbols(
                    grammar.firstMap,
                    grammar.followMap,
                    grammar.productions,
                ),
                expectedMap,
            ),
        ).toBe(true);
    });
});

import { EOF, EPSILON, CFG } from "../src/cfg";
import {
    computeGuidelineSymbols,
    computeLL1Table,
    isLL1,
} from "../src/grammarProperties";
import { LL1Parser } from "../src/parser";
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

const same2DFunctionMap = <K1, K2, V>(
    map1: Map<K1, Map<K2, Set<V>>>,
    map2: Map<K1, Map<K2, Set<V>>>,
) => {
    return (
        map1.size === map2.size &&
        [...map1].every(([key, value]) => {
            const otherValue = map2.get(key)!;
            return (
                otherValue !== undefined && sameFunctionMap(value, otherValue)
            );
        })
    );
};

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

        const parser = new LL1Parser(grammar);

        const expectedMap = new Map([
            [grammar.productions[0], new Set(["a"])],
            [grammar.productions[1], new Set(["a"])],
            [grammar.productions[2], new Set(["b"])],
        ]);

        expect(sameFunctionMap(parser.guidelineSymbols, expectedMap)).toBe(
            true,
        );
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

        const parser = new LL1Parser(grammar);

        const expectedMap = new Map([
            [grammar.productions[0], new Set(["a", "b"])],
            [grammar.productions[1], new Set(["a"])],
            [grammar.productions[2], new Set(["b"])],
            [grammar.productions[3], new Set(["b"])],
        ]);

        expect(sameFunctionMap(parser.guidelineSymbols, expectedMap)).toBe(
            true,
        );
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

        const parser = new LL1Parser(grammar);

        const expectedMap = new Map([
            [grammar.productions[0], new Set(["a", "b", "$"])],
            [grammar.productions[1], new Set(["a"])],
            [grammar.productions[2], new Set(["a", "b", "$"])],
            [grammar.productions[3], new Set(["b"])],
            [grammar.productions[4], new Set(["$"])],
        ]);

        expect(sameFunctionMap(parser.guidelineSymbols, expectedMap)).toBe(
            true,
        );
    });
});

describe("LL(1) table function tests", () => {
    it("should compute the LL(1) table for a basic grammar", () => {
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
            ["S", new Map([["a", new Set([grammar.productions[0]])]])],
            ["A", new Map([["a", new Set([grammar.productions[1]])]])],
            ["B", new Map([["b", new Set([grammar.productions[2]])]])],
        ]);

        expect(
            same2DFunctionMap(
                computeLL1Table(
                    grammar.nonTerminals,
                    computeGuidelineSymbols(
                        grammar.firstMap,
                        grammar.followMap,
                        grammar.productions,
                    ),
                    grammar.productions,
                ),
                expectedMap,
            ),
        ).toBe(true);

        expect(isLL1(grammar)).toBe(true);
    });

    it("should compute the LL(1) table for a grammar with epsilon productions", () => {
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
            [
                "S",
                new Map([
                    ["a", new Set([grammar.productions[0]])],
                    ["b", new Set([grammar.productions[0]])],
                ]),
            ],
            [
                "A",
                new Map([
                    ["a", new Set([grammar.productions[1]])],
                    ["b", new Set([grammar.productions[2]])],
                ]),
            ],
            ["B", new Map([["b", new Set([grammar.productions[3]])]])],
        ]);

        expect(
            same2DFunctionMap(
                computeLL1Table(
                    grammar.nonTerminals,
                    computeGuidelineSymbols(
                        grammar.firstMap,
                        grammar.followMap,
                        grammar.productions,
                    ),
                    grammar.productions,
                ),
                expectedMap,
            ),
        ).toBe(true);

        expect(isLL1(grammar)).toBe(true);
    });

    it("should compute the LL(1) table for a grammar with epsilon productions and cycles", () => {
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
            [
                "S",
                new Map([
                    ["a", new Set([grammar.productions[0]])],
                    ["b", new Set([grammar.productions[0]])],
                    ["$", new Set([grammar.productions[0]])],
                ]),
            ],
            [
                "A",
                new Map([
                    [
                        "a",
                        new Set([
                            grammar.productions[1],
                            grammar.productions[2],
                        ]),
                    ],
                    ["b", new Set([grammar.productions[2]])],
                    ["$", new Set([grammar.productions[2]])],
                ]),
            ],
            [
                "B",
                new Map([
                    ["b", new Set([grammar.productions[3]])],
                    ["$", new Set([grammar.productions[4]])],
                ]),
            ],
        ]);

        expect(
            same2DFunctionMap(
                computeLL1Table(
                    grammar.nonTerminals,
                    computeGuidelineSymbols(
                        grammar.firstMap,
                        grammar.followMap,
                        grammar.productions,
                    ),
                    grammar.productions,
                ),
                expectedMap,
            ),
        ).toBe(true);

        expect(isLL1(grammar)).toBe(false);
    });
});

describe("LL(1) parser tests", () => {
    it("should parse a basic grammar", () => {
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

        const parser = new LL1Parser(grammar);

        const inputWord = ["a", "b"];
        const expectedParseTree = {
            head: "S",
            children: [
                {
                    head: "A",
                    children: [
                        {
                            head: "a",
                            children: [],
                        },
                    ],
                },
                {
                    head: "B",
                    children: [
                        {
                            head: "b",
                            children: [],
                        },
                    ],
                },
            ],
        };

        expect(parser.parse(inputWord)).toEqual(expectedParseTree);

        const inputWord2 = ["a"];
        expect(() => parser.parse(inputWord2)).toThrow(
            "Expected b but got $ at position 1",
        );
    });
});

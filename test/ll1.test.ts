import { CFG } from "../src";
import {
    EPSILON,
    computeGuidelineSymbols,
    computeLL1Table,
    isLL1,
} from "../src/grammarProperties";
import { LL1Parser } from "../src/parser";
import { same2DFunctionMap } from "./testUtils";

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
            value: "S",
            children: [
                {
                    value: "A",
                    children: [
                        {
                            value: "a",
                            children: [],
                        },
                    ],
                },
                {
                    value: "B",
                    children: [
                        {
                            value: "b",
                            children: [],
                        },
                    ],
                },
            ],
        };

        expect(parser.parse(inputWord)).toEqual(expectedParseTree);

        const inputWord2 = ["a"];
        expect(() => parser.parse(inputWord2)).toThrow();
    });
});

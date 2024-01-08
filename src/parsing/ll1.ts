/**
 * An LL1 parser.
 */

import { Alphabet, CFG, GrammarSymbol, Production } from "../cfg";
import { computeGuidelineSymbols } from "../grammarProperties";
import { Parser, ParseTree } from "./parser";

/**
 * An LL(1) parser.
 * @param grammar The grammar of the parser.
 */
export class LL1Parser implements Parser {
    readonly grammar: CFG;
    readonly guidelineSymbols: Map<Production, Set<GrammarSymbol>>;
    readonly parseTable: Map<
        GrammarSymbol,
        Map<GrammarSymbol, Set<Production>>
    >;

    constructor(grammar: CFG) {
        this.grammar = grammar;
        this.guidelineSymbols = computeGuidelineSymbols(
            grammar.firstMap,
            grammar.followMap,
            grammar.productions,
        );
        this.parseTable = computeLL1Table(
            grammar.nonTerminals,
            this.guidelineSymbols,
            grammar.productions,
        );
    }

    // TODO: document
    parse(input: string[]): ParseTree {
        input.push("$");
        if (!isLL1(this.grammar)) throw new Error("Grammar is not LL(1).");

        const stack: GrammarSymbol[] = ["$", this.grammar.startSymbol];

        const derivation: Production[] = [];

        let i = 0;

        do {
            const symbol = stack.pop()!;
            const nextSymbol = input[0];

            console.log(symbol, nextSymbol);

            if (symbol === nextSymbol) {
                input = input.slice(1);
                continue;
            }

            if (this.grammar.terminals.has(symbol)) {
                throw new Error(
                    `Expected ${symbol} but got ${nextSymbol} at position ${i}`,
                );
            }

            const row = this.parseTable.get(symbol)!;
            const productions = row.get(nextSymbol);

            if (!productions) {
                throw new Error(`Unexpected ${nextSymbol} at position ${i}`);
            }

            const production = productions.values().next().value;

            derivation.push(production);

            stack.push(...production.body.reverse());
            ++i;
        } while (stack.length > 0);

        if (input.length > 0) {
            throw new Error(`Unexpected end of input at position ${i}`);
        }

        console.log(derivation);

        const parseTree = buildParseTree(derivation);

        return parseTree;
    }
}

// TODO: document
export function computeLL1Table(
    nonTerminals: Alphabet,
    guidelineSymbols: Map<Production, Set<GrammarSymbol>>,
    productions: Production[],
) {
    const table = new Map<GrammarSymbol, Map<GrammarSymbol, Set<Production>>>();

    for (const nt of nonTerminals) {
        table.set(nt, new Map());
    }

    for (const production of productions) {
        const { head } = production;

        const guidelineSet = guidelineSymbols.get(production)!;

        guidelineSet.forEach((symbol) => {
            const row = table.get(head)!;
            if (!row.has(symbol)) row.set(symbol, new Set());
            row.get(symbol)!.add(production);
        });
    }

    return table as Map<GrammarSymbol, Map<GrammarSymbol, Set<Production>>>;
}

// TODO: document
export function isLL1(grammar: CFG) {
    const table = computeLL1Table(
        grammar.nonTerminals,
        computeGuidelineSymbols(
            grammar.firstMap,
            grammar.followMap,
            grammar.productions,
        ),
        grammar.productions,
    );

    for (const row of table.values()) {
        for (const productions of row.values()) {
            if (productions.size > 1) return false;
        }
    }

    return true;
}

// TODO: Parse tree should be a class? Maybe?

// TODO: document
export function buildParseTree(derivation: Production[]) {
    const root = {
        value: derivation[0].head,
        children: [],
    } as ParseTree;
    const leaves = [root];

    for (const production of derivation) {
        const { head, body } = production;
        // Add each symbol in the body as a child of the head.
        // To find the head in the tree, we keep the leaf nodes
        const headIndex = leaves.findIndex((leaf) => leaf.value === head);
        const headNode = leaves[headIndex];
        leaves.splice(headIndex, 1);

        const bodyNodes = body
            .map(
                (symbol) =>
                    ({
                        value: symbol,
                        children: [],
                    }) as ParseTree,
            )
            .reverse();

        headNode.children.push(...bodyNodes);
        leaves.push(...bodyNodes);
    }

    return root;
}

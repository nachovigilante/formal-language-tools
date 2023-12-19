/**
 * A parser.
 */

import { CFG, GrammarSymbol, Production } from "./cfg";
import {
    buildParseTree,
    computeGuidelineSymbols,
    computeLL1Table,
    isLL1,
} from "./grammarProperties";

/**
 * A parse tree.
 */
export type ParseTree = {
    /**
     * The root of the tree.
     */
    root: string;
    /**
     * The children of the tree.
     */
    children: ParseTree[];
};

interface Parser {
    /**
     * The grammar of the parser.
     */
    grammar: CFG;
    /**
     * The parse function that takes a string and returns a parse tree.
     */
    parse(input: string[]): ParseTree;
}

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

        // const parseTree = buildParseTree(derivation);

        // return parseTree;
        throw new Error("Not implemented.");
    }
}

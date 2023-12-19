import {
    EPSILON,
    EOF,
    computeFirstMap,
    computeFollowMap,
    firstsOf,
} from "./grammarProperties";

export { EPSILON, EOF };

/**
 * A grammar symbol.
 */
export type GrammarSymbol = string;

/**
 * A collection of grammar symbols.
 */
export type Alphabet = Set<GrammarSymbol>;

/**
 * A production.
 */
export type Production = {
    /**
     * The head/left hand side of the production.
     */
    head: GrammarSymbol;
    /**
     * The body/right hand side of the production.
     */
    body: GrammarSymbol[];
};

/**
 * Ensure that the productions are valid.
 *
 * Productions are valid if:
 * - The head of each production is a non-terminal.
 * - The body of each production is a sequence of terminals, non-terminals, or epsilon.
 * @param terminals
 * @param nonTerminals
 * @param productions
 */
function validateProductions(
    terminals: Alphabet,
    nonTerminals: Alphabet,
    productions: Production[],
) {
    for (const production of productions) {
        if (!nonTerminals.has(production.head)) {
            throw new Error(
                `Production head ${production.head} is not a non-terminal`,
            );
        }
        for (const symbol of production.body) {
            if (
                !(
                    symbol === EPSILON ||
                    terminals.has(symbol) ||
                    nonTerminals.has(symbol)
                )
            ) {
                throw new Error(
                    `Production body symbol ${symbol} is not a terminal or non-terminal`,
                );
            }
        }
    }
}

/**
 * A context free grammar.
 * @param productions The productions of the grammar.
 * @param startSymbol The start symbol of the grammar.
 * @param terminalSymbols The terminal symbols of the grammar.
 * @param nonTerminalSymbols The non-terminal symbols of the grammar.
 */
export class CFG {
    readonly productions: Production[];
    readonly startSymbol: GrammarSymbol;
    readonly terminals: Alphabet;
    readonly nonTerminals: Alphabet;

    readonly firstMap: Map<GrammarSymbol, Set<GrammarSymbol>>;
    readonly followMap: Map<GrammarSymbol, Set<GrammarSymbol>>;

    constructor(
        nonTerminalSymbols: Set<GrammarSymbol>,
        terminalSymbols: Set<GrammarSymbol>,
        productions: Production[],
        startSymbol: GrammarSymbol,
    ) {
        this.nonTerminals = nonTerminalSymbols;
        this.terminals = terminalSymbols;
        this.productions = productions;
        this.startSymbol = startSymbol;

        validateProductions(this.terminals, this.nonTerminals, productions);

        this.firstMap = computeFirstMap(
            this.terminals,
            this.nonTerminals,
            this.productions,
        );
        this.followMap = computeFollowMap(
            this.nonTerminals,
            this.productions,
            this.startSymbol,
            this.firstMap,
        );
    }

    firstsOf(symbols: GrammarSymbol[]) {
        return firstsOf(this.firstMap, symbols);
    }
}

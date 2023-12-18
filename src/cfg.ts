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

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
 */
export type CFG = {
    /**
     * The set of non-terminal symbols.
     */
    nonTerminals: Alphabet;
    /**
     * The set of terminal symbols.
     */
    terminals: Alphabet;
    /**
     * The set of productions.
     */
    productions: Production[];
    /**
     * The start symbol. Must be part of the set of non-terminal symbols.
     */
    startSymbol: GrammarSymbol;
};

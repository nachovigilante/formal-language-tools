import { addAllFrom } from "./setOperations";

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

export const EPSILON = "ε";
export const EOF = "$";

const hasEpsilonBody = ({ body }: Production) =>
    body.length === 1 && body[0] === EPSILON;

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

        this.firstMap = this.computeFirstMap();
        this.followMap = this.computeFollowMap();
    }

    private computeFirstMap() {
        const firstMap = new Map<GrammarSymbol, Set<GrammarSymbol>>();

        // first(X) = {X} if X is a terminal
        for (const terminal of this.terminals) {
            firstMap.set(terminal, new Set([terminal]));
        }

        // Now, we need to find first(X) for all non-terminals X.

        // Initially, first(X) = {} for all non-terminals
        for (const nonTerminal of this.nonTerminals) {
            firstMap.set(nonTerminal, new Set());
        }

        for (const { head } of this.productions.filter(hasEpsilonBody)) {
            firstMap.get(head)!.add(EPSILON);
        }

        // We iterate over the productions until we have no more changes.
        let changed: boolean;
        do {
            changed = false;

            for (const production of this.productions.filter(
                (p) => !hasEpsilonBody(p),
            )) {
                const { head, body } = production;

                let i: number;
                for (i = 0; i < body.length; ++i) {
                    const firstSet = firstMap.get(head)!;
                    const oldSize = firstSet.size;

                    const firstOfBody = firstMap.get(body[i])!;
                    addAllFrom(firstSet, firstOfBody);

                    changed ||= oldSize !== firstSet.size;

                    if (!firstOfBody.has(EPSILON)) break;
                }

                if (i === body.length) firstMap.get(head)!.add(EPSILON);
            }
        } while (changed);

        return firstMap;
    }

    private computeFollowMap() {
        const followMap = new Map<GrammarSymbol, Set<GrammarSymbol>>();

        // follow(S) = {$}
        followMap.set(this.startSymbol, new Set([EOF]));

        // follow(X) = {} for all non-terminals X != S
        for (const nonTerminal of this.nonTerminals) {
            if (nonTerminal !== this.startSymbol) {
                followMap.set(nonTerminal, new Set());
            }
        }

        // We iterate over the productions until we have no more changes.
        let changed: boolean;
        do {
            changed = false;
            for (const production of this.productions) {
                const { head, body } = production;

                if (hasEpsilonBody(production)) {
                    const followOfHead = followMap.get(head)!;

                    const followSet = followMap.get(head)!;
                    const oldSize = followSet.size;

                    followSet.forEach((symbol) => followOfHead.add(symbol));

                    changed ||= oldSize !== followSet.size;
                } else {
                    body.forEach((bodySymbol, i) => {
                        if (this.nonTerminals.has(bodySymbol)) {
                            const followSet = followMap.get(bodySymbol)!;
                            const oldSize = followSet.size;

                            const nextSymbols = body.slice(i + 1);
                            const nextFirsts = this.firstsOf(nextSymbols);
                            nextFirsts.forEach(
                                (symbol) =>
                                    symbol !== EPSILON && followSet.add(symbol),
                            );

                            if (nextFirsts.has(EPSILON)) {
                                followSet.delete(EPSILON);
                                const followOfHead = followMap.get(head)!;
                                addAllFrom(followSet, followOfHead);
                            }

                            changed ||= oldSize !== followSet.size;
                        }
                    });
                }
            }
        } while (changed);

        return followMap;
    }

    firstsOf(symbols: GrammarSymbol[]) {
        const firsts = new Set<GrammarSymbol>();

        let i = 0;
        for (; i < symbols.length; ++i) {
            const firstSet = this.firstMap.get(symbols[i])!;
            firstSet.forEach(
                (symbol) => symbol !== EPSILON && firsts.add(symbol),
            );
            if (!firstSet.has(EPSILON)) break;
        }

        if (i === symbols.length) {
            firsts.add(EPSILON);
        }

        return firsts;
    }
}

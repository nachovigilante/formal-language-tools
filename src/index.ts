import { CFG, GrammarSymbol, Production } from "./types";

export const EPSILON = "ε";
export const EOF = "$";

const hasEpsilonBody = ({ body }: Production) =>
    body.length === 1 && body[0] === EPSILON;

/**
 * Computes a map representing the FIRST function.
 * @param cfg The context free grammar.
 * @returns A map from non-terminals to the set of terminals that begin the strings derived from them.
 */
export const firstSymbols = ({ terminals, nonTerminals, productions }: CFG) => {
    const firstMap = new Map<GrammarSymbol, Set<GrammarSymbol>>();

    // first(X) = {X} if X is a terminal
    for (const terminal of terminals) {
        firstMap.set(terminal, new Set([terminal]));
    }

    // Now, we need to find first(X) for all non-terminals X.

    // first(X) = {} for all non-terminals
    for (const nonTerminal of nonTerminals) {
        firstMap.set(nonTerminal, new Set());
    }

    for (const { head } of productions.filter(hasEpsilonBody)) {
        firstMap.get(head)!.add(EPSILON);
    }

    // We iterate over the productions until we have no more changes.
    let changed: boolean;
    do {
        changed = false;

        for (const production of productions.filter(
            (p) => !hasEpsilonBody(p),
        )) {
            const { head, body } = production;

            let i: number;
            for (i = 0; i < body.length; ++i) {
                const firstSet = firstMap.get(head)!;
                const oldSize = firstSet.size;

                const firstOfBody = firstMap.get(body[i])!;
                firstOfBody.forEach((symbol) => firstSet.add(symbol));

                changed ||= oldSize !== firstSet.size;

                if (!firstOfBody.has(EPSILON)) break;
            }

            if (i === body.length) {
                firstMap.get(head)!.add(EPSILON);
            }
        }
    } while (changed);

    return firstMap;
};

/**
 * Computes the FIRST function for a string of grammar symbols.
 * @param firstMap The map representing the FIRST function for non-terminals.
 * @param symbols The string of grammar symbols.
 */
export const firstsOf = (
    firstMap: Map<GrammarSymbol, Set<GrammarSymbol>>,
    symbols: GrammarSymbol[],
) => {
    const firsts = new Set<GrammarSymbol>();

    let i = 0;
    for (; i < symbols.length; ++i) {
        const firstSet = firstMap.get(symbols[i])!;
        firstSet.forEach((symbol) => symbol !== EPSILON && firsts.add(symbol));
        if (!firstSet.has(EPSILON)) break;
    }

    if (i === symbols.length) {
        firsts.add(EPSILON);
    }

    return firsts;
};

/**
 * Computes a map representing the FOLLOW function.
 * @param cfg The context free grammar.
 * @param followMap The map representing the FOLLOW function.
 */
export const followSymbols = (
    { nonTerminals, productions, startSymbol }: CFG,
    firstMap: Map<GrammarSymbol, Set<GrammarSymbol>>,
) => {
    const followMap = new Map<GrammarSymbol, Set<GrammarSymbol>>();

    // follow(S) = {$}
    followMap.set(startSymbol, new Set([EOF]));

    // follow(X) = {} for all non-terminals X != S
    for (const nonTerminal of nonTerminals) {
        if (nonTerminal !== startSymbol) {
            followMap.set(nonTerminal, new Set());
        }
    }

    // We iterate over the productions until we have no more changes.
    let changed: boolean;
    do {
        changed = false;
        for (const production of productions) {
            const { head, body } = production;

            if (hasEpsilonBody(production)) {
                const followOfHead = followMap.get(head)!;

                const followSet = followMap.get(head)!;
                const oldSize = followSet.size;

                followSet.forEach((symbol) => followOfHead.add(symbol));

                changed ||= oldSize !== followSet.size;
            } else {
                body.forEach((bodySymbol, i) => {
                    if (nonTerminals.has(bodySymbol)) {
                        const followSet = followMap.get(bodySymbol)!;
                        const oldSize = followSet.size;

                        const nextSymbols = body.slice(i + 1);
                        const nextFirsts = firstsOf(firstMap, nextSymbols);
                        nextFirsts.forEach(
                            (symbol) =>
                                symbol !== EPSILON && followSet.add(symbol),
                        );

                        if (nextFirsts.has(EPSILON)) {
                            followSet.delete(EPSILON);
                            const followOfHead = followMap.get(head)!;
                            followOfHead.forEach((symbol) =>
                                followSet.add(symbol),
                            );
                        }

                        changed ||= oldSize !== followSet.size;
                    }
                });
            }
        }
    } while (changed);

    return followMap;
};

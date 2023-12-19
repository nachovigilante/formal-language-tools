import type { Alphabet, GrammarSymbol, Production } from "./cfg";
import { addAllFrom } from "./setOperations";

export const EPSILON = "ε";
export const EOF = "$";

const hasEpsilonBody = ({ body }: Production) =>
    body.length === 1 && body[0] === EPSILON;

export function computeFirstMap(
    terminals: Alphabet,
    nonTerminals: Alphabet,
    productions: Production[],
) {
    const firstMap = new Map<GrammarSymbol, Set<GrammarSymbol>>();

    // first(X) = {X} if X is a terminal
    for (const terminal of terminals) {
        firstMap.set(terminal, new Set([terminal]));
    }

    // Now, we need to find first(X) for all non-terminals X.

    // Initially, first(X) = {} for all non-terminals
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
                addAllFrom(firstSet, firstOfBody);

                changed ||= oldSize !== firstSet.size;

                if (!firstOfBody.has(EPSILON)) break;
            }

            if (i === body.length) firstMap.get(head)!.add(EPSILON);
        }
    } while (changed);

    return firstMap;
}

export function computeFollowMap(
    nonTerminals: Alphabet,
    productions: Production[],
    startSymbol: GrammarSymbol,
    firstMap: Map<GrammarSymbol, Set<GrammarSymbol>>,
) {
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

export function firstsOf(
    firstMap: Map<GrammarSymbol, Set<GrammarSymbol>>,
    symbols: GrammarSymbol[],
) {
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
}

export function computeGuidelineSymbols(
    firstMap: Map<GrammarSymbol, Set<GrammarSymbol>>,
    followMap: Map<GrammarSymbol, Set<GrammarSymbol>>,
    productions: Production[],
) {
    const guidelineSymbols = new Map<Production, Set<GrammarSymbol>>();

    for (const production of productions) {
        const { head, body } = production;

        let firsts: Set<GrammarSymbol>;

        if (body.length === 1 && body[0] === EPSILON)
            firsts = new Set([EPSILON]);
        else firsts = firstsOf(firstMap, body);

        const follows = followMap.get(head)!;

        if (firsts.has(EPSILON)) {
            firsts.delete(EPSILON);
            addAllFrom(firsts, follows);
        }

        guidelineSymbols.set(production, firsts);
    }

    return guidelineSymbols;
}

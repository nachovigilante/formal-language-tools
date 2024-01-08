/**
 * General parser interface and types.
 */

import { CFG } from "../cfg";

/**
 * A parse tree.
 */
export type ParseTree = {
    /**
     * The value of the tree node.
     */
    value: string;
    /**
     * The children of the tree.
     */
    children: ParseTree[];
};

/**
 * A parser.
 */
export interface Parser {
    /**
     * The grammar of the parser.
     */
    grammar: CFG;
    /**
     * The parse function that takes a string and returns a parse tree.
     */
    parse(input: string[]): ParseTree;
}

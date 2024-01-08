import { EOF } from "dns";
import { CFG, EPSILON } from "../src/cfg";

describe("CFG validation tests", () => {
    it("should not allow reserved symbols in terminals/non-terminals", () => {
        const terminals = new Set(["a", "b", EPSILON, EOF]);
        const nonTerminals = new Set(["S", "A", "B", EPSILON, EOF]);

        expect(() => new CFG(nonTerminals, terminals, [], "S")).toThrow();
    });

    it("should not allow overlap between terminals and non-terminals", () => {
        const terminals = new Set(["a", "b"]);
        const nonTerminals = new Set(["S", "A", "B", "a"]);
        expect(() => new CFG(nonTerminals, terminals, [], "S")).toThrow();
    });

    it("should not allow terminals in production heads", () => {
        const terminals = new Set(["a", "b"]);
        const nonTerminals = new Set(["S"]);
        const productions = [
            { head: "S", body: ["a"] },
            { head: "a", body: ["b"] },
        ];
        expect(
            () => new CFG(nonTerminals, terminals, productions, "S"),
        ).toThrow();
    });

    it("should ensure all production body symbols are terminals or non-terminals", () => {
        const terminals = new Set(["a", "b"]);
        const nonTerminals = new Set(["S"]);
        const productions = [
            { head: "S", body: ["a", "b"] },
            { head: "S", body: ["b", "c"] },
        ];
        expect(
            () => new CFG(nonTerminals, terminals, productions, "S"),
        ).toThrow();
    });
});

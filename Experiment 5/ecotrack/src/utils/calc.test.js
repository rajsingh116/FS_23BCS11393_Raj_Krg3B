import { add } from "./calc";

test("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
});
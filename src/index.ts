import {Agent} from "./agent";

(async () => {
    const agent = new Agent();
    const input = "What did I say about LLMs earlier?";
    const response = await agent.addMessage(input);
    console.log(response);
})();

export const foo = "bar";
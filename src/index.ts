import {SimpleAgent} from "./agents/SimpleAgent";

(async () => {
    const agent = new SimpleAgent();
    const input = "What did I say about LLMs earlier?";
    const response = await agent.addMessage(input);
    console.log(response);
})();

export const foo = "bar";
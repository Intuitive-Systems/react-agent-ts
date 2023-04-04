import {ReactAgent} from "./agents/ReactAgent";

(async () => {
    const agent = new ReactAgent();
    const input = "What did I say about LLMs earlier?";
    const response = await agent.addMessage(input);
    console.log(response);
})();

export const foo = "bar";
import {Agent} from "./agent";


(async () => {
    const agent = new Agent();
    const input = "Who plays Day, the emperor on Foundation?";
    const response = await agent.addMessage(input);
    console.log(response);
})();

export const foo = "bar";
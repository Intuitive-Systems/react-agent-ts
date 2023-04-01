import { ChatEngine } from "prompt-engine";
import { ReactEngine } from "./engines/ReactEngine";

export class Agent {
    private UserDialogue: ChatEngine; // represents the agent's direct conversation with the user
    reactEngine: ReactEngine;
    constructor() {
        this.reactEngine = new ReactEngine();
        this.UserDialogue = new ChatEngine();
    }

    async addMessage(userInput: string) {
        try {
            const response = await this.reactEngine.call(userInput);
            // save the user's input to the agent's memory
            this.UserDialogue.addInteraction(userInput, response);
            return response;
        } catch (error) {
            console.error(`Error when adding message: ${error}`);
            return null;
        }
    }
}

export default Agent;
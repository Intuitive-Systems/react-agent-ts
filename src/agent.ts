import { ChatEngine } from "prompt-engine";
import { ReactEngine } from "./engines/ReactEngine";
import { ProgramEngine } from "./engines/ProgramEngine";

export class Agent {
    private UserDialogue: ChatEngine; // represents the agent's direct conversation with the user
    engine: ProgramEngine;
    constructor() {
        this.engine = new ProgramEngine();
        this.UserDialogue = new ChatEngine();
    }

    async addMessage(userInput: string) {
        try {
            const response = await this.engine.call(userInput);
            // save the user's input to the agent's memory
            this.UserDialogue.addInteraction(userInput, response);
            return response;
        } catch (error) {
            console.error(`Error when adding message: ${error}`);
            return null;
        }
    }
    async reset() {
        try {
            this.engine.reset();
            return "History cleared";
        } catch (error) {
            console.error(`Error when clearing history: ${error}`);
            return null;
        }
    }
}

export default Agent;
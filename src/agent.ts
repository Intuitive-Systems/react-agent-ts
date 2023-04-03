import { ChatEngine } from "prompt-engine";
import { ReactEngine } from "./engines/ReactEngine";
import { traceMethod } from './lib/traceUtils';

export class Agent {
    private UserDialogue: ChatEngine; // represents the agent's direct conversation with the user
    reactEngine: ReactEngine;
    constructor() {
        this.reactEngine = new ReactEngine();
        this.UserDialogue = new ChatEngine();
        const methodNames = Object.getOwnPropertyNames(Agent.prototype);
            for (const methodName of methodNames) {
                if (methodName !== 'constructor') {
                    traceMethod(this, methodName);
                }
        }
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
    async reset() {
        try {
            this.reactEngine.reset();
            return "History cleared";
        } catch (error) {
            console.error(`Error when clearing history: ${error}`);
            return null;
        }
    }
}

export default Agent;
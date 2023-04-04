import { ChatEngine } from "prompt-engine";
import { IBaseEngine } from "../engines/base";
import { traceMethod } from '../lib/traceUtils';

export class BaseAgent<T extends IBaseEngine> {
    private UserDialogue: ChatEngine; // represents the agent's direct conversation with the user
    engine: T;
    constructor(engine: T) {
        this.engine = engine;
        this.UserDialogue = new ChatEngine();
        const methodNames = Object.getOwnPropertyNames(BaseAgent.prototype);
            for (const methodName of methodNames) {
                if (methodName !== 'constructor') {
                    traceMethod(this, methodName);
                }
        }
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
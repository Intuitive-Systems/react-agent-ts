import { ChatEngine } from "prompt-engine";
import { BabyAgiEngine } from "../engines/BabyAgiEngine";
import { traceMethod } from '../lib/traceUtils';
import { BaseAgent } from "./base";

export class BabyAgi extends BaseAgent<BabyAgiEngine>{
    constructor(objective: string) {
        // example objective: "I want to make a plan to acquire as many paper clips as possible, I am starting with $100."
        const engine = new BabyAgiEngine(objective);
        super(engine);
    }

    // use call(firstTask) to start the agent
}
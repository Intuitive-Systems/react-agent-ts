import { ChatEngine } from "prompt-engine";
import { ReactEngine } from "../engines/SimpleEngine";
import { traceMethod } from '../lib/traceUtils';
import { BaseAgent } from "./base";

export class ReactAgent extends BaseAgent<ReactEngine>{
    reactEngine: ReactEngine;
    constructor() {
        const engine = new ReactEngine();
        super(engine);
    }
}
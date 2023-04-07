import { ChatEngine } from "prompt-engine";
import { SimpleEngine } from "../engines/SimpleEngine";
import { traceMethod } from '../lib/traceUtils';
import { BaseAgent } from "./base";

export class SimpleAgent extends BaseAgent<SimpleEngine>{
    reactEngine: SimpleEngine;
    constructor() {
        const engine = new SimpleEngine();
        super(engine);
    }
}
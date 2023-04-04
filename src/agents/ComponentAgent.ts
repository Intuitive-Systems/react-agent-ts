import { ComponentEngine } from "../engines/ComponentEngine";
import { BaseAgent } from "./base";

export class ComponentAgent extends BaseAgent<ComponentEngine>{
    constructor() {
        const engine = new ComponentEngine();
        super(engine);
    }
}
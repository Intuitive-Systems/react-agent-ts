import { ChatEngine, IChatConfig, DefaultChatConfig, Interaction } from 'prompt-engine';
import { Tool } from '../interfaces';
import { getLogger } from 'log4js';
import { traceMethod } from '../lib/traceUtils';

export interface IBaseEngine {
    call(input: string): Promise<string>;
    reset(): void;
}

export abstract class BaseEngine {
    constructor() {
        const methodNames = Object.getOwnPropertyNames(BaseEngine.prototype);
        for (const methodName of methodNames) {
            if (methodName !== 'constructor') {
                traceMethod(this, methodName);
            }
        }
    }

    public abstract call(input: string): Promise<string>;
    public abstract reset(): void; 
}
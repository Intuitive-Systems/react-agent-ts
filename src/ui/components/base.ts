import { traceMethod } from '../../lib/traceUtils';
import { BaseTool } from '../../tools/base';

export abstract class BaseComponent<T> {
    public name: string;
    public description: string;
    
    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
        const methodNames = Object.getOwnPropertyNames(BaseComponent.prototype);
            for (const methodName of methodNames) {
                if (methodName !== 'constructor') {
                    traceMethod(this, methodName);
                }
        }
    }
  
    abstract call(input: string): Promise<T>;
  
    setDescription(description: string): void {
        this.description = description;
    }
  
    setName(name: string): void {
        this.name = name;
    }
}
  
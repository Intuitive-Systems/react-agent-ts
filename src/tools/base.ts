export abstract class BaseTool {
    public name: string;
    public description: string;
  
    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
  
    abstract call(input: string): Promise<any>;
  
    setDescription(description: string): void {
        this.description = description;
    }
  
    setName(name: string): void {
        this.name = name;
    }
}
  
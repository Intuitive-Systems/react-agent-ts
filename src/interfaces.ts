export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
}

export interface Example {
  messages: ChatMessage[];
}

export interface Action {
    name: string;
    input: string;
}

export interface Step {
    input: string;
    output: string; // the raw output from the model
    action: Action; // the parsed action
    observation?: string; // the result of the action
}

export interface Tool {
    name: string;
    description: string;
    fn: (input: string) => Promise<string> | string;
    input: {
        type: "user" | "assistant" | "both"; // who is providing the input
    };
    returnDirect?: boolean;
}

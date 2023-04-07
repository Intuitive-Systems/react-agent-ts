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

export interface ReactStep {
    input: string;
    output: string; // the raw output from the model
    action: Action; // the parsed action
    observation?: string; // the result of the action
}

export interface WorkflowStep {
    task: Task;
    result: string;
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

// config serialization
export interface Task {
    name: string;
    spec: string;
    tools: string[];
    input_type: string;
    output_type: string;
}
export interface TaskInput {
    name: string;
    type: string;
    description: string;
    example: string;
}
export interface WorkflowAgentConfig {
    goal: string;
    inputs: TaskInput[];
    tasks: Task[];
}
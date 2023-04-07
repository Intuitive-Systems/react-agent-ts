// write a Conversation class that wraps the OpenAI chatCompletions endpoint and: 
// allows for messages to be added to the class
// allows for messages to be removed from the class
// allows for templating of messages
import { ChatMessage, chatCompletion } from '../lib/llm';
import {config} from '../config';
import { ChatEngine, IChatConfig, DefaultChatConfig, Interaction } from 'prompt-engine';
import { Tool, WorkflowStep, Task } from '../interfaces';
import { configure, getLogger } from 'log4js';
import { BaseEngine } from './base';
import { WorkflowAgentConfig } from '../interfaces';
import * as tools from '../tools';
import { examples } from './examples';
import { LLMParser } from 'llmparser';

// logging setup
configure({
    appenders: { out: { type: 'stdout' } },
    categories: {
        default: { appenders: ['out'], level: 'debug' }, // Set log level to 'info'
    },
});
const logger = getLogger('ReactEngine');

export class WorkflowEngine<T> extends BaseEngine {
    private goal: string; // the goal of the agent's workflow
    private workflowConfig: WorkflowAgentConfig; // the serialized configuration of the agent's workflow
    private workflowSteps: WorkflowStep[]; // the steps of the agent's workflow
    private availableTools: Record<string, Tool>; // a map of tools that the agent has access to during workflow execution
    private taskTools: Tool[]; // a list of tools that the agent can use to complete its current task
    private taskIndex: number; // the index of the task that the agent is currently working on
    private taskSpecification: string; // the specification of the task that the agent is currently working on
    private taskRepeat: boolean; // whether or not the task is being repeated
    private examples: Interaction[]; // a list of examples that help the agent understand the format of its thought process
    private InternalDialogue: ChatEngine; // represents the agent's internal dialogue with itself
    private systemPrompt: string;
    private systemPromptTemplate: string = `You are the internal Monologue of a Chat Assistant. 
You run in a loop of Thought, Action, Observation.
At the end of the loop you output an Answer
Use Thought to describe your thoughts about the question you have been asked.
Use Action to run one of the actions available to you.
Observation will be the result of running those actions.

Your overall goal is: 
{{goal}}

{{task}}

Your current task is defined by the following specification: 
{{specification}}

You have the available tools to complete your task:
{{tools}}

You should always reply with the following format:

{{examples}}

Rules:
- If you have received an Input from the user, you should reply with a Thought and an Action.
- If you have received an Observation from a tool, you should reply with a Thought and an Action.
- You should never reply with an Input.
`
    private maxIterations = 8; // the maximum number of iterations that the agent can take
    constructor(config: WorkflowAgentConfig) {
        super();
        const languageConfig: Partial<IChatConfig> = {
            modelConfig: {
                maxTokens: 3500,
            },
        }
        this.workflowConfig = config;
        this.goal = config.goal;
        this.availableTools = tools.availableTools;
        // build the examples
        this.examples = examples;
        // add the examples to the internal dialogue
        this.InternalDialogue = new ChatEngine("", this.examples, "", languageConfig);
    };
    public async init(args: T) {
        // build the goal prompt by iterating over args 
        // and replacing the goal template with the args
        const argKeys = Object.keys(args);
        let goalPrompt = this.goal;
        for (const argKey of argKeys) {
            goalPrompt = goalPrompt.replace(`{{${argKey}}}`, args[argKey]);
        }
        this.goal = goalPrompt;
        // build the system prompt
        this.systemPromptTemplate = this.systemPromptTemplate
            .replace('{{goal}}', this.goal)
            .replace('{{examples}}', examples.join('\n'))
    }
    private async taskSetup() {
        // get the current task
        const task = this.workflowConfig.tasks[this.taskIndex];
        // set the task specification
        this.taskSpecification = task.spec;
        // collect task tools from the available tools
        this.taskTools = task.tools.map(toolName => this.availableTools[toolName]);

        // build the task prompt
        let taskPrompt; 
        if (this.taskRepeat) {
            taskPrompt = `You are repeating the task: 
            ${task.name}.
            The previous unsatisfactory output was: ${this.workflowSteps[this.taskIndex].result}}`;
        } else {
            taskPrompt = `You are starting the task:
            ${task.name}`;
        }

        // build the task prompt
        this.systemPrompt = this.systemPromptTemplate
            .replace('{{task}}', taskPrompt)
            .replace('{{specification}}', task.spec)
            .replace('{{tools}}', Object.values(this.taskTools)
                .map((o) => `- ${o.name}[${o.description}]`)
                .join('\n'));
    }

    private async plan(input: string) {
        logger.debug(`Planning for input: ${input}`);
        const systemMessage: ChatMessage = {
            role: "system",
            content: this.systemPrompt,
        };
        logger.debug(`PLAN -- System Message: ${systemMessage.content}`);
        // build the plan prompt 
        const planPrompt = this.InternalDialogue.buildPrompt(input);
        const planMessage: ChatMessage = {
            role: "assistant",
            content: planPrompt,
        }
        logger.debug(`PLAN -- Plan Message: ${planMessage.content}`);

        const messages: ChatMessage[] = [systemMessage, planMessage];
        // get the plan from openai
        const plan = await chatCompletion(messages);
        logger.debug(`PLAN -- Plan: ${plan}`);
        // save the plan to the agent's memory
        this.InternalDialogue.addInteraction(`${input}`, plan);
        // parse the plan
        const [action, actionInput] = this.parseActionAndInput(plan);
        logger.debug(`PLAN -- Parsed Action: ${action}, Parsed Action Input: ${actionInput}`);
        return [action, actionInput];
    }

    private async act(action: string, actionInput: string) {
        const tool = this.taskTools[action];
        if (!tool) {
            throw new Error(`Could not find tool: ${action}`);
        }
        logger.debug(`ACT -- Acting with tool: ${tool.name} and input: ${actionInput}`)
        const observation = await tool.fn(actionInput);
        logger.debug(`ACT -- Observation: ${observation}`);
        // save the observation to the agent's memory
        this.InternalDialogue.addInteraction(``, observation);
        return observation;
    }

    private async evaluate(){
        // evaluate the agent's performance on the current task
        const labels = [
            {
                name: "success",
                "description": `This task is successful if the agent can complete the task with the given specification and goal criteria.`,
            },
            {
                name: "failure",
                "description": `This task is a failure if the agent cannot complete the task with the given specification and goal criteria.`,
            }
        ]
        const prompt = `Evaluate the agent's performance on the current task.
        Task: 
        ${this.workflowSteps[-1].task.name}
        Goal: 
        ${this.goal}
        Specification: 
        ${this.task.spec}
        Result: 
        ${this.workflowSteps[-1].result}`

        const classifier = new LLMParser({
            apiKey: config.openai_api_key,
            categories: labels
        })
        // classify the prompt as success or failure
        const result = await classifier.parse({document: prompt})
        // if the result is success, set up the next task 
        
        // if the result is failure, set up the current task again
    }


    private async react(): Promise<string> {
        logger.debug(`Reacting to input: ${input}`)
        let [action, actionInput] = await this.plan(`Input: ${input}`);
        logger.debug(`React -- Planned Action: ${action}, Action Input: ${actionInput}`)
        if (action === "Finish") {
            return actionInput;
        }
        for (let i = 0; i < this.maxIterations; i++) {
            logger.debug(`React -- Iteration: ${i}`)
            const observation = await this.act(action, actionInput);
            logger.debug(`React -- Observation: ${observation}`);
            [action, actionInput] = await this.plan(`Observation: ${observation}`);
            logger.debug(`React -- Planned Action: ${action}, Action Input: ${actionInput}`)
            if (action === "Finish") {
                logger.debug(`React -- Finished with response: ${actionInput}`)
                return actionInput;
            }
        }   
        throw new Error(`Max iterations reached: ${this.maxIterations}`);
    }

    public async call(input: string) {
        const response = await this.react(input);
        return response;
    }

    public reset(){
        this.InternalDialogue.resetContext();
    }

    parseActionAndInput(text: string): [string, string] {
        // todo: this is a hack, we should use a proper parser
        const regex = `Action: (${Object.keys(this.actionMap)
          .reduce((acc, a, i) => {
            if (i === 0) {
              return acc + a;
            }
            return acc + "|" + a;
          })
          .trim()})\\[(.*)\\]\\n?`;
    
        const match = text.match(regex);
        if (!match) {
          throw new Error(`Could not parse text: ${text}`);
        }
    
        const action = match[1].trim();
        const input = match[2].trim().replace(/^"(.*)"$/, "$1");
    
        return [action, input];
    }
}
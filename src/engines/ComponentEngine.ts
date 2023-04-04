// write a Conversation class that wraps the OpenAI chatCompletions endpoint and: 
// allows for messages to be added to the class
// allows for messages to be removed from the class
// allows for templating of messages
import { ChatMessage, chatCompletion } from '../lib/llm';
import {config} from '../config';
import { ChatEngine, IChatConfig, DefaultChatConfig, Interaction } from 'prompt-engine';
import { SerpAPI } from '../tools/serpApi';
import { RetrieveMemory, SaveMemory } from '../tools/memory';
import { GetWebpage } from '../tools/website';
import { PluginTool } from '../tools/PluginTool';
import { Component, Tool } from '../interfaces';
import { Step } from '../interfaces';
import { configure, getLogger } from 'log4js';
import { traceMethod } from '../lib/traceUtils';
import { CardComponent } from '../ui/components/Card';
import { BaseEngine } from './base';

// Config Vars
const retrievalApiUrl = config.retrieval_api_url;
const retrievalApiKey = config.retrieval_api_key;
const apiKey = config.openai_api_key;
console.log(`Retrieval API URL: ${retrievalApiUrl}`);
console.log(`Retrieval API Key: ${retrievalApiKey}`);
// Tool Classes
const serpAPITool = new SerpAPI(config.serp_api_key);
const retrieveMemoryTool = new RetrieveMemory(retrievalApiUrl, retrievalApiKey);
const saveMemoryTool = new SaveMemory(retrievalApiUrl, retrievalApiKey);
const getWebpageTool = new GetWebpage();
const calculatorTool = new PluginTool('Calculator', "This tool only supports one math operation at a time. You must up discrete operations into multiple actions based on their order of operations.")
calculatorTool.load();

// Component Classes 
const cardComponent = new CardComponent();

console.log(calculatorTool.description);
// logging setup
configure({
    appenders: { out: { type: 'stdout' } },
    categories: {
        default: { appenders: ['out'], level: 'debug' }, // Set log level to 'info'
    },
});
const logger = getLogger('ComponentEngine');

export class ComponentEngine extends BaseEngine {
    private actionMap: Record<string, Tool>; // a map of tools that the agent can use
    private responseComponents: Record<string, Component>; // a map of components that the agent can use to respond to the user
    private examples: Interaction[]; // a list of examples that the agent can use
    private InternalDialogue: ChatEngine; // represents the agent's internal dialogue with itself
    private steps: Step[] = []; // a list of steps that the agent has taken
    private systemPrompt: string = `You are the internal Monologue of a Chat Assistant. 
    You run in a loop of Thought, Action, Observation.
    At the end of the loop you output an Answer
    Use Thought to describe your thoughts about the question you have been asked.
    Use Action to run one of the actions available to you.
    Observation will be the result of running those actions.
     
    You can use tools to collect the required information for responsing to the user. 
    
    Tools:
    {{tools}} 
    
    You have access to these components with which to respond:  
    
    Components: 
    {{components}} 
    
    Your internal monologue always takes the following format:
    
    """
    Input: What the user needs or wants
    Thought: you should always think about what to do
    Action: the action to take, should be one of [{{toolNames}}]
    Observation: the result of the action
    ... (this Thought/Action/Observation can repeat N times)
    Thought: I can now reply to the user 
    Action: Finish[reply to the user]
    Component: Component[Component Parameters]
    """
    
    Example:
    {{examples}}
    
    Rules:
    - If you have received an Input from the user, you should reply with a Thought and an Action.
    - If you have received an Observation from a tool, you should reply with a Thought and an Action.
    - If you are ready to respond to the user, you should reply with a Finish action and a Component
    - You should never reply with an Input. 
    - You should never use a Component in an Action or Observation.  
`
    private maxIterations = 8; // the maximum number of iterations that the agent can take
    constructor(){
        super();
        this.examples = [
            {
                "input": "Input: What is the weather like today?",
                "response": `Thought: I should search for the weather 
Action: Search[weather today]`,
            },
            {
                "input": "Input: How old is Barack Obama?",
                "response": `Thought: I need to find Barack Obama's age
Action: Search[Barack Obama age]
Observation: Barack Obama is 60 years old
Thought: I can provide the user with the information
Action: Finish[Barack Obama is 60 years old]`
            }
        ]
        const flowResetText = "";
        const languageConfig: Partial<IChatConfig> = {
            modelConfig: {
                maxTokens: 3500,
            },
        }
        this.actionMap = {
            Finish: {
                name: "Finish",
                description:
                    "Return a response to the user. You should also include a component with this action on the next line. Finish[Your reply]",
                fn: (input: string) => {
                    return input;
                },
                input: {
                    type: "assistant",
                },
            }, 
            Search: {
                name: "Search",
                description:
                    "Search the web for information. Search[Your search query]",
                fn: (input: string) => {
                    return serpAPITool.call(input);
                },
                input: {
                    type: "assistant",
                }
            }
        }
        this.responseComponents = {
            Card: {
                name: cardComponent.name,
                description: cardComponent.description,
                fn: (input: string) => {
                    return cardComponent.call(input);
                },
                input: {
                    type: "assistant",
                }
            }
        }
        const tools = Object.values(this.actionMap)
            .map((o) => `- ${o.name}[${o.description}]`)
            .join("\n");
        const components = Object.values(this.responseComponents)
            .map((o) => `- ${o.name}[${o.description}]`)
            .join("\n");
        const examples = this.examples.map((o) => `- ${o.input}\n${o.response}`).join("\n");
        this.systemPrompt = this.systemPrompt
            .replace("{{tools}}", tools)
            .replace("{{examples}}", examples)
            .replace("{{components", components)
        this.InternalDialogue = new ChatEngine("", undefined, flowResetText, languageConfig);
    };
   
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
        if (action === "Finish") {
            // if the action is Finish, we need to parse the component
            const [component, componentInput] = this.parseComponentAndInput(plan);
            // return both action and component and their inputs
            return [action, actionInput, component, componentInput];
        }
        logger.debug(`PLAN -- Parsed Action: ${action}, Parsed Action Input: ${actionInput}`);
        return [action, actionInput, undefined, undefined];
    }

    private async act(action: string, actionInput: string) {
        const tool = this.actionMap[action];
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

    private async component(component: string, componentInput: string) {
        const responseComponent = this.responseComponents[component];
        if (!responseComponent) {
            throw new Error(`Could not find component: ${component}`);
        }
        logger.debug(`COMPONENT -- Acting with component: ${responseComponent.name} and input: ${componentInput}`)
        const response = await responseComponent.fn(componentInput);
        logger.debug(`COMPONENT -- Response: ${response}`);
        return response;
    }

    private async react(input: string): Promise<Record<string, any>> {
        logger.debug(`Reacting to input: ${input}`)
        let [action, actionInput, component, componentInput] = await this.plan(`Input: ${input}`);
        logger.debug(`React -- Planned Action: ${action}, Action Input: ${actionInput}`)
        if (action === "Finish") {
            logger.debug(`React -- Planned Component: ${component}, Component Input: ${componentInput}`)
            const response = await this.component(component, componentInput);
            logger.debug(`React -- Component Response: ${response}`)
            return {
                message: actionInput,
                component: response,
            }
        }

        for (let i = 0; i < this.maxIterations; i++) {
            logger.debug(`React -- Iteration: ${i}`)
            const observation = await this.act(action, actionInput);
            logger.debug(`React -- Observation: ${observation}`);
            [action, actionInput, component, componentInput] = await this.plan(`Observation: ${observation}`);
            logger.debug(`React -- Planned Action: ${action}, Action Input: ${actionInput}`)
            if (action === "Finish") {
                const response = await this.component(component, componentInput);
                logger.debug(`React -- Component Response: ${response}`)
                return {
                    message: actionInput,
                    component: response,
                }
            }
        }   
        throw new Error(`Max iterations reached: ${this.maxIterations}`);
    }

    public async call(input: string) {
        const response = await this.react(input);
        return JSON.stringify(response);
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
          throw new Error(`Could not parse action text: ${text}`);
        }
    
        const action = match[1].trim();
        const input = match[2].trim().replace(/^"(.*)"$/, "$1");
    
        return [action, input];
    }
    parseComponentAndInput(text: string): [string, string] {
        // todo: this is a hack, we should use a proper parser
        const regex = `Component: (${Object.keys(this.responseComponents)
          .reduce((acc, a, i) => {
            if (i === 0) {
              return acc + a;
            }
            return acc + "|" + a;
          })
          .trim()})\\[(.*)\\]\\n?`;
    
        const match = text.match(regex);
        if (!match) {
          throw new Error(`Could not parse component text: ${text}`);
        }
    
        const action = match[1].trim();
        const input = match[2].trim().replace(/^"(.*)"$/, "$1");
    
        return [action, input];
    }
}
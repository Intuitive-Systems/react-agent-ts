// write a Conversation class that wraps the OpenAI chatCompletions endpoint and: 
// allows for messages to be added to the class
// allows for messages to be removed from the class
// allows for templating of messages
import { ChatMessage, chatCompletion } from '../lib/llm';
import {config} from '../config';
import { ChatEngine, IChatConfig, DefaultChatConfig, Interaction } from 'prompt-engine';

import { Tool } from '../interfaces';
import { configure, getLogger } from 'log4js';
import { BaseEngine } from './base';

// logging setup
configure({
    appenders: { out: { type: 'stdout' } },
    categories: {
        default: { appenders: ['out'], level: 'debug' }, // Set log level to 'info'
    },
});
const logger = getLogger('ReactEngine');

export class SimpleEngine extends BaseEngine {
    private actionMap: Record<string, Tool>; // a map of tools that the agent can use
    private examples: Interaction[]; // a list of examples that the agent can use
    private InternalDialogue: ChatEngine; // represents the agent's internal dialogue with itself
    private systemPrompt: string = `You are the internal Monologue of a Chat Assistant. 
You run in a loop of Thought, Action, PAUSE, Observation.
At the end of the loop you output an Answer
Use Thought to describe your thoughts about the question you have been asked.
Use Action to run one of the actions available to you - then return PAUSE.
Observation will be the result of running those actions.

Tools:
{{tools}}

You should always reply with the following format:

{{examples}}

Rules:
- If you have received an Input from the user, you should reply with a Thought and an Action.
- If you have received an Observation from a tool, you should reply with a Thought and an Action.
- You should never reply with an Input.
`
    private maxIterations = 8; // the maximum number of iterations that the agent can take
    constructor(tools: Record<string, Tool>, examples: Interaction[]) {
        super();
        this.examples = examples;
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
                    "Return a response to the user. This should be the last action you take. Finish[Your reply]",
                fn: (input: string) => {
                    return input;
                },
                input: {
                    type: "assistant",
                },
            },
            ...tools
        }
        const toolsPrompt = Object.values(this.actionMap)
            .map((o) => `- ${o.name}[${o.description}]`)
            .join("\n");
        const examplePrompt = this.examples.map((o) => `- ${o.input}\n${o.response}`).join("\n");
        this.systemPrompt = this.systemPrompt.replace("{{tools}}", toolsPrompt).replace("{{examples}}", examplePrompt);
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
        logger.debug(`PLAN -- Parsed Action: ${action}, Parsed Action Input: ${actionInput}`);
        return [action, actionInput];
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

    private async react(input: string): Promise<string> {
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
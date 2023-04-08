import { ChatEngine } from "prompt-engine";
import { SimpleEngine } from "../engines/SimpleEngine";
import { traceMethod } from '../lib/traceUtils';
import { BaseAgent } from "./base";
import { config } from '../config';
import { SerpAPI } from '../tools/serpApi';
import { RetrieveMemory, SaveMemory } from '../tools/memory';
import { GetWebpage } from '../tools/website';
import { PluginTool } from '../tools/PluginTool';
import { Tool } from "../interfaces";
import { examples } from '../engines/examples';

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

export class SimpleAgent extends BaseAgent<SimpleEngine>{
    reactEngine: SimpleEngine;
    constructor() {
        const tools: Record<string, Tool> = {
            Search : {
                name: "Search",
                description: serpAPITool.description,
                fn: (input: string) => serpAPITool.call(input),
                input: {
                    type: "assistant",
                },
            },
            GetWebpage: {
                name: getWebpageTool.name,
                description: getWebpageTool.description,
                fn: (input: string) => getWebpageTool.call(input),
                input: {
                    type: "assistant",
                },
            },
            Calculator: {
                name: calculatorTool.name,
                description: calculatorTool.description,
                fn: (input: string) => calculatorTool.call(input),
                input: {
                    type: "assistant"
                }
            },
            RetrieveMemory: {
                name: "RetrieveMemory",
                description: retrieveMemoryTool.description,
                fn: (input: string) => retrieveMemoryTool.call(input),
                input: {
                    type: "assistant",
                },
            },
            SaveMemory: {
                name: "SaveMemory",
                description: saveMemoryTool.description,
                fn: (input: string) => saveMemoryTool.call(input),
                input: {
                    type: "assistant",
                },
            }
        }
        const engine = new SimpleEngine(tools, examples);
        super(engine);
    }
}
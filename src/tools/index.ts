import { config } from '../config';
import { Tool } from '../interfaces';

import { BaseTool } from './base';
import { RetrieveMemory, SaveMemory } from './memory';
import { PluginTool } from './PluginTool';
import { SerpAPI } from './serpApi';
import { GetWebpage } from './website'

// Config Vars
const retrievalApiUrl = config.retrieval_api_url;
const retrievalApiKey = config.retrieval_api_key;
// Tool Classes
const serpAPITool = new SerpAPI(config.serp_api_key);
const retrieveMemoryTool = new RetrieveMemory(retrievalApiUrl, retrievalApiKey);
const saveMemoryTool = new SaveMemory(retrievalApiUrl, retrievalApiKey);
const getWebpageTool = new GetWebpage();
const calculatorTool = new PluginTool('Calculator', "This tool only supports one math operation at a time. You must up discrete operations into multiple actions based on their order of operations.")
calculatorTool.load();

export const availableTools: Record<string, Tool> = {
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
    Search: {
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
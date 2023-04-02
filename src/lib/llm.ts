const retry = require('async-retry');
import {Configuration, OpenAIApi} from 'openai';
import {config} from "../config";
import { inspect } from 'util';

const configuration = new Configuration({
    apiKey: config.openai_api_key
});
const openai = new OpenAIApi(configuration);

/*
    This function is used to edit the input text using the OpenAI API.
    The input text is edited based on the instruction provided.
    The instruction is a string that contains the text to be edited and the new text to replace it.
    Example: 
    input: "I am a student"
    instruction: "Replace the word student with teacher"
    output: "I am a teacher"

    @param input: string - The text to be edited
    @param instruction: string - The instruction to edit the text
    @param n: number - The number of edits to be made
    @param temperature: number - The temperature of the model
    @param top_p: number - The top_p of the model
    @param model: string - The model to be used for editing
    @return string - The edited text
*/
export async function openaiEdit(input: string, instruction: string, n: number = 1, temperature: number = 1, top_p: number = 1, model: string = "text-davinci-edit-001") {
    const response = await retry(
        async () => {
            const result = await openai.createEdit({
                model: model,
                input: input,
                instruction: instruction,
                n: n,
                temperature: temperature,
                top_p: top_p
            });

            if (result.status !== 200) {
                console.error('Error: Received non-200 status code from OpenAI API:');
                console.error(`Status code: ${result.status}`);
                console.error(`Response data: ${inspect(result.data, { depth: null })}`);
                throw new Error(`Request failed with status code ${result.status} while completing prompt`);
            }

            return result;
        },
        {
            retries: 8,
            factor: 4,
            minTimeout: 1000,
            onRetry: (error: any) => {
                console.error('Error while editing input:');
                console.error(inspect(error, { depth: null }));
            }
        }
    );

    const text = response.data.choices[0].text;
    return text!;
}

/*
    This function is used to generate text using the OpenAI API.
    The text is generated based on the prompt provided.
    The prompt is a string that contains the text to be used as a starting point for the generation.
    Example:
    prompt: "I am a student"
    output: "I am a student at the University of California, Berkeley."

    @param prompt: string - The text to be used as a starting point for the generation
    @param nTokens: number - The number of tokens to be generated
    @param temperature: number - The temperature of the model
    @param model: string - The model to be used for generation
    @return string - The generated text
*/
export async function openaiCompletion(prompt: string, nTokens: number = 500, temperature: number = 1, model: string = "text-davinci-003"): Promise<string> {
    const response = await retry(
        async () => {
            const result = await openai.createCompletion({
                model: model,
                prompt,
                temperature: temperature,
                max_tokens: nTokens,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });

            if (result.status !== 200) {
                console.error('Error: Received non-200 status code from OpenAI API:');
                console.error(`Status code: ${result.status}`);
                console.error(`Response data: ${inspect(result.data, { depth: null })}`);
                throw new Error(`Request failed with status code ${result.status} while completing prompt`);
            }

            return result;
        },
        {
            retries: 8,
            factor: 4,
            minTimeout: 1000,
            onRetry: (error: any) => {
                console.error('Error while completing prompt:');
                console.error(inspect(error, { depth: null }));
            }
        }
    );

    const text = response.data.choices[0].text;
    return text!;
}

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    name?: string;
}
export async function chatCompletion(messages: ChatMessage[], max_tokens: number = 1000, temperature: number = 0.7, model: string = "gpt-4") {
    const response = await retry(
        async () => {
            const result = await openai.createChatCompletion({
                model: model,
                messages: messages,
                max_tokens: max_tokens,
                temperature: temperature,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });
            if (result.status !== 200) {
                console.error('Error: Received non-200 status code from OpenAI API:');
                console.error(`Status code: ${result.status}`);
                console.error(`Response data: ${inspect(result.data, { depth: null })}`);
                throw new Error(`Request failed with status code ${result.status} while completing prompt`);
            }

            return result;
        },
        {
            retries: 8,
            factor: 4,
            minTimeout: 1000,
            onRetry: (error: any) => {
                console.error('Error while completing prompt:');
                console.error(inspect(error, { depth: null }));
            }
        }
    );

    const text = response.data.choices[0].message.content;
    return text!;
}
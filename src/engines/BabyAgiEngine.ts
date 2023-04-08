import { BaseEngine } from './base';
import { RetrieveMemory, SaveMemory } from '../tools/memory';
import { ChatMessage, chatCompletion } from '../lib/llm';
import { config } from '../config';
import { extractJson } from '../lib/extraction';

const retrievalApiUrl = config.retrieval_api_url;
const retrievalApiKey = config.retrieval_api_key;
console.log(`Retrieval API URL: ${retrievalApiUrl}`);
console.log(`Retrieval API Key: ${retrievalApiKey}`);

const retrieveMemoryTool = new RetrieveMemory(retrievalApiUrl, retrievalApiKey);
const saveMemoryTool = new SaveMemory(retrievalApiUrl, retrievalApiKey);

interface PrioritizedTask {
    task: string;
    priority: number;
}

interface CompletedTask {
    task: string;
    result: string;
}

const PrioritizedTaskString = `
    {
        "task": "string",
        "priority": "number"
    }
`
const PrioritizedTasksString = `
    [
        {
            "task": "string",
            "priority": "number"
        },
        {
            "task": "string",
            "priority": "number"
        },
        ...
    ]
`

export class BabyAgiEngine extends BaseEngine {
    private objective: string;
    private currentTask: PrioritizedTask;
    private taskList: PrioritizedTask[];
    private completedTasks: CompletedTask[] = [];
    constructor(objective: string) {
        super();
        this.objective = objective;
        this.currentTask = null;
        this.taskList = [];
    }

    async call(input) {
        this.currentTask = this.processInput(input);
        console.log(`Current task set to: ${this.currentTask.task} with priority ${this.currentTask.priority}`);

        while (this.currentTask) {
            console.log(`There are ${this.taskList.length} tasks in the list and ${this.completedTasks.length} tasks completed.`)
            console.log(`Consideirng current task: ${this.currentTask.task} with priority ${this.currentTask.priority}`);
            const result = await this.completeTask(this.currentTask);
            console.log(`Task completed. Result: ${result}`);
            const taskMemory = `Task: ${this.currentTask.task}. Result: ${result}`
            console.log(`Saving task to memory.`)
            await saveMemoryTool.call(taskMemory);
            const newTasks = await this.generateTasks(result, this.currentTask.task);
            console.log(`${newTasks.length} New tasks generated.`);
            this.taskList = this.addNewTasks(newTasks, this.taskList);
            console.log(`Updated task list with new tasks.`);
            this.taskList = await this.prioritizeTasks(this.taskList);
            console.log(`Re-Prioritized task list.`);
            this.currentTask = this.taskList.shift();
            console.log(`Next task set to: ${this.currentTask.task} with priority ${this.currentTask.priority}`);
        }

        return this.extractFinalResult();
    }


    processInput(input) {
        return {
            task: input,
            priority: 100,
        };
    }

    async completeTask(task) {

        // Retrieve context
        let context = await retrieveMemoryTool.call(task.task, 3);
        if (!context || context.length === 0) {
            console.log('No context found');
            context = "No relevant previous tasks found.";
        }

        const systemPrompt = `You are an AI who performs one task based on the following objective: ${this.objective}. 
        If you cannot complete the task, that's ok for you are just a poor poor AI. Instead just imagine a plausible outcome for the task and return that.
        Take into account these previously completed tasks:\n${context}`;

        // Perform the task with context
        const formattedTask = `Current Task: ${task.task}.`;

        const messagesWithContext: ChatMessage[] = [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: formattedTask,
            },
        ];
        // console.log(`Calling chat completion with context: ${JSON.stringify(messagesWithContext, null, 2)}`)
        const result = await chatCompletion(messagesWithContext);
        // save the result
        this.completedTasks.push({
            task: task.task,
            result: result,
        });
        return result;
    }

    async generateTasks(result: string, description: string) {
        const systemPrompt = `You are an task creation AI that uses the result of an execution agent to create new tasks with the following objective: ${this.objective}. 
        These are incomplete tasks: 
        ${JSON.stringify(this.taskList.map((task)=> task.task), null, 2)}. 

        `;
        const userPrompt = `The last completed task has the result: ${result}. 
        This result was based on this task description: ${description}. 
        Generate new tasks based on the result. Limit your output to 5 tasks.`;
        const messages: ChatMessage[] = [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: userPrompt
            },
        ];
        // console.log(`Calling chat completion to generate new tasks: ${JSON.stringify(messages, null, 2)}`)
        const newTasksRaw = await chatCompletion(messages);
        const newTasks = await extractJson<PrioritizedTask[]>(newTasksRaw, PrioritizedTasksString);
        // console.log(`New tasks generated: ${JSON.stringify(newTasks, null, 2)}`)
        return newTasks;
    }

    addNewTasks(newTasks: PrioritizedTask[], taskList: PrioritizedTask[]) {
        const updatedTaskList = taskList.concat(newTasks.filter(newTask => !taskList.some(existingTask => existingTask.task === newTask.task)));
        return updatedTaskList;
    }

    async prioritizeTasks(taskList): Promise<PrioritizedTask[]> {
        const systemPrompt = `Objective: ${this.objective}. 
        Prioritize the tasks based on their priority values and likelihood of helping in achieving the objective. 
        Sort the tasks in descending order of priority. Limit your output to 20 tasks.`;
        
        const messages: ChatMessage[] = [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: `Prioritize tasks: ${JSON.stringify(taskList, null, 2)}`,
            },
        ];

        const prioritizedTasksRaw = await chatCompletion(messages);
        const prioritizedTasks = await extractJson<PrioritizedTask[]>(prioritizedTasksRaw, PrioritizedTasksString);
        return prioritizedTasks;
    }

    async extractFinalResult() {
        // Implement this function based on how the final result should be formatted and returned
        const finalResult = "EXAMPLE-FINAL-RESULT";
        return finalResult;
    }

    reset() {
        this.currentTask = null;
        this.taskList = [];
    }
}
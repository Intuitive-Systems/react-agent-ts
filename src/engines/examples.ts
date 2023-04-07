import { Interaction } from "prompt-engine";

export const WeatherExample ={
    "input": "Input: What is the weather like today?",
    "response": `Thought: I should search for the weather 
                Action: Search[weather today]`,
    }

export const SearchExample = {
    "input": "Input: How old is Barack Obama?",
    "response": `Thought: I need to find Barack Obama's age
    Action: Search[Barack Obama age]
    Observation: Barack Obama is 60 years old
    Thought: I can provide the user with the information
    Action: Finish[Barack Obama is 60 years old]`
}

export const examples: Interaction[] = [WeatherExample, SearchExample];
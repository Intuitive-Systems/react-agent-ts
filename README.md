# 🚀 Welcome to React-Agent-TS 🤖

A TypeScript implementation of the ReAct agent logic from the paper 📄 [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629).

React-Agent-TS allows you to build a powerful 💪 Chat Assistant that can interact with users, make use of handy tools 🛠️ (e.g. search, memory retrieval), and have internal dialogues 🧠 to generate meaningful responses.

## 🏗️ Architecture

This amazing tool utilizes the Microsoft PromptEngine abstraction to model interactions. The Agent class models its thoughts as two parallel interactions: one with the user directly 👥, and another internal monologue with itself for problem-solving 🧩. This separation proves useful as it cuts down on complexity in the mental model when building higher-order systems.

### Here's an example of the React Agent thought process: 

```mermaid
Title: Agent Diagram

autonumber

Note: **InternalDialogue** and **UserDialogue** are base *PromptEngine*s

***User Dialogue:***

*System Message:*
N/A content is sent directly to user. 

Ex: 
- What is the weather like today?
- The weather in San Francisco is 60 Degrees and Sunny.

Ex: 
- How old is Barack Obama?
- Barack Obama is 60 years old.

Internal Dialogue Looks like: 

*System Message:* 

You are the internal Monologue of a Chat Assistant. 
        You have access to the following tools to help you reply to a user:

Tools:
<tools>

You should always reply with the following format:

```
Input: What the user needs or wants
Thought: you should always think about what to do
Action: the action to take, should be one of [{{toolNames}}]
Observation: the result of the action
... (this Thought/Action/Observation can repeat N times)
Thought: I can now reply to the user 
Action: Finish[reply to the user]
```

Example:
```
Input: What is the weather like today?
Thought: I should search for the weather 
Action: Search[weather today]
Observation: It is 70 degrees and sunny 
Thought: I can now reply to the user 
Action: Finish[It is 70 degrees and sunny]
```

Rules:
- Never add your own Input.
- After you use a tool like Search, I will provide you with the result of the tool as an Observation.
So just stop until i do.



User -> Agent: Question

_: **Begin ReAct Iteration**

_: **Formulate a Plan**

Agent -> InternalDialogue: Build Plan Prompt
InternalDialogue -> Agent: Plan Prompt
Agent -> OpenAI: Plan Completion
OpenAI -> Agent: Plan
Agent -> InternalDialogue: Save User Input with Partial Plan
Agent -> Agent: Parse Plan

_: **Take an Action**
if: If Action is Finish[]
Agent -> User: Send Agent Response

Else: Take Action
Agent -> Tool: Perform Action
Tool -> Agent: Observation 
Agent -> InternalDialogue: Persist Observation
Note: GOTO "Formulate Plan"
```

## 🔮 The Vision

The vision for this project is to produce a completely local agent architecture that utilizes the growing library of bot plugins 🤖 in the [Wellknown.ai](https://www.wellknown.ai/) plugin repository. These agents, expert at a particular task, will be able to call into one another and perform complex behavior and automations 🔄 dynamically based on need.

Using the principles of [factored cognition](https://primer.ought.org/), we can realize a future where not only do you own your data, but your personal bot 🤖 safely and carefully takes care of the minutiae so you can do more 🌟!

## 🛠️ Setup

Follow these steps to set up the project:

1. Install [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/).

2. Clone the project:

```sh
git clone https://github.com/Intuitive-Systems/react-agent-ts.git
cd react-agent-ts
```

3. Set up .env files

The agent relies on `.env.agent` and the local retrieval plugin relies on `.env.retrieval`. 
Examples of each are in `.env.agent.example` and `.env.retrieval.example` respectively.  

4. Compile and run:

```sh
docker-compose up
```

## 📚 Usage

The agent is designed to be run as a service, via a graphql API. 

Sending this query to `localhost:3000`:

```
query {
  addMessage(userInput: "What is 5/4^13+4(3-1)?")
}
```

Will result in an answer being returned: 
```
{
  "data": {
    "addMessage": "The result of the expression 5/4^13+4(3-1) is approximately 8.000000074."
  }
}
```

## 📝 TODOs
- [ ]: Set up tracing for debugging
- [ ]: Re-assess Agent and ReactEngine abstraction to ensure fit
- [ ]: fixup the ReactEngine system prompt such that tools are better formatted and have more information 
- [ ]: flesh out the PluginTool such that it more dynamically deals with arbitrary plugins -- should probably be lifted into its own Engine / Agent abstraction (ex. PluginEnging or APIAgent)
- [ ]: Build tracing tool which allows agent to introspect into traces and self-diagnose

## About the Author 🧑‍💻

react-agent-ts was created by Conner Swann, founder of Intuitive Systems. Conner is a passionate developer and advocate for democratizing AI models and frameworks, believing that access to powerful machine learning tookits should be available to everyone 🌍. In the words of the modern sage, "When the AI tide rises, all boats should float" 🚣.

You can find Conner on Twitter, sharing insights and occasional shenanigans 🎭 at [@YourBuddyConner](https://twitter.com/YourBuddyConner). While he definitely enjoys being on the bandwagon for advancing AI 🤖, he remains humbly committed to exploring and delivering state-of-the-art technology for everyone's benefit.
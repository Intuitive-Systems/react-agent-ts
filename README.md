# 🚀 Welcome to React-Agent-TS 🤖

A TypeScript implementation of the ReAct agent logic from the paper 📄 [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629).

React-Agent-TS allows you to build a powerful 💪 Chat Assistant that can interact with users, make use of handy tools 🛠️ (e.g. search, memory retrieval), and have internal dialogues 🧠 to generate meaningful responses.

## 🏗️ Architecture

This amazing tool utilizes the Microsoft PromptEngine abstraction to model interactions. The Agent class models its thoughts as two parallel interactions: one with the user directly 👥, and another internal monologue with itself for problem-solving 🧩. This separation proves useful as it cuts down on complexity in the mental model when building higher-order systems.

### Here's an example of the React Agent thought process: 

![Swimlanes Diagram](https://static.swimlanes.io/2c45225fcfec45210b2398d3ec8c0fad.png)

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
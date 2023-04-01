# React-Agent-TS

A TypeScript implementation of the ReAct agent logic from the paper [Learning to Respond with Imagination](https://arxiv.org/abs/2210.03629).

React-Agent-TS allows you to build a powerful Chat Assistant that can interact with a user, make use of tools (e.g. search, memory retrieval) and have internal dialogues to generate meaningful responses.

## Setup

Follow these steps to set up the project:

1. Install [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/).

2. Clone the project:

```sh
git clone https://github.com/Intuitive-Systems/react-agent-ts.git
cd react-agent-ts
```

3. Install dependencies:

```sh
yarn install
```

4. Create a `.env` file in the project root folder:

```bash
OPENAI_API_KEY=
SERP_API_KEY=
```

Fill in the required API keys, e.g.:

```bash
OPENAI_API_KEY=your_openai_api_key
SERP_API_KEY=your_serp_api_key
```

5. Compile and run:

```sh
yarn build
yarn start
```

## Usage

### Import Agent Class

```typescript
import { Agent } from "react-agent-ts";
```

### Instantiate Agent

```typescript
const agent = new Agent();
```

### Add Message

```typescript
(async () => {
  const userInput = "What is the weather like today?";
  const response = await agent.addMessage(userInput);
  console.log(response);
})();
```

## Main Class

The main class to use is `Agent`, which has the following properties and methods:

```typescript
class Agent {
  private UserDialogue: ChatEngine;
  reactEngine: ReactEngine;
  constructor();
  async addMessage(userInput: string): Promise<string | null>;
}
```

## Core Engine

`ReactEngine` is the core engine that implements the ReAct agent logic. It interacts with the `ChatEngine` and various tool classes like `SerpAPI`, `RetrieveMemory`, and `SaveMemory`.

Complete `ReactEngine` code is available in the [project repository](https://github.com/Intuitive-Systems/react-agent-ts/blob/main/src/ReactEngine.ts).

## Dependencies

React-Agent-TS depends on the following libraries:

- `fetch`: For making HTTP requests.
- `log4js`: For logging.
- `openai`: For interacting with OpenAI's API.
- `prompt-engine`: For managing dialogue interactions.
- `querystring`: For building query strings.
- `typescript`: For working with TypeScript.

Please refer to the [`package.json`](https://github.com/username/react-agent-ts/blob/main/package.json) for more information.

## License

This project is licensed under the [MIT License](https://github.com/username/react-agent-ts/blob/main/LICENSE).
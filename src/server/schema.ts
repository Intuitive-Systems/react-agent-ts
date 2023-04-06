import { GraphQLSchema, GraphQLString, GraphQLObjectType, GraphQLInt } from 'graphql';
import {ReactAgent} from '../agents/ReactAgent';
const reactAgent = new ReactAgent();

export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            // ... other fields (edit and completion) ...
            reactMessage: {
                type: GraphQLString,
                args: {
                    userInput: { type: GraphQLString },
                },
                resolve: async (parent: any, args: any) => {
                    const userInput = args.userInput;
                    const response = await reactAgent.addMessage(userInput);
                    return response;
                }
            },
            resetReact: {
                type: GraphQLString,
                resolve: async (parent: any, args: any) => {
                    const response = await reactAgent.reset();
                    return "ok";
                }
            }
        }
    })
});

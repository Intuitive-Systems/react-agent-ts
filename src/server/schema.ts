import { GraphQLSchema, GraphQLString, GraphQLObjectType, GraphQLInt } from 'graphql';
import Agent from '../agent';

const agentInstance = new Agent();

export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            // ... other fields (edit and completion) ...
            addMessage: {
                type: GraphQLString,
                args: {
                    userInput: { type: GraphQLString },
                },
                resolve: async (parent: any, args: any) => {
                    const userInput = args.userInput;
                    const response = await agentInstance.addMessage(userInput);
                    return response;
                }
            },
            reset: {
                type: GraphQLString,
                resolve: async (parent: any, args: any) => {
                    const response = await agentInstance.reset();
                    return "ok";
                }
            }
        }
    })
});

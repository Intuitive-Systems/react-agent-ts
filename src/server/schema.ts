import { GraphQLSchema, GraphQLString, GraphQLObjectType, GraphQLInt } from 'graphql';
import {ReactAgent} from '../agents/ReactAgent';
import {ComponentAgent} from '../agents/ComponentAgent';
const reactAgent = new ReactAgent();
const componentAgent = new ComponentAgent();

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
            },
            componentMessage: {
                type: GraphQLString,
                args: {
                    userInput: { type: GraphQLString },
                },
                resolve: async (parent: any, args: any) => {
                    const userInput = args.userInput;
                    const response = await componentAgent.addMessage(userInput);
                    return response;
                }
            },
            resetComponent: {
                type: GraphQLString,
                resolve: async (parent: any, args: any) => {
                    const response = await componentAgent.reset();
                    return "ok";
                }
            }
        }
    })
});

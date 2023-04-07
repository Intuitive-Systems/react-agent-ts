import { GraphQLSchema, GraphQLString, GraphQLObjectType, GraphQLInt } from 'graphql';
import {SimpleAgent} from '../agents/SimpleAgent';
const simpleAgent = new SimpleAgent();

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
                    const response = await simpleAgent.addMessage(userInput);
                    return response;
                }
            },
            resetReact: {
                type: GraphQLString,
                resolve: async (parent: any, args: any) => {
                    const response = await simpleAgent.reset();
                    return "ok";
                }
            }
        }
    })
});

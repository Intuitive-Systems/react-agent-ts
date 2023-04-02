import axios from 'axios';
import { BaseTool } from './base';
import request from 'sync-request';
import { chatCompletion } from '../lib/llm';
import { ChatMessage } from '../interfaces';
// You should also import the types for the plugin manifest and OpenAPI specifications
// For simplicity, I will use 'any' type, but you should replace it with the proper types
type AuthType = "none" | "api_key" | "oauth2" | "custom";
type APIType = "openapi" | "grpc" | "soap";

interface RegistryResponse {
    plugins: Plugin[];
}

interface Plugin {
    name: string;
    manifest: {
        schema_version: string;
        name_for_human: string;
        name_for_model: string;
        description_for_human: string;
        description_for_model: string;
        auth: {
            type: AuthType;
        };
        api: {
            type: APIType;
            url: string;
            is_user_authenticated: boolean;
        };
        logo_url: string;
        contact_email: string;
        legal_info_url: string;
    };
    openAPI?: any;
}
interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
    };
    servers: {
        url: string;
    }[];
    paths: {
        [key: string]: Path;
    };
}

interface Path {
    get: {
        operationId: string;
        summary: string;
        parameters: Parameter[];
        responses: {
            [key: string]: {
                description: string;
                content: {
                    [key: string]: {
                        schema: {
                            $ref?: string;
                        };
                    };
                };
            };
        };
    };
}

interface Parameter {
    in: string;
    name: string;
    schema: {
        type: string;
        enum?: string[];
    };
    required: boolean;
    description: string;
}

export class PluginTool extends BaseTool {
    private registryUrl: string = "https://www.wellknown.ai/api/plugins"
    private plugin: Plugin;
    private openApiSpec: OpenAPISpec;
    private apiClient: any;

    constructor(
        name: string,
        description: string
    ) {
        super(name, description);
    }

    private loadManifestAndOpenAPISpec(): void {
        try {
            const manifestResponse = this.syncRequest(this.registryUrl);
            this.plugin = manifestResponse.plugins.find((plugin: Plugin) => {
                if (plugin.name === this.name) {
                    return plugin;
                }
            });

            if (!this.plugin) {
                throw new Error(`Plugin "${this.name}" not found.`);
            }

            const openApiSpecResponse = this.syncRequest(this.plugin.manifest.api.url);
            this.openApiSpec = openApiSpecResponse;

            this.apiClient = axios.create({
                baseURL: this.openApiSpec.servers[0].url,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

        } catch (error) {
            console.error('Error loading manifest and OpenAPI spec:', error);
            throw error;
        }
    }

    private syncRequest(url: string) {
        return JSON.parse(request('GET', url).getBody('utf8'));
    }

    public load(): void {
        this.loadManifestAndOpenAPISpec();
        let description = this.plugin.manifest.description_for_model;
        description += 'Available operations:' + this.generateOperationList();
        //this.setDescription(description);
    }


    private generateOperationList(): string {
        const operations: string[] = [];

        for (const path in this.openApiSpec.paths) {
            for (const method in this.openApiSpec.paths[path]) {
                const operation = this.openApiSpec.paths[path][method];
                operations.push(`${operation.operationId} - ${operation.summary}`);
            }
        }

        return operations.join('\n');
    }

    async call(input: string): Promise<any> {
        const [operationId, ...args] = input.split(' ');
        const prompt = `The user has submitted the following input: ${input}
        Given an API specification, return a json object with the following structure:
        {
            "path": "string",
            "method": "string",
            // do not include this for GET requests
            "params": {
                "string": "string"
            }
        }
        API Specification: 
        ${JSON.stringify(this.openApiSpec, null, 2)}  
        Response:           
        `
        const system: ChatMessage = {
            "role": "system",
            "content": `You use APIs to solve problems. You can use the ${this.name} plugin to call the ${this.plugin.manifest.name_for_human} API.`
        }
        const message: ChatMessage = {
            "role": "user",
            "content": prompt
        }
        const res = await chatCompletion([message, system]);
        console.log(`Prompt: ${prompt}`)
        console.log(`Response from chatCompletion: ${res}`);
        const operationDetails = JSON.parse(res);
        const { path, method, params } = operationDetails;

        try {
            const response = await this.apiClient.request({
                method,
                url: path,
                ...params,
            });

            // Format the response as needed
            return JSON.stringify(response.data, null, 2);
        } catch (error) {
            console.error(`Error executing operation "${operationId}":`, error);
            throw error;
        }
    }

    private findOperationDetails(operationId: string): { path: string; method: string; params: any[] } | null {
        for (const path in this.openApiSpec.paths) {
            for (const method in this.openApiSpec.paths[path]) {
                const operation = this.openApiSpec.paths[path][method];
                if (operation.operationId === operationId) {
                    return { path, method, params: operation.parameters || [] };
                }
            }
        }
        return null;
    }

    private mapArgsToParams(args: string[], params: any[]): any {
        const result = {
            params: {},
            data: {},
            headers: {},
        };

        params.forEach((param, index) => {
            switch (param.in) {
                case 'query':
                    result.params[param.name] = args[index];
                    break;
                case 'header':
                    result.headers[param.name] = args[index];
                    break;
                case 'body':
                    result.data = JSON.parse(args[index]);
                    break;
            }
        });

        return result;
    }
}
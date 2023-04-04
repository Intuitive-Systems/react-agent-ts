import * as dotenv from 'dotenv';
dotenv.config({path: './.env.agent'});


/**
* Config file
*/
export const config: {
    environment: string, 
    openai_api_key: string,
    serp_api_key: string,
    retrieval_api_key: string,
    retrieval_api_url: string,
    server_port: number,
} = {
    environment: process.env.NODE_ENV ?? 'development',
    openai_api_key: process.env.OPENAI_API_KEY ?? '',
    serp_api_key: process.env.SERP_API_KEY ?? '',
    retrieval_api_key: process.env.RETRIEVAL_API_KEY ?? '',
    retrieval_api_url: process.env.RETRIEVAL_API_URL ?? '',
    server_port: parseInt(process.env.SERVER_PORT ?? '8000'),
}

if (config.environment === 'development') {
  console.log('Development environment');
}
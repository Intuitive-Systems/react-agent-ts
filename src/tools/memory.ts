import { BaseTool } from "./base";
import axios from "axios";

type QueryResponse = {
    results: Array<{
      query: string;
      results: Array<{
        id: string;
        text: string;
        metadata: {
          source?: string;
          source_id?: string;
          url?: string;
          created_at?: string;
          author?: string;
          document_id?: string;
        };
        embedding: number[];
        score: number;
      }>;
    }>;
  };

export class RetrieveMemory extends BaseTool {
  private apiUrl: string;
  private bearerToken: string;

  constructor(apiUrl: string, bearerToken: string) {
    super("RetrieveMemory", "This tool allows you to retrieve user responses and other information that you saved earlier.");
    this.apiUrl = apiUrl;
    this.bearerToken = bearerToken;
  }

  async call(query: string, top_k: number = 3): Promise<string> {
    //const formattedQueries = queries.map(query => ({ query, top_k }));
    const formattedQuery = {
      query: query,
      top_k: top_k,
      filter: {
        source: "chat"
      }
    }
    const payload = {
      queries: [formattedQuery]
    }
    const res = await axios.post<QueryResponse>(`${this.apiUrl}/query`, payload, {
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(`Error retrieving memories: ${res.statusText}`);
    }

    const results = res.data.results
      .flatMap(queryResult => queryResult.results.slice(0, top_k))
      .map(result => result.text)
      .join(' ');

    return results;
  }
}

type UpsertDocument = {
  text: string;
  id?: string;
  metadata?: {
    source?: string;
    source_id?: string;
    url?: string;
    created_at?: string;
    author?: string;
  };
};

type UpsertResponse = {
  document_ids: string[];
};

export class SaveMemory extends BaseTool {
  private apiUrl: string;
  private bearerToken: string;

  constructor(apiUrl: string, bearerToken: string) {
    super("SaveMemory", "This tool allows you to save user responses and other information for later retrieval.");
    this.apiUrl = apiUrl;
    this.bearerToken = bearerToken;
  }

  async call(input: string): Promise<any> {
    

    const document: UpsertDocument = {
      text: input,
      metadata: {
        source: 'chat',
      }
    };
    const payload = {
      documents: [document]
    }
    //console.log(`Saving document: ${JSON.stringify(document)}`)
    if (!this.bearerToken) {
      console.error('Bearer Token is not defined');
    }
    // console.log(`Token: ${this.bearerToken}`);
    
    if (!this.apiUrl) {
      console.error('API URL is not defined');
    }
    // console.log(`API URL: ${this.apiUrl}`);
    
    //console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
    
    try {
      const res = await axios.post(`${this.apiUrl}/upsert`, payload, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          ContentType: 'application/json'
        },
      });
    
      if (res.status !== 200) {
        throw new Error(`Error saving document: ${res.statusText}`);
      }
    
      return "Document saved successfully!";
    } catch (error) {
      console.error(error);
      console.error('Error during the request:', error.response.data);
      throw error;
    }
  }
}

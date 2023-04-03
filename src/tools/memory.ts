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

interface MemoryQuery {
  query: string;
  top_k: number;
  filter: {
    source: string;
    document_id?: string;
    source_id?: string;
    author?: string;
    start_date?: string;
    end_date?: string;
  };
}

export class SearchMemory extends BaseTool {
  private apiUrl: string;
  private bearerToken: string;

  constructor(apiUrl: string, bearerToken: string) {
    super("SearchMemory", "This tool allows you to search through your memory for semantically similar records with a Query. You format your arguments like this: RetrieveMemory[query, top_k].");
    this.apiUrl = apiUrl;
    this.bearerToken = bearerToken;
  }

  async call(input: string): Promise<any> {
    const [query, top_k] = input.split(',').map(arg => arg.trim());
    const formattedQuery: MemoryQuery = {
      query: query,
      top_k: parseInt(top_k),
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
      .flatMap(queryResult => queryResult.results.slice(0, parseInt(top_k)))
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

type DocumentResponse = {
  document_ids: string[];
};

export class RetrieveMemory extends BaseTool {
  private apiUrl: string;
  private bearerToken: string;

  constructor(apiUrl: string, bearerToken: string) {
    super("RetrieveMemory", "This tool allows you to retrieve one or more pieces of context from your memory for a given document ID. You format your arguments like this: RetrieveMemory[document_id, document_id, ...].");
    this.apiUrl = apiUrl;
    this.bearerToken = bearerToken;
  }

  async call(input: string): Promise<any> {
    const documentIds = input.split(',').map(arg => arg.trim());
    const queries = documentIds.map(documentId => {
      const query: MemoryQuery = {
        query: "",
        top_k: 1,
        filter: {
          source: "chat",
          document_id: documentId
        }
      }
      return query;
    });
    const payload = {
      queries: queries
    }

    console.log(`Querying for document IDs: ${JSON.stringify(documentIds)}`)
    if (!this.bearerToken) {
      console.error('Bearer Token is not defined');
    }
    console.log(`Token: ${this.bearerToken}`);

    if (!this.apiUrl) {
      console.error('API URL is not defined');
    }
    console.log(`API URL: ${this.apiUrl}`);
    console.log(`Payload: ${JSON.stringify(payload)}`);

    try {
      const res = await axios.post<QueryResponse>(`${this.apiUrl}/query`, payload, {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      });

      if (res.status !== 200) {
        throw new Error(`Error retrieving memories: ${res.statusText}`);
      }

      const results = res.data.results
        .flatMap(queryResult => queryResult.results)
        .map(result => {
          return `Memory ID: ${result.metadata.document_id} \n ${result.text} \n\n`
        })
        .join(' ');
      return results;
    } catch (error) {
      console.error(`Error retrieving memories: ${error}`);
    }
  }
}
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
    console.log(`Saving document: ${JSON.stringify(document)}`)
    if (!this.bearerToken) {
      console.error('Bearer Token is not defined');
    }
    console.log(`Token: ${this.bearerToken}`);
    
    if (!this.apiUrl) {
      console.error('API URL is not defined');
    }
    console.log(`API URL: ${this.apiUrl}`);
    
    console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
    
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
    
      return `Document saved successfully, memory address: ${res.data.document_ids[0]}`;
    } catch (error) {
      console.error(error);
      console.error('Error during the request:', error.response.data);
      throw error;
    }
  }
}

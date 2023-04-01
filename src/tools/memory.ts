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

  async call(query: string, top_k: number = 3): Promise<any> {
    //const formattedQueries = queries.map(query => ({ query, top_k }));
    const formattedQuery = {
      query: query,
      top_k: top_k
    }
    const res = await axios.post<QueryResponse>(`${this.apiUrl}/query`, [formattedQuery], {
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
    super("SaveMemory", "Save text and metadata to the vector database using the /upsert endpoint.");
    this.apiUrl = apiUrl;
    this.bearerToken = bearerToken;
  }

  async call(spaceDelimitedString: string): Promise<any> {
    const [text, id, source, source_id, url, created_at, author] = spaceDelimitedString.split(' ');

    const document: UpsertDocument = {
      text,
      ...(id && { id }),
      metadata: {
        ...(source && { source }),
        ...(source_id && { source_id }),
        ...(url && { url }),
        ...(created_at && { created_at }),
        ...(author && { author }),
      },
    };

    const res = await axios.post<UpsertResponse>(`${this.apiUrl}/upsert`, [document], {
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(`Error saving document: ${res.statusText}`);
    }

    return res.data.document_ids[0];
  }
}

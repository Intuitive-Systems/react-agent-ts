import { getJson, GoogleParameters } from "serpapi";
import { BaseTool } from "./base"; // Assuming the abstract class is in the same directory

export class SerpAPI extends BaseTool {
  protected params: Partial<GoogleParameters>;

  constructor(
    apiKey: string,
    params: Partial<GoogleParameters> = {
      location: "United States",
    }
  ) {
    super("SearchWeb", "a search engine. useful for when you need to answer questions about current events. input should be a search query.");
    this.params = { ...params, api_key: apiKey };
  }

  async call(input: string): Promise<any> {
    const res = await getJson("google", {
      ...this.params,
      q: input,
    });

    if (res.error) {
      throw new Error(`Got error from serpAPI: ${res.error}`);
    }

    if (res.answer_box?.answer) {
      return res.answer_box.answer;
    }

    if (res.answer_box?.snippet) {
      return res.answer_box.snippet;
    }

    if (res.answer_box?.snippet_highlighted_words) {
      return res.answer_box.snippet_highlighted_words[0];
    }

    if (res.sports_results?.game_spotlight) {
      return res.sports_results.game_spotlight;
    }

    if (res.knowledge_graph?.description) {
      return res.knowledge_graph.description;
    }

    if (res.organic_results?.[0]?.snippet) {
      return res.organic_results[0].snippet;
    }

    return "No good search result found";
  }
}

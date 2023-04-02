import axios from "axios";
import cheerio from "cheerio";
import { BaseTool } from "./base"; // Assuming the abstract class is in the same directory

export class GetWebpage extends BaseTool {
  constructor() {
    super(
      "GetWebpage",
      "A tool for fetching the contents of a single webpage. It fetches the web page content and returns the text. Input should be a URL."
    );
  }

  async call(input: string): Promise<string> {
    try {
        const response = await axios.get(input);
        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const textContent = $("body").text();
        
        // Clean up the text content
        const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const cleanedText = lines.join('\n');
        
        return cleanedText;
    } catch (error) {
        throw new Error(`Error while fetching and parsing web page: ${error.message}`);
    }
  }
}
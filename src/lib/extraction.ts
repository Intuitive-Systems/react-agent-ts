import * as retry from "async-retry"
import { openaiCompletion } from "./llm"


const extractJSONTpl = `Given this data and a typescript type, return a valid, stringified JSON Object representing an instance of the type.
Make sure the response is JUST the object. Not a variable or anything else.
Example:

Data: Hey my name is Colin.
Type:
{
  name: string
}
Stringified JSON:
{
  "name": "John",
}

---

Notes:
- undefined and null are not valid json fields, instead, just leave out the field.
- convert date information to stringified iso date format for dates.
- optional, undefined or nullable fields in the response mean that you can skip them OR you can add them depending on the data.

---
 
Okay, here's the Data and the Type:
Data:
{{data}}

Type:
{{type}}

Stringified JSON:
`
const jsonFixerTpl = `The following is supposed to be a JSON object which is not parsing correctly.
Ensure the data is a valid JSON object or array.
Note: if there are newlines in strings in the object, they must be replaced with \n
Return the updated JSON object.

Input Data:
{{json}}
Required Type:
{{type}}
Response:
`

export async function extractJson<T>(text: string, type: string) {
    let genJson = ""
    const json = await retry(
      async () => {
        // console.log(`Extracting JSON from: ${text} with type: ${type}`)
        const jsonPrompt = extractJSONTpl.replace("{{data}}", text).replace("{{type}}", type)
        genJson = await openaiCompletion(jsonPrompt, 2500, 0.15)
        const json = JSON.parse(genJson) as T
        
        return json
      },
      {
        retries: 3,
        factor: 4,
        minTimeout: 1000,
        onRetry: (error: any) => {
          // fix json and return it 
          //console.log(`Error: ${error} while extracting JSON from: ${text} with type: ${type} and generated JSON: ${genJson} `)
          const fixJson = jsonFixerTpl.replace("{{json}}", genJson).replace("{{type}}", type)
          const fixedJson = openaiCompletion(fixJson, 2500)
          return fixedJson
        }
      }
    )
    return json
  }
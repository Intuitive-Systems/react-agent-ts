import { GPT4All } from 'gpt4all';

const main = async () => {
    // Instantiate GPT4All with default or custom settings
    const gpt4all = new GPT4All('gpt4all-lora-unfiltered-quantized', true); // Default is 'gpt4all-lora-quantized' model
  
    // Initialize and download missing files
    await gpt4all.init();

    // Open the connection with the model
    await gpt4all.open();
    // Generate a response using a prompt
    const prompt = 'Tell me about how Open Access to AI is going to help humanity.';
    const response = await gpt4all.prompt(prompt);
    console.log(`Prompt: ${prompt}`);
    console.log(`Response: ${response}`);
  
    const prompt2 = 'Explain to a five year old why AI is nothing to be afraid of.';
    const response2 = await gpt4all.prompt(prompt2);
    console.log(`Prompt: ${prompt2}`);
    console.log(`Response: ${response2}`);
  
    // Close the connection when you're done
    gpt4all.close();
}
  
  main().catch(console.error);
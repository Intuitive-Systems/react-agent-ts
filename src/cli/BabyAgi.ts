// babyagi-cli.ts
import * as arg from 'arg';
import { BabyAgi } from '../agents/BabyAgi';

// Define accepted CLI arguments and their aliases
const argSpec = {
  '--objective': String,
  '--first-task': String,
  '-o': '--objective',
  '-f': '--first-task',
};

// Parse arguments
const args = arg(argSpec, { argv: process.argv.slice(2), permissive: false });

// Set default values for the arguments if not provided
const objective = args['--objective'] || 'I want to acquire as many water balloons filled with Jello as possible, I am starting with $100.';
const firstTask = args['--first-task'] || 'Its probably a good idea to figure out where to store a bunch of water balloons filled with Jello...';

console.log("Welcome to the BabyAgi CLI.");
console.log();

console.log(`Using objective: ${objective}`);
console.log(`Using first task: ${firstTask}`);

const babyAgi = new BabyAgi(objective);

console.log("Starting BabyAgi. Kill it with Ctrl+C.");
try {
  // This begins an infinite loop until the BabyAgi instance is done
  // (it might never be done)
  babyAgi.addMessage(firstTask);
} catch (error) {
  console.error("Error:", error);
}
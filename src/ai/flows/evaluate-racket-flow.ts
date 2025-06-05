
'use server';
/**
 * @fileOverview A Racket code evaluation AI agent.
 *
 * - evaluateRacket - A function that handles the Racket code evaluation process.
 * Returns the string result of the evaluation or an error message.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateRacketInputSchema = z.object({
  racketCode: z.string().describe('The Racket code to evaluate.'),
});
export type EvaluateRacketInput = z.infer<typeof EvaluateRacketInputSchema>;

// The output is now just a string.
const EvaluateRacketOutputSchema = z.string().describe(
  "The direct string result of the Racket code evaluation. " +
  "If successful, this is the resulting value (e.g., \"3\", \"'a\", \"'(2)\"). " +
  "If it's a definition, it's a confirmation (e.g., \"x defined\"). " +
  "If an error occurs, the string should start with 'Error:' followed by a message (e.g., \"Error: division by zero\")."
);
export type EvaluateRacketOutput = z.infer<typeof EvaluateRacketOutputSchema>;


export async function evaluateRacket(input: EvaluateRacketInput): Promise<EvaluateRacketOutput> {
  return evaluateRacketFlow(input);
}

const racketEvaluationPrompt = ai.definePrompt({
  name: 'racketEvaluationPrompt',
  input: {schema: EvaluateRacketInputSchema},
  output: {schema: EvaluateRacketOutputSchema}, // Output schema is now just a string
  prompt: `You are a Racket programming language interpreter.
Your task is to evaluate the provided Racket code and return ONLY the resulting string.

Racket Code to Evaluate:
\`\`\`racket
{{{racketCode}}}
\`\`\`

Follow these rules for the output string:
1. If the code evaluates successfully to a value, provide that value as a string (e.g., "3", "'a", "'(2)").
2. If the code is a definition (e.g., (define x 10)), the string should be a short confirmation (e.g., "x defined", "my-func defined").
3. If the code results in an error during evaluation (e.g., division by zero, unbound variable), the string should start with "Error:" followed by a concise error message (e.g., "Error: division by zero", "Error: expected number, got boolean").
4. If the code is syntactically incorrect in a way that prevents evaluation, the string should start with "Error:" followed by a description of the syntax error.
5. Ensure the output is ONLY the resulting string. Do not include any markdown, backticks, JSON, or other formatting around the string.

Example Scenarios:
- Input: "(+ 1 2)" -> Output: "3"
- Input: "(define my-var 42)" -> Output: "my-var defined"
- Input: "(first '(a b c))" -> Output: "'a"
- Input: "(+ 1 #t)" -> Output: "Error: expected number, got boolean"
- Input: "(define x (list 1 2 3))\n(filter even? x)" -> Output: "'(2)"
- Input: "(this-is-not-defined)" -> Output: "Error: this-is-not-defined: unbound identifier"

Provide ONLY the string output.
`,
  config: {
    safetySettings: [{category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'}]
  }
});

const evaluateRacketFlow = ai.defineFlow(
  {
    name: 'evaluateRacketFlow',
    inputSchema: EvaluateRacketInputSchema,
    outputSchema: EvaluateRacketOutputSchema, // Output schema is string
  },
  async (input: EvaluateRacketInput): Promise<EvaluateRacketOutput> => {
    if (!input.racketCode.trim()) {
      return "// Expression is empty"; // Return as a string
    }
    
    try {
      // The prompt now directly returns a string (or should)
      const {output} = await racketEvaluationPrompt(input); 
      
      if (output === null || output === undefined) {
          // This case handles if the LLM returns nothing
          return "Error: AI evaluation did not produce an output.";
      }
      // The output is expected to be a string directly.
      // If the LLM still wraps it in JSON (e.g. {"output": "the string"}), 
      // then the schema validation would fail, and it would throw earlier or 'output' would be an object.
      // Assuming 'output' is now the string based on the updated output schema.
      return output; 
    } catch (error) {
      console.error("Error during racketEvaluationPrompt execution or output validation:", error);
      return "Error: Could not communicate with AI model for evaluation or AI output was not a valid string.";
    }
  }
);

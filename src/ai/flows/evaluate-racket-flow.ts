
'use server';
/**
 * @fileOverview A Racket code evaluation AI agent.
 *
 * - evaluateRacket - A function that handles the Racket code evaluation process.
 * - EvaluateRacketInput - The input type for the evaluateRacket function.
 * - EvaluateRacketOutput - The return type for the evaluateRacket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateRacketInputSchema = z.object({
  racketCode: z.string().describe('The Racket code to evaluate.'),
});
export type EvaluateRacketInput = z.infer<typeof EvaluateRacketInputSchema>;

const EvaluateRacketOutputSchema = z.object({
  evaluationResult: z.string().describe('The result of the Racket code evaluation, or an error message if evaluation failed. If the code is a definition, it should indicate the definition was successful (e.g., "x defined").'),
  evaluationSuccess: z.boolean().describe('Whether the Racket code evaluation was successful or resulted in an error.')
});
export type EvaluateRacketOutput = z.infer<typeof EvaluateRacketOutputSchema>;

export async function evaluateRacket(input: EvaluateRacketInput): Promise<EvaluateRacketOutput> {
  return evaluateRacketFlow(input);
}

const racketEvaluationPrompt = ai.definePrompt({
  name: 'racketEvaluationPrompt',
  input: {schema: EvaluateRacketInputSchema},
  output: {schema: EvaluateRacketOutputSchema},
  prompt: `You are a Racket programming language interpreter.
Your task is to evaluate the provided Racket code.

Racket Code to Evaluate:
\`\`\`racket
{{{racketCode}}}
\`\`\`

Follow these rules for the output:
1. If the code evaluates successfully to a value, provide that value as 'evaluationResult'. Set 'evaluationSuccess' to true.
2. If the code is a definition (e.g., (define x 10)), 'evaluationResult' should be a short confirmation like "x defined" or "my-func defined". Set 'evaluationSuccess' to true.
3. If the code results in an error during evaluation (e.g., division by zero, unbound variable), 'evaluationResult' should be a concise error message (e.g., "Error: division by zero"). Set 'evaluationSuccess' to false.
4. If the code is syntactically incorrect in a way that prevents evaluation (though basic syntax should be pre-checked), 'evaluationResult' should describe the syntax error. Set 'evaluationSuccess' to false.
5. Ensure the output strictly adheres to the JSON schema provided for 'EvaluateRacketOutputSchema'. Do not include any markdown, backticks, or other formatting around the JSON.

Example Scenarios:
- Input: "(+ 1 2)" -> Output: { "evaluationResult": "3", "evaluationSuccess": true }
- Input: "(define my-var 42)" -> Output: { "evaluationResult": "my-var defined", "evaluationSuccess": true }
- Input: "(first '(a b c))" -> Output: { "evaluationResult": "'a", "evaluationSuccess": true }
- Input: "(+ 1 #t)" -> Output: { "evaluationResult": "Error: expected number, got boolean", "evaluationSuccess": false }
- Input: "(define x (list 1 2 3))\n(filter even? x)" -> Output: { "evaluationResult": "'(2)", "evaluationSuccess": true }
- Input: "(this-is-not-defined)" -> Output: { "evaluationResult": "Error: this-is-not-defined: unbound identifier", "evaluationSuccess": false }

Provide ONLY the JSON output.
`,
});

const evaluateRacketFlow = ai.defineFlow(
  {
    name: 'evaluateRacketFlow',
    inputSchema: EvaluateRacketInputSchema,
    outputSchema: EvaluateRacketOutputSchema,
  },
  async (input: EvaluateRacketInput) => {
    if (!input.racketCode.trim()) {
      return { evaluationResult: "// Expression is empty", evaluationSuccess: true };
    }
    // Potentially adjust safety settings if needed, but start with defaults.
    // config: { safetySettings: [{category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'}] }
    const {output} = await racketEvaluationPrompt(input);
    
    if (!output) {
        return { evaluationResult: "// AI evaluation did not produce a structured output.", evaluationSuccess: false };
    }
    return output;
  }
);

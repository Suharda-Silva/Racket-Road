
'use server';

import type { PillSpec } from '@/types';
import { PILL_SPECS } from '@/config/pills';
import { evaluateRacket, type EvaluateRacketOutput } from '@/ai/flows/evaluate-racket-flow';
import { generateRacketCode } from '@/components/racket-road/LiveCodeView';

interface SyntaxCheckResult {
  isValid: boolean;
  message: string;
  errorLineIndex?: number | null;
  simulatedEvaluation?: string | null;
}

const findPillSpecByLabel = (label: string): PillSpec | undefined => {
  return PILL_SPECS.find(spec => spec.label === label);
};

function tokenize(line: string): string[] {
    const tokens: string[] = [];
    let currentToken = "";
    let inString = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inString = !inString;
            currentToken += char;
            if (!inString || i === line.length - 1) {
                if (currentToken) tokens.push(currentToken);
                currentToken = "";
            }
        } else if (inString) {
            currentToken += char;
        } else if (char === '(' || char === ')') {
            if (currentToken.trim() !== "") {
                tokens.push(currentToken.trim());
                currentToken = "";
            }
            tokens.push(char);
        } else if (/\s/.test(char)) {
            if (currentToken.trim() !== "") {
                tokens.push(currentToken.trim());
                currentToken = "";
            }
        } else {
            currentToken += char;
        }
    }
    if (currentToken.trim() !== "") {
        tokens.push(currentToken.trim());
    }
    return tokens;
}

async function evaluateWithOneCompiler(racketCode: string): Promise<string> {
  const apiUrl = "https://onecompiler.com/api/code/exec";
  const staticId = "43kvxnj68"; // Use the specified static ID

  const payload = {
    _id: staticId, // Use static ID
    type: "code",
    title: staticId, // Use static ID
    visibility: "public",
    properties: {
      language: "racket",
      files: [
        {
          name: "main.rkt", 
          content: `#lang racket/base\n${racketCode}`,
        },
      ],
      stdin: null,
    },
    user: { _id: null },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return `Error: OneCompiler API request failed - ${response.status} ${response.statusText}. Details: ${errorText}`;
    }

    const data = await response.json();

    if (data.stdout && !data.stderr && !data.exception) {
      return data.stdout.trim() || "// OneCompiler: No output";
    } else {
      let errorOutput = "OneCompiler Evaluation Error: ";
      if (data.stderr) errorOutput += data.stderr.trim();
      if (data.exception) errorOutput += (data.stderr ? "\n" : "") + (typeof data.exception === 'string' ? data.exception.trim() : JSON.stringify(data.exception));
      if (!data.stderr && !data.exception && !data.stdout) errorOutput += "Unknown error or no output from OneCompiler.";
      else if (!data.stderr && !data.exception && data.stdout) return data.stdout.trim(); // Handle case where stdout might exist with other null fields
      return `Error: ${errorOutput}`;
    }
  } catch (error) {
    console.error("Error calling OneCompiler API:", error);
    return `Error: Could not connect to OneCompiler API. ${error instanceof Error ? error.message : String(error)}`;
  }
}


export async function checkSyntaxAction(code: string): Promise<SyntaxCheckResult> {
  const lines = code.split('\n');
  const originalLinesForContext = code.split('\n');

  if (lines.every(line => line.trim() === '')) {
    return { isValid: true, message: "Expression is empty.", simulatedEvaluation: "// Expression is empty" };
  }

  let globalParenBalance = 0;
  let globalErrorLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    for (const char of lines[i]) {
      if (char === '(') globalParenBalance++;
      if (char === ')') globalParenBalance--;
      if (globalParenBalance < 0) {
        globalErrorLineIndex = i;
        break;
      }
    }
    if (globalErrorLineIndex !== -1) break;
  }

  if (globalParenBalance < 0) {
    return {
      isValid: false,
      message: `Syntax Error: Unmatched closing parenthesis on or before line ${globalErrorLineIndex + 1}. Check: ${originalLinesForContext[globalErrorLineIndex]}`,
      errorLineIndex: globalErrorLineIndex,
      simulatedEvaluation: null
    };
  }
  if (globalParenBalance > 0) {
    let lastOpenParenLine = -1;
    for(let i = lines.length - 1; i >=0; i--) {
        if(lines[i].includes('(')) {
            lastOpenParenLine = i;
            break;
        }
    }
    return {
      isValid: false,
      message: `Syntax Error: Unmatched opening parenthesis. Possible issue around line ${lastOpenParenLine !== -1 ? lastOpenParenLine + 1 : lines.length}.`,
      errorLineIndex: lastOpenParenLine !== -1 ? lastOpenParenLine : lines.length -1,
      simulatedEvaluation: null
    };
  }

  for (let i = 0; i < lines.length; i++) {
    const lineStr = lines[i].trim();
    if (lineStr === '' || lineStr === '()') continue;

    const tokens = tokenize(lineStr);
    if (tokens.length === 0) continue;

    const isLikelyAtom = tokens.length === 1 && !tokens[0].includes('(') && !tokens[0].includes(')');
    if (isLikelyAtom) {
        const atomToken = tokens[0];
        if (/^\d+(\.\d+)?$/.test(atomToken)) { /* valid atom */ }
        else if (/^".*"$/.test(atomToken)) { /* valid atom */ }
        else if (/^[a-zA-Z_?!+\-*\/<>=#][\w?!+\-*\/<>=.#:]*$/.test(atomToken) && !/^\d/.test(atomToken)) { /* valid variable/symbol */ }
        else if (atomToken === '#t' || atomToken === '#f' || atomToken === '#true' || atomToken === '#false') { /* valid atom */ }
        else {
          // Potentially invalid atom if it doesn't match known forms and isn't quoted, etc.
        }
        continue;
    }

    if (tokens[0] !== '(') {
      return { isValid: false, message: `Syntax Error on line ${i + 1}: Expected expression to start with '('. Found: '${tokens[0]}...'`, errorLineIndex: i, simulatedEvaluation: null };
    }
    if (tokens[tokens.length - 1] !== ')') {
      return { isValid: false, message: `Syntax Error on line ${i + 1}: Expected expression to end with ')'. Line: ${originalLinesForContext[i]}`, errorLineIndex: i, simulatedEvaluation: null };
    }

    const sExprTokens = tokens.slice(1, -1);
    if (sExprTokens.length === 0) {
        continue; 
    }

    const head = sExprTokens[0];
    const args = sExprTokens.slice(1);

    if (/^\d+(\.\d+)?$/.test(head) || (/^".*"$/.test(head) && head !== '""') ) {
      if (sExprTokens.length > 1) {
         return { isValid: false, message: `Syntax Error on line ${i + 1}: Operator/function expected. Found value '${head}' at the start of an expression.`, errorLineIndex: i, simulatedEvaluation: null };
      }
    }

    const spec = findPillSpecByLabel(head);

    if (spec) {
      if (spec.expects) {
        const minExpectedArgs = spec.expects.length;

        if (head === 'define') {
          if (args.length < 1) {
            return { isValid: false, message: `Syntax Error on line ${i + 1}: 'define' needs at least a name and a value/body. Example: (define x 10).`, errorLineIndex: i, simulatedEvaluation: null };
          }
          const varOrFuncName = args[0];
          if (varOrFuncName.startsWith('(') && varOrFuncName.endsWith(')')) {
            const funcDefTokens = tokenize(varOrFuncName);
            if (funcDefTokens.length < 2 || funcDefTokens[0] !== '(' || funcDefTokens[funcDefTokens.length-1] !== ')') {
                 return { isValid: false, message: `Syntax Error on line ${i + 1}: Malformed function definition in 'define'. Expected (define (func-name args...) body).`, errorLineIndex: i, simulatedEvaluation: null };
            }
            if (args.length < 2) {
                 return { isValid: false, message: `Syntax Error on line ${i + 1}: Function definition in 'define' is missing a body.`, errorLineIndex: i, simulatedEvaluation: null };
            }
          } else {
             if (args.length < 2) {
                return { isValid: false, message: `Syntax Error on line ${i + 1}: 'define' expects a variable and a value. Example: (define x 10).`, errorLineIndex: i, simulatedEvaluation: null };
             }
             if (!/^[a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*$/.test(varOrFuncName) || /^\d/.test(varOrFuncName)) {
                return { isValid: false, message: `Syntax Error on line ${i + 1}: Invalid variable name '${varOrFuncName}' in define.`, errorLineIndex: i, simulatedEvaluation: null };
             }
          }
        } else if (head === 'list' || head === '+' || head === '-' || head === '=') {
          // Variadic or zero-arg handling for these specific functions
        } else if (args.length < minExpectedArgs) {
           return { isValid: false, message: `Syntax Error on line ${i + 1}: Not enough arguments for '${head}'. Expected ${minExpectedArgs}, got ${args.length}.`, errorLineIndex: i, simulatedEvaluation: null };
        }
      }
    }
  }

  // If all local syntax checks passed, proceed to AI evaluation or OneCompiler
  let evaluationAttemptResult: EvaluateRacketOutput;
  let evaluationSource = "AI";

  try {
    evaluationAttemptResult = await evaluateRacket({ racketCode: code });

    const aiNonAnswers = [
      "Error: AI evaluation did not produce an output.",
      "Error: Could not communicate with AI model for evaluation or AI output was not a valid string.",
      "Error: AI did not produce a parsable JSON", // if the old error message still somehow slips through
      "Error: No evaluation result was provided by the AI.",
      "// No output or evaluation from AI.",
    ];

    // Check if the AI's response is empty, a non-answer, or an error explicitly from the AI itself (starts with "Error:")
    // but allow actual Racket errors like "Error: division by zero" to be considered a valid AI attempt.
    let aiFailedToEvaluate = aiNonAnswers.includes(evaluationAttemptResult) || 
                             evaluationAttemptResult.trim() === "" ||
                             evaluationAttemptResult === "Error: AI evaluation did not produce an output." || // More specific checks
                             evaluationAttemptResult === "Error: Could not communicate with AI model for evaluation or AI output was not a valid string.";


    if (aiFailedToEvaluate) {
      evaluationSource = "OneCompiler";
      evaluationAttemptResult = await evaluateWithOneCompiler(code);
    }

  } catch (e) {
    console.error("Error during initial evaluation attempt (AI):", e);
    evaluationSource = "OneCompiler"; 
    evaluationAttemptResult = await evaluateWithOneCompiler(code);
  }

  const isEvaluationValid = !evaluationAttemptResult.startsWith("Error:");
  let finalMessage = evaluationAttemptResult;

  if (isEvaluationValid && evaluationAttemptResult === "// Expression is empty") {
    finalMessage = "Expression is empty.";
  } else if (isEvaluationValid && evaluationAttemptResult === "// OneCompiler: No output") {
    finalMessage = `${evaluationSource} Check: No output produced.`;
  } else if (isEvaluationValid) {
    finalMessage = `${evaluationSource} Check: ${evaluationAttemptResult}`;
  } else { 
    // If it starts with "Error:", it could be a Racket error or an API error
    finalMessage = `${evaluationSource} Check: ${evaluationAttemptResult}`; 
  }

  return {
    isValid: isEvaluationValid,
    message: finalMessage,
    simulatedEvaluation: evaluationAttemptResult,
    errorLineIndex: null 
  };
}


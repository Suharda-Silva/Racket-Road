
'use server';

import type { PillSpec } from '@/types';
import { PILL_SPECS } from '@/config/pills';
import { evaluateRacket } from '@/ai/flows/evaluate-racket-flow';

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
        else if (/^[a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*$/.test(atomToken)) { /* valid atom */ } 
        else if (atomToken === '#t' || atomToken === '#f' || atomToken === '#true' || atomToken === '#false') { /* valid atom */ }
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
          // Variadic or zero-arg handling
        } else if (args.length < minExpectedArgs) {
           return { isValid: false, message: `Syntax Error on line ${i + 1}: Not enough arguments for '${head}'. Expected ${minExpectedArgs}, got ${args.length}.`, errorLineIndex: i, simulatedEvaluation: null };
        }
      }
    }
  }
  
  // If all local syntax checks passed, proceed to AI evaluation
  try {
    const aiResponse = await evaluateRacket({ racketCode: code });
    
    // The AI might still say the syntax is bad (evaluationSuccess: false) even if local checks pass.
    // We can use AI's success flag to potentially override local `isValid`, or just use its message.
    // For now, let's prioritize AI's evaluation for the `simulatedEvaluation` string.
    // If AI reports an evaluation error, it's often more insightful than a generic "syntax plausible".
    
    let finalMessage = "Syntax appears plausible.";
    if (aiResponse.evaluationSuccess) {
        finalMessage = "AI Check: Code evaluated successfully.";
    } else {
        // If AI says evaluation failed, it's likely an evaluation error or a more subtle syntax error.
        finalMessage = `AI Check: ${aiResponse.evaluationResult}`; // Show AI's error/reason.
    }

    return { 
      isValid: aiResponse.evaluationSuccess, // Let AI's success dictate overall validity for now
      message: finalMessage, 
      simulatedEvaluation: aiResponse.evaluationResult,
      errorLineIndex: null // AI doesn't reliably give line numbers for evaluation errors
    };

  } catch (e) {
    console.error("Error calling AI evaluation flow:", e);
    return {
      isValid: false, // Indicate failure if AI call itself fails
      message: "AI Evaluation Error: Could not get simulated output. Syntax might still be plausible based on local checks.",
      simulatedEvaluation: "// AI evaluation service failed.",
      errorLineIndex: null
    };
  }
}

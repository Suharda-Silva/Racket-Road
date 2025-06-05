
'use server';

import type { PillSpec } from '@/types';
import { PILL_SPECS } from '@/config/pills';

interface SyntaxCheckResult {
  isValid: boolean;
  message: string;
  errorLineIndex?: number | null;
  simulatedEvaluation?: string | null; 
}

const findPillSpecByLabel = (label: string): PillSpec | undefined => {
  return PILL_SPECS.find(spec => spec.label === label);
};

// Basic tokenizer: splits by space, handles strings, keeps parens as separate tokens.
function tokenize(line: string): string[] {
    const tokens: string[] = [];
    let currentToken = "";
    let inString = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inString = !inString;
            currentToken += char;
            if (!inString || i === line.length - 1) { // End of string or end of line
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
  await new Promise(resolve => setTimeout(resolve, 300)); 

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
      errorLineIndex: globalErrorLineIndex
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
      errorLineIndex: lastOpenParenLine !== -1 ? lastOpenParenLine : lines.length -1 
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
      return { isValid: false, message: `Syntax Error on line ${i + 1}: Expected expression to start with '('. Found: '${tokens[0]}...'`, errorLineIndex: i };
    }
    if (tokens[tokens.length - 1] !== ')') {
      return { isValid: false, message: `Syntax Error on line ${i + 1}: Expected expression to end with ')'. Line: ${originalLinesForContext[i]}`, errorLineIndex: i };
    }

    const sExprTokens = tokens.slice(1, -1); 
    if (sExprTokens.length === 0) { 
        continue;
    }

    const head = sExprTokens[0];
    const args = sExprTokens.slice(1);

    if (/^\d+(\.\d+)?$/.test(head) || (/^".*"$/.test(head) && head !== '""') ) {
      if (sExprTokens.length > 1) {
         return { isValid: false, message: `Syntax Error on line ${i + 1}: Operator/function expected. Found value '${head}' at the start of an expression.`, errorLineIndex: i };
      }
    }
    
    const spec = findPillSpecByLabel(head);

    if (spec) {
      if (spec.expects) {
        const minExpectedArgs = spec.expects.length; 
        
        if (head === 'define') {
          if (args.length < 1) { 
            return { isValid: false, message: `Syntax Error on line ${i + 1}: 'define' needs at least a name and a value/body. Example: (define x 10).`, errorLineIndex: i };
          }
          const varOrFuncName = args[0];
          if (varOrFuncName.startsWith('(') && varOrFuncName.endsWith(')')) { 
            const funcDefTokens = tokenize(varOrFuncName);
            if (funcDefTokens.length < 2 || funcDefTokens[0] !== '(' || funcDefTokens[funcDefTokens.length-1] !== ')') { 
                 return { isValid: false, message: `Syntax Error on line ${i + 1}: Malformed function definition in 'define'. Expected (define (func-name args...) body).`, errorLineIndex: i };
            }
            if (args.length < 2) { 
                 return { isValid: false, message: `Syntax Error on line ${i + 1}: Function definition in 'define' is missing a body.`, errorLineIndex: i };
            }
          } else { 
             if (args.length < 2) {
                return { isValid: false, message: `Syntax Error on line ${i + 1}: 'define' expects a variable and a value. Example: (define x 10).`, errorLineIndex: i };
             }
             if (!/^[a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*$/.test(varOrFuncName) || /^\d/.test(varOrFuncName)) {
                return { isValid: false, message: `Syntax Error on line ${i + 1}: Invalid variable name '${varOrFuncName}' in define.`, errorLineIndex: i };
             }
          }
        } else if (head === 'list' || head === '+' || head === '-' || head === '=') {
          if ((head === '+' || head === '-' || head === '=') && args.length === 0 && spec.expects.length > 0) {
             // These can be called with zero arguments in some contexts, but our pills expect some by default.
             // For strictness, one could enforce args.length >= 1 if spec.expects implies it.
             // For now, this is a soft check.
          }
        } else if (args.length < minExpectedArgs) {
           return { isValid: false, message: `Syntax Error on line ${i + 1}: Not enough arguments for '${head}'. Expected ${minExpectedArgs}, got ${args.length}.`, errorLineIndex: i };
        }
      }
    } else {
      // Unknown function/operator. Could be user-defined. Heuristic check for symbol-like name.
      if (!/^[a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*$/.test(head) && !head.startsWith("'") && head !== "...") {
        // It's not a typical symbol. Could be an error or advanced Racket.
        // For this tool, we might flag it if it's not a quoted list or a known construct.
        // But for now, we'll be lenient on unknown heads if they look like symbols.
      }
    }
  }
  
  // If all checks passed, determine simulated evaluation
  const nonEmptyContentLines = originalLinesForContext.filter(line => line.trim() !== '');
  let determinedSimulatedEvaluation: string | null;

  if (nonEmptyContentLines.length === 0) {
    // This case is handled by the early return for empty code.
    // If somehow reached, this is a fallback.
    determinedSimulatedEvaluation = "// Expression is empty";
  } else if (nonEmptyContentLines.length === 1) {
    const singleLineTrimmed = nonEmptyContentLines[0].trim();
    if (singleLineTrimmed === "(+ 1 2)") {
      determinedSimulatedEvaluation = "3";
    } else if (singleLineTrimmed === "(list 1 2 3)") {
      determinedSimulatedEvaluation = "'(1 2 3)";
    } else if (singleLineTrimmed === "(define x 10)") {
      determinedSimulatedEvaluation = "// x defined";
    } else if (singleLineTrimmed.match(/^\(define\s+([a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*)\s+(.*)\)$/)) {
      const match = singleLineTrimmed.match(/^\(define\s+([a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*)\s+(.*)\)$/);
      determinedSimulatedEvaluation = `// ${match?.[1]} defined`;
    } else if (/^\([\w?!+\-*\/<>=.]+(\s+[\w".?!+\-*\/<>=]+)*\)$/.test(singleLineTrimmed)) { // any other s-expr
      determinedSimulatedEvaluation = "Value from expression. (Simulated)";
    } else if (!singleLineTrimmed.includes('(') && !singleLineTrimmed.includes(')') && singleLineTrimmed.length > 0) { // atom
      determinedSimulatedEvaluation = singleLineTrimmed; // Echo atom
    } else {
      // For example, if the line is just '()' or something that passed validation but isn't a typical expression.
      determinedSimulatedEvaluation = "Expression valid. (Simulated output)";
    }
  } else { // Multiple non-empty lines
    determinedSimulatedEvaluation = "Final result of evaluation. (Simulated)";
  }

  return { 
    isValid: true, 
    message: "AI Check: Syntax appears plausible (enhanced heuristics).", 
    simulatedEvaluation: determinedSimulatedEvaluation 
  };
}

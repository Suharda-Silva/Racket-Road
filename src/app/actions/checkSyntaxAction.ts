
'use server';

import type { PillSpec } from '@/types';
import { PILL_SPECS } from '@/config/pills';

interface SyntaxCheckResult {
  isValid: boolean;
  message: string;
  errorLineIndex?: number | null; 
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
    return { isValid: true, message: "Expression is empty." };
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

    // Atoms (numbers, strings, symbols not in a list) are generally valid on their own
    const isLikelyAtom = tokens.length === 1 && !tokens[0].includes('(') && !tokens[0].includes(')');
    if (isLikelyAtom) {
        const atomToken = tokens[0];
        if (/^\d+(\.\d+)?$/.test(atomToken)) { // Number
            /* valid atom */
        } else if (/^".*"$/.test(atomToken)) { // String
            /* valid atom */
        } else if (/^[a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*$/.test(atomToken)) { // Symbol/Variable
            /* valid atom */
        } else if (atomToken === '#t' || atomToken === '#f' || atomToken === '#true' || atomToken === '#false') { // Booleans
            /* valid atom */
        } else {
            // return { isValid: false, message: `Syntax Error on line ${i + 1}: Invalid standalone token '${atomToken}'.`, errorLineIndex: i };
        }
        continue; // Assume valid atom for now
    }
    
    if (tokens[0] !== '(') {
      return { isValid: false, message: `Syntax Error on line ${i + 1}: Expected expression to start with '('. Found: '${tokens[0]}...'`, errorLineIndex: i };
    }
    if (tokens[tokens.length - 1] !== ')') {
      return { isValid: false, message: `Syntax Error on line ${i + 1}: Expected expression to end with ')'. Line: ${originalLinesForContext[i]}`, errorLineIndex: i };
    }

    const sExprTokens = tokens.slice(1, -1); // Content inside the top-level parentheses
    if (sExprTokens.length === 0) { // e.g. line was `( )` which is valid (empty list)
        continue;
    }

    const head = sExprTokens[0];
    const args = sExprTokens.slice(1);

    // Check for prefix notation: head should be function/operator/keyword, not a raw value
    if (/^\d+(\.\d+)?$/.test(head) || (/^".*"$/.test(head) && head !== '""') ) {
      // An exception is a list of one element e.g. `(1)` or `("foo")`
      if (sExprTokens.length > 1) {
         return { isValid: false, message: `Syntax Error on line ${i + 1}: Operator/function expected. Found value '${head}' at the start of an expression.`, errorLineIndex: i };
      }
    }
    
    const spec = findPillSpecByLabel(head);

    if (spec) {
      if (spec.expects) {
        const minExpectedArgs = spec.expects.length; // This is a simplification
        
        // More nuanced arity checks (very basic examples)
        if (head === 'define') {
          if (args.length < 1) { // (define x) is not valid, (define x 10) is. (define (f x) body) args.length > 1
            return { isValid: false, message: `Syntax Error on line ${i + 1}: 'define' needs at least a name and a value/body. Example: (define x 10).`, errorLineIndex: i };
          }
          const varOrFuncName = args[0];
          if (varOrFuncName.startsWith('(') && varOrFuncName.endsWith(')')) { // (define (f x) ...)
            // Basic check for function definition form
            const funcDefTokens = tokenize(varOrFuncName);
            if (funcDefTokens.length < 2 || funcDefTokens[0] !== '(' || funcDefTokens[funcDefTokens.length-1] !== ')') { // ( name ... )
                 return { isValid: false, message: `Syntax Error on line ${i + 1}: Malformed function definition in 'define'. Expected (define (func-name args...) body).`, errorLineIndex: i };
            }
            if (args.length < 2) { // Needs a body
                 return { isValid: false, message: `Syntax Error on line ${i + 1}: Function definition in 'define' is missing a body.`, errorLineIndex: i };
            }
          } else { // (define x value)
             if (args.length < 2) {
                return { isValid: false, message: `Syntax Error on line ${i + 1}: 'define' expects a variable and a value. Example: (define x 10).`, errorLineIndex: i };
             }
             if (!/^[a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*$/.test(varOrFuncName) || /^\d/.test(varOrFuncName)) {
                return { isValid: false, message: `Syntax Error on line ${i + 1}: Invalid variable name '${varOrFuncName}' in define.`, errorLineIndex: i };
             }
          }
        } else if (head === 'list' || head === '+' || head === '-' || head === '=') {
          // These are variadic or typically take 2+ for binary ops.
          // '+' and '-' can be unary e.g. (- 5)
          if ((head === '+' || head === '-' || head === '=') && args.length === 0 && spec.expects.length > 0) { // (+), (=) often an error without specific context
            // return { isValid: false, message: `Syntax Error on line ${i + 1}: Operator '${head}' usually expects arguments.`, errorLineIndex: i };
          }
        } else if (args.length < minExpectedArgs) {
           return { isValid: false, message: `Syntax Error on line ${i + 1}: Not enough arguments for '${head}'. Expected ${minExpectedArgs}, got ${args.length}.`, errorLineIndex: i };
        }
        // Note: Max arity check could also be added if PillSpec defines it.
      }
    } else {
      // Head is not a known pill spec. Could be user-defined func or variable.
      // For it to be in operator position, it must look like a symbol.
      if (!/^[a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*$/.test(head) && !head.startsWith("'") && head !== "...") {
         // return { isValid: false, message: `Syntax Error on line ${i + 1}: Unknown function, operator, or keyword '${head}'.`, errorLineIndex: i };
      }
    }
  }

  return { isValid: true, message: "AI Check: Syntax appears plausible (enhanced heuristics)." };
}

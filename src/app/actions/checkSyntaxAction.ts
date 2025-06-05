
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
      if (sExprTokens.length > 1) { // Allow `("a string")` or `(123)` if they are the only thing in s-expr
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
          // these functions can be variadic or handle zero args in some Racket contexts
        } else if (args.length < minExpectedArgs) {
           return { isValid: false, message: `Syntax Error on line ${i + 1}: Not enough arguments for '${head}'. Expected ${minExpectedArgs}, got ${args.length}.`, errorLineIndex: i, simulatedEvaluation: null };
        }
      }
    } else {
      // Unknown function/operator. Could be user-defined.
    }
  }
  
  // If all syntax checks passed, attempt specific pattern simulation
  const nonEmptyTrimmedLines = originalLinesForContext.filter(line => line.trim() !== '').map(line => line.trim());

  if (nonEmptyTrimmedLines.length === 2) {
    const tokensLine1 = tokenize(nonEmptyTrimmedLines[0]);
    const tokensLine2 = tokenize(nonEmptyTrimmedLines[1]);

    let definedVarName: string | null = null;
    let definedListElements: string[] | null = null;

    // Check pattern: (define var (list e1 e2 ...))
    // Example tokensLine1: ["(", "define", "x", "(", "list", "1", "2", "3", ")", ")"]
    if (tokensLine1.length >= 7 && // Minimum for (define v (list))
        tokensLine1[0] === '(' && tokensLine1[1] === 'define' &&
        !tokensLine1[2].includes('(') && !tokensLine1[2].includes(')') && // var name is a symbol
        tokensLine1[3] === '(' && tokensLine1[4] === 'list' &&
        tokensLine1[tokensLine1.length - 2] === ')' && // inner list closing paren
        tokensLine1[tokensLine1.length - 1] === ')') { // define closing paren
      
      definedVarName = tokensLine1[2];
      // Elements are from index 5 up to length-2
      definedListElements = tokensLine1.slice(5, tokensLine1.length - 2); 
    }

    if (definedVarName && definedListElements) {
      // Check pattern: (filter even? definedVarName)
      // Example tokensLine2: ["(", "filter", "even?", "x", ")"]
      if (tokensLine2.length === 5 &&
          tokensLine2[0] === '(' && tokensLine2[1] === 'filter' &&
          tokensLine2[2] === 'even?' && tokensLine2[3] === definedVarName &&
          tokensLine2[4] === ')') {

        const numericElements = definedListElements
          .map(el => parseInt(el, 10))
          .filter(n => !isNaN(n)); // ensure they are numbers

        const filteredList = numericElements.filter(num => num % 2 === 0);
        
        const simulatedResult = filteredList.length > 0 ? `'(${filteredList.join(' ')})` : "'()";
        
        return {
          isValid: true,
          message: "AI Check: Syntax appears plausible. Specific multi-line pattern evaluated.",
          simulatedEvaluation: simulatedResult,
          errorLineIndex: null
        };
      }
    }
  }

  // Fallback simulation for other valid cases
  let determinedSimulatedEvaluation: string | null;
  if (nonEmptyTrimmedLines.length === 0) {
    determinedSimulatedEvaluation = "// Expression is empty";
  } else if (nonEmptyTrimmedLines.length === 1) {
    const singleLineTrimmed = nonEmptyTrimmedLines[0];
    if (singleLineTrimmed === "(+ 1 2)") {
      determinedSimulatedEvaluation = "3";
    } else if (singleLineTrimmed === "(list 1 2 3)") {
      determinedSimulatedEvaluation = "'(1 2 3)";
    } else if (singleLineTrimmed === "(define x 10)") {
      determinedSimulatedEvaluation = "// x defined";
    } else if (singleLineTrimmed.match(/^\(define\s+([a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*)\s+(.*)\)$/)) {
      const match = singleLineTrimmed.match(/^\(define\s+([a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=.]*)\s+(.*)\)$/);
      determinedSimulatedEvaluation = `// ${match?.[1]} defined`;
    } else if (/^\([\w?!+\-*\/<>=.]+(\s+[\w".?!+\-*\/<>=()']+)*\)$/.test(singleLineTrimmed) || 
               /^'.*$/.test(singleLineTrimmed) || // quoted expressions
               /^#['()]/.test(singleLineTrimmed)) { // reader macros like #'( ... )
      determinedSimulatedEvaluation = "Value from expression. (Simulated)";
    } else if (!singleLineTrimmed.includes('(') && !singleLineTrimmed.includes(')') && singleLineTrimmed.length > 0) { // atom
      determinedSimulatedEvaluation = singleLineTrimmed; 
    } else {
      determinedSimulatedEvaluation = "Expression valid. (Simulated output)";
    }
  } else { 
    determinedSimulatedEvaluation = "Final result of evaluation. (Simulated)";
  }

  return { 
    isValid: true, 
    message: "AI Check: Syntax appears plausible (enhanced heuristics).", 
    simulatedEvaluation: determinedSimulatedEvaluation,
    errorLineIndex: null 
  };
}


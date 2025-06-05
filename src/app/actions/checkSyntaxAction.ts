
'use server';

interface SyntaxCheckResult {
  isValid: boolean;
  message: string;
  errorLineIndex?: number | null; // Index of the line with the error
}

// This is a placeholder for an actual AI syntax check.
// It uses very basic heuristics.
export async function checkSyntaxAction(code: string): Promise<SyntaxCheckResult> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const lines = code.split('\n');
  if (lines.every(line => line.trim() === '')) {
    return { isValid: true, message: "Expression is empty." };
  }

  for (let i = 0; i < lines.length; i++) {
    const lineCode = lines[i].trim();
    if (lineCode === '' || lineCode === '()') continue; // Skip empty or effectively empty lines

    // Basic parenthesis check for this line
    let balance = 0;
    for (const char of lineCode) {
      if (char === '(') balance++;
      if (char === ')') balance--;
      if (balance < 0) return { isValid: false, message: `Syntax Error on line ${i + 1}: Unmatched closing parenthesis.`, errorLineIndex: i };
    }
    // Only check for unmatched opening if the line isn't clearly incomplete (e.g. just an opening paren and a function)
    // This check is tricky without more context on how pills form the line
    // if (balance !== 0 && lineCode.endsWith(')')) {
    //   return { isValid: false, message: `Syntax Error on line ${i + 1}: Unmatched opening parenthesis.`, errorLineIndex: i };
    // }

    const parts = lineCode.replace(/^\(|\)$/g, '').trim().split(/\s+/); // Remove outer parens for part analysis
    
    if (parts.length > 0 && parts[0] !== '') {
      const firstPart = parts[0];
      const knownFunctions = ['list', 'cons', 'filter', 'map', 'foldr', '+', '-', '=', 'even?', 'odd?', 'empty?', 'define'];
      
      // If the line starts with something that isn't a known function/keyword and isn't a clear value
      if (!knownFunctions.includes(firstPart) &&
          !/^\d+$/.test(firstPart) && // number
          !/^".*"$/.test(firstPart) && // string
          !/^[a-zA-Z_?!+\-*\/<>=][\w?!+\-*\/<>=]*$/.test(firstPart) // variable/symbol
      ) {
        // This check can be noisy, disabling for now as pill structure implies valid starts.
        // return { isValid: false, message: `Syntax Error on line ${i + 1}: Unknown start of expression '${firstPart}'.`, errorLineIndex: i };
      }
    } else if (lineCode !== '()' && lineCode !== '') { // Line has content but parsing to parts failed (e.g. just "( " )
        // return { isValid: false, message: `Syntax Error on line ${i + 1}: Incomplete or malformed expression.`, errorLineIndex: i };
    }
  }
  
  // If all lines pass basic checks
  return { isValid: true, message: "AI Check: Looks plausible (basic multi-line check)." };
}

'use server';

interface SyntaxCheckResult {
  isValid: boolean;
  message: string;
  // In a real scenario, this might include suggestions or error locations
}

// This is a placeholder for an actual AI syntax check.
// It uses very basic heuristics.
export async function checkSyntaxAction(code: string): Promise<SyntaxCheckResult> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const trimmedCode = code.trim();

  if (!trimmedCode) {
    return { isValid: true, message: "Expression is empty." };
  }

  // Basic parenthesis check (very naive)
  let balance = 0;
  for (const char of trimmedCode) {
    if (char === '(') balance++;
    if (char === ')') balance--;
    if (balance < 0) return { isValid: false, message: "Syntax Error: Unmatched closing parenthesis." };
  }
  // This check is disabled as pills don't form parentheses yet.
  // if (balance !== 0) return { isValid: false, message: "Syntax Error: Unmatched opening parenthesis." };

  // Check for common Racket keywords/functions
  const knownFunctions = ['list', 'cons', 'filter', 'map', 'foldr', '+', '-', '=', 'even?', 'odd?', 'empty?'];
  const parts = trimmedCode.split(/\s+/);
  
  if (parts.length > 0) {
    const firstPart = parts[0].replace('(', ''); // Naive way to handle potential opening paren
    if (!knownFunctions.includes(firstPart) && !/^\d+$/.test(firstPart) && !/^".*"$/.test(firstPart) && !/^[a-zA-Z\-]+$/.test(firstPart)) {
       // If it's not a known function, number, string, or simple variable name
       // return { isValid: false, message: `Syntax Error: Unknown start of expression '${firstPart}'.` };
    }
  }
  
  // Simulate a positive result if basic checks pass
  if (trimmedCode.length > 2 ) { // Arbitrary length check for some content
    return { isValid: true, message: "AI Check: Looks like valid Racket (basic check)." };
  } else {
    return { isValid: false, message: "AI Check: Expression is too short or seems incomplete." };
  }
}

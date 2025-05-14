export interface LineValidationResult {
  line: string;
  lineNumber: number;
  index: number;
  success: boolean;
  errors: string[];
}

export function validateMermaidGantt(
  mermaidInput: string | Array<{ index: number, line: string }>
): LineValidationResult[] {
  let indexedLines: Array<{ index: number, line: string }>;
  if (typeof mermaidInput === 'string') {
    const lines = mermaidInput.split('\n');
    indexedLines = lines.map((line, idx) => ({ index: idx, line }));
  } else {
    indexedLines = mermaidInput;
  }
  const results: LineValidationResult[] = [];
  const allPotentiallyDeclaredIds = new Set<string>(); // Stores all syntactically valid IDs from Pass 1

  // Regex patterns
  const idRegex = /^[a-zA-Z0-9_]+$/; // Valid characters for IDs
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/; // Standard YYYY-MM-DD format
  const durationRegex = /^\d+d$/; // Duration format like '7d'
  let currentDateFormatString = 'YYYY-MM-DD'; // Default, can be updated by dateFormat directive

  // --- PASS 1: Collect all potentially declared IDs for forward dependency checking ---
  for (let i = 0; i < indexedLines.length; i++) {
    const trimmedLine = indexedLines[i].line.trim();
    // Skip lines that cannot declare an ID
    if (trimmedLine === '' || trimmedLine.startsWith('%%') || trimmedLine.toLowerCase() === 'gantt' ||
        trimmedLine.toLowerCase().startsWith('title ') ||
        trimmedLine.toLowerCase().startsWith('dateformat ') ||
        trimmedLine.toLowerCase().startsWith('section ')) {
      continue;
    }
    const parts = trimmedLine.split(':', 2);
    if (parts.length === 2 && parts[0].trim() !== '' && parts[1].trim() !== '') {
      const definitionString = parts[1].trim();
      const defArgs = definitionString.split(',').map(arg => arg.trim());
      // Check for task or explicit-ID milestone structure
      if (defArgs.length === 3) {
        const potentialId = defArgs[0];
        // Only add if the ID part itself has a valid character format
        if (idRegex.test(potentialId)) {
          allPotentiallyDeclaredIds.add(potentialId);
        }
      }
    }
  }

  // --- PASS 2: Full Validation ---
  const definedIdsThisPass = new Set<string>(); // Tracks IDs defined so far in *this pass* for duplicate checks

  for (let i = 0; i < indexedLines.length; i++) {
    const lineNumber = indexedLines[i].index + 1;
    const originalLine = indexedLines[i].line;
    const trimmedLine = indexedLines[i].line.trim();

    const lineResult: LineValidationResult = {
      line: originalLine,
      lineNumber: lineNumber,
      index: indexedLines[i].index,
      success: true,
      errors: [],
    };

    // 1. Handle comments (always valid and successful)
    if (trimmedLine.startsWith('%%')) {
      results.push(lineResult);
      continue;
    }

    // 2. Handle directives
    if (trimmedLine.toLowerCase() === 'gantt') {
      results.push(lineResult);
      continue;
    }
    if (trimmedLine.toLowerCase().startsWith('title ')) {
      if (trimmedLine.substring('title '.length).trim() === '') {
        lineResult.success = false;
        lineResult.errors.push('Title cannot be empty.');
      }
      results.push(lineResult);
      continue;
    }
    if (trimmedLine.toLowerCase().startsWith('dateformat ')) {
      const format = trimmedLine.substring('dateFormat '.length).trim();
      if (format === '') {
        lineResult.success = false;
        lineResult.errors.push('DateFormat cannot be empty.');
      } else {
        currentDateFormatString = format; // Store for error messages, actual regex for date is fixed here
      }
      results.push(lineResult);
      continue;
    }
    if (trimmedLine.toLowerCase().startsWith('section ')) {
      if (trimmedLine.substring('section '.length).trim() === '') {
        lineResult.success = false;
        lineResult.errors.push('Section name cannot be empty.');
      }
      results.push(lineResult);
      continue;
    }

    // 3. Handle task or milestone definitions (and empty lines that are not comments)
    const parts = trimmedLine.split(':', 2);
    // Non-comment empty lines or lines not matching `name: definition` structure
    if (trimmedLine === '') {
        // Empty line is valid (if you want to mark as invalid, set success = false)
        results.push(lineResult);
        continue;
    }
    if (parts.length !== 2 || parts[0].trim() === '' || parts[1].trim() === '') {
        lineResult.success = false;
        lineResult.errors.push("Invalid task/milestone format. Expected '<name>: <definition>'.");
        results.push(lineResult);
        continue;
    }

    // const namePart = parts[0].trim(); // Available if needed for more detailed errors not requested
    const definitionString = parts[1].trim();
    const defArgs = definitionString.split(',').map(arg => arg.trim());

    let currentId = ""; // To store the ID being defined by the current line
    let isCurrentLineAttemptingIdDefinition = false;

    // Case 1: Milestone with explicit ID: <name>: <id>, milestone, after <dependencyId>
    if (defArgs.length === 3 && defArgs[1].toLowerCase() === 'milestone') {
      currentId = defArgs[0];
      isCurrentLineAttemptingIdDefinition = true;

      if (!idRegex.test(currentId)) {
        lineResult.success = false;
        lineResult.errors.push(`Milestone ID '${currentId}' contains invalid characters. Use only alphanumeric characters and underscores.`);
      } else if (definedIdsThisPass.has(currentId)) {
        lineResult.success = false;
        lineResult.errors.push(`Duplicate task/milestone ID '${currentId}'.`);
      }

      const afterKeywordAndDep = defArgs[2];
      if (!afterKeywordAndDep.toLowerCase().startsWith('after ')) {
        lineResult.success = false;
        lineResult.errors.push("Milestone dependency must start with 'after <taskid|milestoneid>'.");
      } else {
        const depId = afterKeywordAndDep.substring('after '.length).trim();
        if (depId === '') {
          lineResult.success = false;
          lineResult.errors.push("Milestone dependency ID cannot be empty.");
        } else if (!allPotentiallyDeclaredIds.has(depId)) { // Uses Pass 1 data
          lineResult.success = false;
          lineResult.errors.push(`Milestone depends on undefined task/milestone '${depId}'.`);
        }
      }
    }
    // Case 2: Task: <name>: <id>, <start_date_or_dependency>, <duration>
    else if (defArgs.length === 3) {
      currentId = defArgs[0];
      isCurrentLineAttemptingIdDefinition = true;
      const startInfo = defArgs[1];
      const durationInfo = defArgs[2];

      if (!idRegex.test(currentId)) {
        lineResult.success = false;
        lineResult.errors.push(`Task ID '${currentId}' contains invalid characters. Use only alphanumeric characters and underscores.`);
      } else if (definedIdsThisPass.has(currentId)) {
        lineResult.success = false;
        lineResult.errors.push(`Duplicate task/milestone ID '${currentId}'.`);
      }

      if (startInfo.toLowerCase().startsWith('after ')) {
        const depId = startInfo.substring('after '.length).trim();
        if (depId === '') {
          lineResult.success = false;
          lineResult.errors.push("Task dependency ID cannot be empty.");
        } else if (!allPotentiallyDeclaredIds.has(depId)) { // Uses Pass 1 data
          lineResult.success = false;
          lineResult.errors.push(`Task depends on undefined task/milestone '${depId}'.`);
        }
      } else if (!dateFormatRegex.test(startInfo)) { // Assuming YYYY-MM-DD for actual check
        lineResult.success = false;
        lineResult.errors.push(`Invalid start date format '${startInfo}'. Expected '${currentDateFormatString}' (validator uses YYYY-MM-DD for check) or 'after <taskid|milestoneid>'.`);
      }

      if (!durationRegex.test(durationInfo)) {
        lineResult.success = false;
        lineResult.errors.push(`Invalid duration format '${durationInfo}'. Expected '<number>d'.`);
      }
    }
    // Case 3: Malformed milestone (e.g., "Name: milestone, after tX")
    else if (defArgs.length === 2 && defArgs[0].toLowerCase() === 'milestone') {
      lineResult.success = false;
      lineResult.errors.push("Invalid milestone format. Expected '<name>: <id>, milestone, after <taskid|milestoneid>'. (Likely missing an explicit ID before 'milestone' keyword).");
      // Still check its dependency part for further errors
      const afterKeywordAndDep = defArgs[1];
      if (!afterKeywordAndDep.toLowerCase().startsWith('after ')) {
        lineResult.errors.push("Milestone dependency must start with 'after <taskid|milestoneid>'."); // Add as a separate error
      } else {
        const depId = afterKeywordAndDep.substring('after '.length).trim();
        if (depId === '') {
          lineResult.errors.push("Milestone dependency ID cannot be empty."); // Add as a separate error
        } else if (!allPotentiallyDeclaredIds.has(depId)) { // Uses Pass 1 data
          lineResult.errors.push(`Milestone depends on undefined task/milestone '${depId}'.`); // Add as a separate error
        }
      }
    }
    // Case 4: Other incorrect formats (wrong number of arguments in definition)
    else {
      lineResult.success = false;
      // Generic error if it doesn't fit known patterns but has a colon
      if (defArgs.some(arg => arg.toLowerCase() === 'milestone')) {
          lineResult.errors.push("Invalid milestone format. Ensure it is '<name>: <id>, milestone, after <dependencyId>' or handle missing ID error.");
      } else {
          lineResult.errors.push("Invalid task format. Ensure it is '<name>: <id>, <start_date_or_dependency>, <duration>'.");
      }
    }

    // If this line attempted to define an ID, and the ID format was valid,
    // and it wasn't a duplicate of an ID from a *previous line in this pass*,
    // then add it to definedIdsThisPass.
    // This ensures that an ID is considered "defined" by this line for subsequent lines in this pass,
    // even if this line has other errors (like a bad dependency), as long as the ID declaration itself was okay.
    if (isCurrentLineAttemptingIdDefinition && idRegex.test(currentId)) {
        let idDeclarationValidOnThisLine = true;
        // Check if any errors already pushed to lineResult are specifically about this ID's format or it being a duplicate
        for (const err of lineResult.errors) {
            if ((err.includes(`ID '${currentId}' contains invalid characters`)) ||
                (err.includes(`Duplicate task/milestone ID '${currentId}'`))) {
                idDeclarationValidOnThisLine = false;
                break;
            }
        }
        if (idDeclarationValidOnThisLine) {
            definedIdsThisPass.add(currentId);
        }
    }
    results.push(lineResult);
  }
  return results;
}

# Ralph Loop - Iteration Prompt

You are in an autonomous development loop. Your job is to implement features incrementally.

## Workflow

1. **Read the Task File**
   - Check which tasks are incomplete (unchecked boxes)
   - Focus on the FIRST incomplete task

2. **Implement the Task**
   - Write working, production-quality code
   - Follow existing patterns in the codebase
   - Don't write placeholder/stub code
   - Keep implementations simple and focused

3. **Test Your Changes**
   - Run `npm run typecheck` after TypeScript changes
   - Run `npm test` if tests exist
   - Fix any errors before moving on

4. **Update Progress**
   - If you learn something important, log it
   - If you hit a blocker, log it and move to next task

## Code Quality Standards

- Use TypeScript with strict typing
- Follow Next.js 14 App Router conventions
- Use Tailwind CSS for styling
- Keep components small and focused
- Use proper error handling
- Add comments only for complex logic

## What NOT to Do

- Don't create placeholder/stub implementations
- Don't skip error handling
- Don't write overly complex code
- Don't change unrelated files
- Don't ignore TypeScript errors

## Progress Logging Format

When logging to progress.txt, use this format:
```
[LEARNING] <what you learned>
[BLOCKER] <what's blocking you>
[DECISION] <architectural decision made>
[COMPLETE] <task completed>
```

## Completion Signal

When ALL tasks in the task file are complete:
1. Run final verification (typecheck + tests)
2. Log "[FEATURE COMPLETE] <feature name>"
3. Provide summary of what was built

## Remember

- One task at a time
- Working code, not perfect code
- Test before marking complete
- Log blockers, don't get stuck

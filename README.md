# Number Quest

Number Quest is an adaptive K-5 math tutor that helps students understand *why* an answer is wrong, not only whether it is wrong. It combines visual math problems, immediate misconception-based feedback, skill progression, and a teacher-facing session summary powered by Google Gemini.

Check it out here: https://number-quest-exincyxrx-bubs4.vercel.app/

## Highlights

- Four foundational math strands:
  - Addition and Subtraction
  - Place Value
  - Multiplication
  - Fractions
- Three progressive tiers for each strand
- Visual representations matched to the concept being practiced
- Instant answer checking with positive reinforcement
- Rule-based explanations for common misconceptions
- Hints that reveal a visual or conceptual nudge without giving away the answer
- Streaks, tier progression, mastery states, and confetti celebrations
- Session logging for every attempted problem
- Teacher View with:
  - Total problems
  - Correct and incorrect answers
  - Overall accuracy
  - Accuracy by skill strand
  - Tier and mastery progress
  - AI-generated parent or teacher report
- Sound effects with a user-controlled sound preference
- Browser-based progress persistence
- Keyboard-friendly answer entry and accessible labels/live regions

## How It Works

Number Quest separates immediate tutoring from end-of-session reporting.

### Immediate feedback

When a student submits an answer, the app checks it locally. Correct answers update the streak and progression system. Incorrect answers are passed through a rule-based diagnosis layer that identifies likely misconceptions, such as:

- Forgetting to regroup when subtracting
- Forgetting to carry when adding
- Reversing tens and ones
- Confusing the size of tens and ones blocks
- Comparing numbers by the ones digit
- Adding fraction denominators
- Treating improper fractions as invalid
- Losing track while skip-counting or grouping
- Making a two-digit multiplication error

This feedback is intentionally local and immediate. It does not require a network request, which keeps the core learning loop fast and predictable.

### Session intelligence

Each attempted problem is recorded in an in-memory session log with its strand, tier, prompt, correct answer, student answer, correctness, and diagnosis when applicable.

When a parent or teacher chooses **Teacher view** and generates a summary:

1. The browser calculates the session metrics and builds a concise session prompt.
2. The browser sends that prompt to `/api/session-summary`.
3. The serverless endpoint reads `GEMINI_API_KEY` from the hosting environment.
4. The endpoint sends the request to Gemini 2.5 Flash.
5. Gemini returns a short parent-friendly report.
6. The browser displays the report with a copy button.

The Gemini key is never sent to or stored in the browser.



## Gameplay Flow

1. Select one of the four math strands.
2. Solve the displayed problem using the visual interaction provided for that strand.
3. Select **Hint** when a conceptual nudge is needed.
4. Select **Check answer**.
5. For a correct answer, continue the streak and work toward the next tier.
6. For an incorrect answer, read Professor Chalk's diagnosis and try a simplified or related problem.
7. Use **Next** to continue the session.
8. Open **Teacher view** to review the current session.

A strand advances after three correct answers in a row. The app supports three tiers per strand, followed by a mastered state.

## Future Roadmap

- Adaptive difficulty based on recent accuracy and response patterns
- Multi-session progress history
- Student profiles and teacher dashboards
- Teacher-created assignments
- More misconception categories and richer visual explanations
- Read-aloud support for prompts and feedback
- Offline-first gameplay with queued summaries
- Automated tests for problem generation and diagnosis rules


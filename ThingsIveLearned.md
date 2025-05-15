# ThingsIveLearned.md

## Project Patterns & Principles
- All code adheres to SOLID principles for maintainability and extensibility.
- Race conditions in Gantt/task management are handled by consolidating validation logic (e.g., `validateTaskDates`).
- Callback functions for UI actions (like submenus) are single-responsibility and extendable.

## UI/UX
- The app style is black and white, clean, tactile, modern, and responsive.
- Submenus and interaction patterns are designed for clarity and ease of use.
- Custom components like `FibonacciFlower` are used for visual flair and information density.

## Code Structure
- Helper functions are used for manipulating nested data structures (e.g., finding, cloning, and inserting tasks).
- All significant changes or insights (like handling generic "after milestone" references in mermaid syntax) are documented here for future reference.

## Technical Insights
- Special handling for ambiguous mermaid syntax (e.g., "after milestone") is implemented by tracking the most recent milestone and queueing tasks as needed.
- DOM animation and rendering (e.g., in `StreamingDiff`) use robust, type-safe approaches with debug logging and browser compatibility in mind.

## Memory & Context
- This file is updated with every major insight, bugfix, or pattern discovery.
- It is referenced at the start of every session to ensure continuity.

---

*This file is maintained by Cascade and will be kept up to date with all key learnings and insights from the project.*

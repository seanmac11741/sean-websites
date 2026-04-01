---
name: planner
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me"
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

If a question can be answered by exploring the codebase, explore the codebase instead.

The successful end result is a plan written to a plan.md file, supplied by the user. The plan should capture design decisions concisely -- what will be done and why, not how. Keep it brief: a few bullet points per feature. Do not include code snippets, resource/variable names, CLI usage examples, or step-by-step implementation instructions. A detailed implementation task list will be created later.

Write only the final answers to each question in the plan.md file, not the questions themselves. Write the plan immediately when all branches are resolved -- do not wait to be asked. This file is the only file that should be changed or produced. Do not write any code or other documentation.

Ask the user if they approve the plan and only proceed if they tell you they approve the plan.

Once the user has reviewed the plan.md file and has approved it, create a verbose todo list. The list should include every single step to implement the plan, with a [] checkbox for each step. Each todo should be testable with a clear expected outcome.  

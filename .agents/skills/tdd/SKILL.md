---
name: tdd
description: Test-driven development with red-green-refactor loop. Use when user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development.
---

# Test-Driven Development (TDD)

* Input is a plan.md file that the user has made with another skill. If there is no plan.md file, ask for one and stop IMMEDIATELY
* The plan.md file should also have a verbose todo list with [] checkboxes for you to implement. If there is no todo list, ask the user to create one and stop IMMEDIATELY.
* Once all prerequisites are in place and you have checked for them. Ingest the todo list and report it to the user, saying "I will now implement these 23 (with the actual number) todos in the file"
* Prompt the user right here! Do not proceed until they say yes proceed in a clear way.
* In a loop, do the following. For each item in the todo list, do the following:
  * Read the todo item. Understand what is needed to implement just this todo item.
  * Write a failing test that captures the requirements of this todo item. This may involve writing a unit test, an integration test, or a few tests. The test(s) should be as small as possible while still capturing the requirements of the todo item. If the todo item is large, break it down into smaller pieces and write tests for each piece.
  * Run the test(s) and see them fail. This confirms that the test is valid and that the functionality is not already present.
  * Now write the minimum amount of code needed to make the test(s) pass. This may involve writing new code or modifying existing code. The key is to only write what is necessary to pass the test(s).
  * Run the test(s) again and see them pass. This confirms that the code you wrote satisfies the requirements of the test(s).
  * Now you can refactor the code if needed, but be careful not to break the tests. The tests serve as a safety net that allows you to refactor with confidence.
  * After refactoring, run the test(s) again to ensure they still pass. If they do, you have successfully implemented the functionality for that todo item.
  * IMMEDIATELY mark this single todo item as [x] in plan.md. This is a BLOCKING step -- do NOT proceed to the next todo item until the [x] is written to the file. Do NOT batch multiple [x] updates together. Each [x] must be its own separate file edit, performed right now, before moving on.
* Repeat this process for each item in the todo list until all items are implemented and all tests are passing.


# Important Notes
* NEVER write all the tests first and then all the code. Always do one small test, then the code to pass it, then the next test, etc. This is the essence of TDD and is crucial for its benefits.
* plan.md updates MUST happen one at a time, immediately after each todo is done. This overrides any general instruction to batch file edits for efficiency. Each [x] is a checkpoint, not a bulk operation.
* The [x] update to plan.md is NOT a documentation step -- it is a CHECKPOINT that proves you are following the TDD loop. If you find yourself with multiple unchecked items that are actually done, you have already broken the process. Stop and fix it.
* The tests you write should be clear and descriptive, so that anyone reading them can understand what functionality is being tested and what the expected behavior is.
* If you find that a todo item is too large or complex to implement in one go, break it down into smaller pieces and write tests for each piece. This will make it easier to manage and ensure that you are following the TDD process effectively.
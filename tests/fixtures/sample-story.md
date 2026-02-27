---
id: PLOT-099
title: "Add fibonacci function"
status: idea
priority: medium
created: 2026-02-26T12:00:00Z
updated: 2026-02-26T12:00:00Z

acceptance_criteria:
  - id: AC-1
    what: "fibonacci(0) returns 0, fibonacci(1) returns 1"
    status: pending
    proof: ""
  - id: AC-2
    what: "fibonacci(10) returns 55"
    status: pending
    proof: ""
  - id: AC-3
    what: "Negative inputs throw an error"
    status: pending
    proof: ""

tasks: []

why: "Need a utility function for fibonacci calculations. Currently no math utilities exist."
---

## Requirements

Create a fibonacci function that:
- Takes a non-negative integer n
- Returns the nth fibonacci number
- Throws on negative input
- Should be efficient (no naive recursion for large n)

## Approach

[To be filled during /plot-plan]

## Notes

Test fixture for Plot test suite.

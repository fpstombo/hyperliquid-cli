# Web UI v1 Confidence Score Gate

This gate defines the weighted confidence score required before Web UI v1 can be declared complete.

## Purpose

A release recommendation must be supported by a quantitative confidence score derived from required quality domains. The score is intended to prevent subjective "looks good" declarations when one domain still has unresolved risk.

## Scoring formula

- **Confidence score (0-100)** = sum of each domain's weighted contribution.
- Domain contribution = `weight × domain pass percentage`.
- Domain pass percentage is measured as `passed checks / total required checks` for that domain.
- If a domain has a hard-fail condition triggered, that domain pass percentage is **0**.

Example:

`Confidence = Σ(weight_i × pass_rate_i)`

## Weighted criteria

| Domain | Weight | What is measured | Minimum domain threshold |
| --- | ---: | --- | ---: |
| Visual quality | 24 | Visual QA rubric completion and screenshot evidence for changed surfaces. | **100%** |
| Performance | 22 | Route/chunk size, hydration, TTI, update latency, and FPS against hard limits. | **100%** |
| Streaming/data freshness | 16 | SSE/poll update correctness, stale-state handling, and retry behavior under interruptions. | **99%** |
| SIM visibility/compliance | 14 | SIM viewport checklist and SIM semantics/styling conformance across required surfaces. | **100%** |
| Boundary/guardrail compliance | 14 | v1 scope caps, route inventory constraints, layering contract, and non-goal protection. | **100%** |
| Scope completion integrity | 10 | PR sequence reporting, required artifacts, and mandatory checklist evidence complete. | **100%** |

Total weight = **100**.

## Minimum passing thresholds

All of the following are required:

1. **Global confidence score >= 99.0**.
2. **No domain below its minimum threshold** listed above.
3. **No hard-fail conditions** from any referenced gate/checklist.
4. **No unresolved blocker** in required evidence (missing screenshots, missing lint/typecheck/test reports, missing SIM checks, missing perf data).

## Hard-fail conditions

Any of the following immediately blocks a v1 completion declaration regardless of computed score:

- Visual rubric auto-fail condition is present.
- Any performance hard limit is missed.
- Any required SIM surface is not visible above the fold at required viewports.
- Scope guardrail cap is exceeded without approved scope swap.
- Required PR reporting artifacts are incomplete or unverifiable.

## Evidence requirements

The confidence calculation must link to the exact artifacts used for scoring:

- Latest visual QA checklist and screenshot set.
- Latest performance trend-table row and measurement artifacts.
- Latest streaming reliability test output/logs.
- Latest SIM viewport checklist run.
- Latest scope guardrail compliance checklist.
- Latest PR sequence report confirming lint/typecheck/test status for web.

If evidence is missing for any domain, that domain is scored as **0** until evidence is provided.

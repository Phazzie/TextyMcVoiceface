# Recommended Merge Strategy

This document outlines the recommended strategy for merging the `origin/fix/report-refactor` branch into the `consolidation-merge` branch.

## Phase 1: Stabilize the `consolidation-merge` Branch

The `consolidation-merge` branch is currently unstable due to unresolved merge conflicts from a previous merge. This phase will address these issues and create a stable base for the final merge.

### Step 1: Fix `src/contexts/AuthContext.tsx`

*   **Action:** Add a missing comma in the `value` object of the `AuthContext.Provider`.
*   **File:** `src/contexts/AuthContext.tsx`
*   **Line:** 84

### Step 2: Resolve Conflicts in `src/services/SeamManager.ts`

*   **Action:** Manually merge the conflicting sections to incorporate the `IAppConfigService` and the improved service registration methods from the `HEAD` version.
*   **File:** `src/services/SeamManager.ts`
*   **Details:**
    *   Keep the `IAppConfigService` import.
    *   Keep the `registerAppConfigService` and `getAppConfigService` methods.
    *   Keep the `registerAIEnhancementService` and `getAIEnhancementService` methods from the `HEAD` version.

### Step 3: Resolve Conflicts in `src/services/implementations/AIEnhancementService.ts`

*   **Action:** Combine the two versions of the file, using the `HEAD` version's structure and integrating the `invertTrope` functionality from the `origin/feat/trope-inverter-ai` branch.
*   **File:** `src/services/implementations/AIEnhancementService.ts`
*   **Details:**
    *   The constructor should not take an API key.
    *   The `invertTrope` method should be modified to retrieve the API key from the `IAppConfigService`.

## Phase 2: Merge `origin/fix/report-refactor`

This phase follows "PLAN B" from the `MERGE_STRATEGY_ANALYSIS.md` file.

### Step 1: Pre-merge Analysis

*   **Action:** Examine the changes in the `origin/fix/report-refactor` branch to identify all modified files and their relationships.
*   **Command:** `git show origin/fix/report-refactor --name-only`

### Step 2: Clean Current State

*   **Action:** Fix any remaining lint errors or other issues in the `consolidation-merge` branch.
*   **Command:** `npm run lint`

### Step 3: Staged Integration

*   **Action:** Merge the `origin/fix/report-refactor` branch in phases, starting with non-conflicting files.
*   **Details:**
    *   **Phase 1:** Merge non-conflicting files.
    *   **Phase 2:** Handle the replacement of the `WritingQualityReport` component.
    *   **Phase 3:** Update `App.tsx` with the new event system integration.
    *   **Phase 4:** Merge changes to `SeamManager.ts` and other services.

### Step 4: Component-by-Component Resolution

*   **Action:** For each conflict, analyze both versions side-by-side and create a hybrid solution that preserves the best of both.
*   **Details:**
    *   Prioritize the event-driven architecture from the `report-refactor` branch.
    *   Ensure that the authentication integration from the `consolidation-merge` branch remains fully functional.

### Step 5: Integration Testing

*   **Action:** Thoroughly test the application after each phase of the merge.
*   **Details:**
    *   Test all reporting functionality.
    *   Verify that authentication still works as expected.
    *   Ensure that the event-driven reports function correctly.

# UX Review Notes for Power Balance Chart & Perspective Shift Modal

Date: $(date +%Y-%m-%d)

## 1. PowerBalanceChart.tsx (`src/components/reports/PowerBalanceChart.tsx`)

### UI Improvements & Clarity:
*   **Chart Title:** "Dialogue Power Dynamics" is clear.
*   **Axis Titles:** "Power Score" (Y-axis) and "Dialogue Turn" (X-axis) are good.
    *   Consider increasing font size slightly for axis titles if design system allows, or making them bolder for better prominence.
*   **Y-Axis Labels (-5 to +5):** Clearly displayed. The horizontal grid lines are helpful. The zero line is distinct.
*   **X-Axis Labels (Character Name + Turn Number):**
    *   `{p.turn.characterName.substring(0,10)}{data.length > 10 && index % 2 !== 0 ? "" : ` (${index+1})`}`: This logic to conditionally hide some labels if there are many data points is good for preventing overlap.
    *   **Suggestion:** For very long character names, `substring(0,10)` might be too short or cut off awkwardly. Consider allowing more space or a more intelligent truncation (e.g., ellipses, or full name on hover if not for the main tooltip).
    *   **Suggestion:** If character names are very similar, color-coding points/lines per character (if feasible with limited palette) or ensuring enough distinction in X-axis labels would be key. Currently, lines are single-colored.
*   **Data Line & Points:** Clear and easy to see. The blue color is standard.
*   **Responsiveness (Conceptual):**
    *   The SVG uses `viewBox` and `w-full h-auto`, which is good for basic scaling.
    *   However, with many data points, X-axis labels could become very cramped on smaller screens.
    *   **Suggestion:** On smaller screens, consider showing fewer X-axis labels (e.g., every 3rd or 5th turn number, or only character initials if names are long) or making the chart horizontally scrollable within its container.
    *   Font sizes for labels might need media query adjustments.
*   **Tooltips:**
    *   The tooltip displays comprehensive information from `DialogueTurn` metrics. This is very good for power users.
    *   **Suggestion:** The fixed positioning (`left: `${tooltip.x + 5}px`, top: `${tooltip.y - 70}px`) might sometimes cause the tooltip to go off-screen, especially for points near the edges of the chart. A more dynamic positioning logic (e.g., detect viewport edges and flip tooltip position) would be more robust. Libraries often handle this.
    *   **Suggestion:** For boolean metrics like `isQuestion` or `topicChanged`, directly showing "Yes" / "No" is clear.
    *   **Suggestion:** `hedgeToIntensifierRatio.toFixed(2)` is good.
    *   **Suggestion:** Formatting for `detectedTactic` (`.replace(/([A-Z])/g, ' $1').trim()`) to add spaces is a nice touch for readability (e.g., "Weaponized Politeness").

### UX Considerations:
*   **No Data State:** The message "No dialogue data to display power balance." is clear.
*   **Interactivity:** Hovering over points to show tooltips is good.
*   **Accessibility (Conceptual):**
    *   **ARIA Attributes:**
        *   The SVG itself could benefit from `role="img"` and an `<title>` or `<desc>` element for screen reader users, or an `aria-label` on the container div.
        *   Data points (circles) could have `role="button"` (if they were clickable for more info) or `role="img"` with `aria-label` describing the data point (e.g., "Alice, Turn 1, Power Score: 2").
        *   Tooltips: Ensure they are keyboard accessible if points can be focused, or that the information is available in a tabular format elsewhere. Currently, they are mouse-hover only.
    *   **Keyboard Navigation:** Consider if users should be able to navigate between data points using a keyboard (e.g., arrow keys) to view tooltips. This is an advanced feature.
    *   **Color Contrast:** Ensure the blue line/points and text have sufficient contrast against the background, especially if theming is introduced later. Current Tailwind colors are generally good.

## 2. PerspectiveShiftModal.tsx (`src/components/modals/PerspectiveShiftModal.tsx`)

### UI Improvements & Clarity:
*   **Modal Title:** "Shift Perspective" with `Wand2` icon is clear and thematic.
*   **Layout:** Standard modal layout with header, content, and footer (actions) is good.
*   **Original Text Display:**
    *   Label includes `originalCharacterName`, which is excellent context.
    *   Displaying it in a `bg-gray-50` box is good for differentiation.
    *   `max-h-32 overflow-y-auto` is a sensible default.
*   **Character Dropdown:**
    *   Label "Rewrite from the perspective of:" is clear.
    *   Excluding the `originalCharacterName` from options is correct.
    *   "No other characters available" state is handled.
*   **Rewrite Button:**
    *   Includes icon and text "Rewrite".
    *   Disabled states (during loading, or if no character selected/available) are handled.
    *   Loading state with `Loader2` icon is good.
*   **Error Display:**
    *   Clearly sectioned with "Error:" title and message. Uses red tones for emphasis.
*   **Rewritten Text Display:**
    *   Label includes `selectedNewCharacterName` for context.
    *   `bg-purple-50` provides nice visual feedback for AI-generated content.
    *   `max-h-48 overflow-y-auto` is a good default.

### UX Considerations:
*   **Modal Opening/Closing:** Standard `isOpen` prop and `onClose` via X button.
*   **State Reset:** `useEffect` to reset state (rewritten text, error, selected character) when modal opens or key props change is good UX.
*   **Default Selection:** Defaulting `selectedNewCharacterName` to the first available option is helpful.
*   **Feedback:**
    *   Loading state on the button is clear.
    *   Error messages are displayed.
    *   Successful rewrite shows the new text.
*   **Accessibility (Conceptual):**
    *   **Focus Management:** When the modal opens, focus should ideally be trapped within it. The first focusable element (e.g., the character select dropdown or the close button) should receive focus. When it closes, focus should return to the element that triggered it. (This often requires a focus-trapping library or careful manual implementation).
    *   **ARIA Attributes:**
        *   The modal container should have `role="dialog"`, `aria-modal="true"`.
        *   An `aria-labelledby` attribute on the modal container pointing to the ID of the title (`<h2 class="text-2xl ...">`) is recommended.
        *   The close button has `aria-label`.
        *   The select dropdown has a `label htmlFor`.
    *   **Keyboard Navigation:** Ensure all interactive elements (close button, select, rewrite button) are keyboard focusable and operable.
*   **Interaction Flow:**
    *   User selects text in `StoryInput`.
    *   "Shift Perspective" button appears.
    *   User clicks button, modal opens with selected text.
    *   User selects new character.
    *   User clicks "Rewrite".
    *   User sees result or error.
    *   This flow is logical.
*   **Handling No Characters:** If `storyCharacters` is empty or only contains the `originalCharacterName`, the dropdown shows "No other characters available" and the rewrite button is disabled. This is good.
*   **Original Character Determination:** The note in `StoryInput.tsx` about `originalCharacterForShift` needing to be more accurately determined is important. If this is often incorrect, the user experience of the modal's starting state will be confusing.

### General Notes for Both:
*   **Visual Consistency:** Ensure styling (fonts, button styles, spacing, color palette) aligns with the rest of the Story Voice Studio application. Current use of Tailwind CSS suggests this is likely handled by a global setup.
*   **Responsiveness:** Modals should generally be responsive. `max-w-2xl` provides a good desktop width. On smaller screens, it should shrink appropriately. The internal content (text areas, dropdown) should also adapt.

This completes the initial styling and UX review notes.

## 3. Error Handling Review

### `AIEnhancementService.ts` (`rewriteFromNewPerspective`)
*   **Current:**
    *   Checks for missing input parameters (`text`, `newCharacterName`, `originalCharacterName`) and returns `success: false` with an error message. (Good)
    *   Conceptual real API call has a `try...catch` block for network errors or issues during the fetch. (Good)
    *   Checks `response.ok` and attempts to parse error data from API. (Good)
    *   Returns `success: false` if AI service returns an empty response. (Good)
    *   Handles API key retrieval failure from `AppConfigService` with console warnings. If `MOCK_API_CALL` is false and API key is truly missing/invalid, the actual fetch would fail (or be blocked by a real config service returning an error).
*   **Suggestions:**
    *   **Error Codes/Types:** For programmatic error handling by consumers, consider adding specific error codes/types to `ContractResult.error` or `ContractResult.metadata` (e.g., `INVALID_INPUT`, `API_KEY_MISSING`, `AI_SERVICE_ERROR`, `AI_EMPTY_RESPONSE`).
    *   **Logging:** While `console.error` is used for AI API errors, a more structured logging mechanism (if available in the project, e.g., a dedicated logging service) would be beneficial for production debugging. This could include correlation IDs if calls are part of a larger operation.
    *   **Retry Logic (Conceptual for Real API):** For transient network issues or rate limit errors from the AI service, a simple retry mechanism (e.g., 1-2 retries with exponential backoff) could improve resilience. This is an advanced feature.

### `WritingQualityAnalyzer.ts` (`analyzeDialoguePowerBalance`)
*   **Current:**
    *   Top-level `try...catch` block wraps the entire method. (Good)
    *   Returns `success: false` and an error message if `textAnalysisEngine.parseText` fails. (Good)
    *   Console errors the specific error.
*   **Suggestions:**
    *   **Granular Error Logging:** If `textAnalysisEngine.parseText` fails, the current message is generic: `Dialogue power balance analysis failed: ${error message}`. It might be useful to log the specific stage (e.g., "text parsing for power balance") for easier debugging.
    *   **Input Validation:** Currently assumes `sceneText` is a string. If it could be other types, basic type checking at the start could provide clearer errors. (Low priority if TypeScript types are well-enforced at call sites).
    *   **Partial Results:** For very long texts, if a non-critical error occurs mid-analysis (e.g., an unexpected segment structure for one dialogue turn out of many), consider if the method could return partial results (e.g., successfully analyzed turns + an error/warning for the problematic part) instead of failing entirely. This depends on product requirements. For now, failing on error is safer.

### `PerspectiveShiftModal.tsx`
*   **Current:**
    *   Sets an error message in state if `aiService.rewriteFromNewPerspective` returns `success: false` or throws an error. (Good)
    *   Displays the error message in the UI. (Good)
    *   Checks for missing input before calling service (`!selectedNewCharacterName`, etc.). (Good)
    *   Checks if `aiService` is available. (Good)
*   **Suggestions:**
    *   **User-Friendly Error Messages:**
        *   "AI failed miserably" (from test mock) or "Failed to rewrite text from new perspective." are okay for now.
        *   Consider mapping known error types/codes from the service (if implemented as suggested above) to more user-friendly messages. E.g., if an API key error occurs, a message like "Perspective Shift feature is currently unavailable. Please try again later or contact support." might be better than exposing raw API key issues.
        *   For network errors, a generic "Please check your internet connection and try again."
    *   **Clear Error State:** Ensure the UI clearly indicates an error occurred and perhaps allows the user to easily try again (the button re-enables, which is good).
    *   **Error Logging:** Client-side errors could also be logged to a remote logging service for monitoring UI issues in production.

### `PowerBalanceChart.tsx`
*   **Current:**
    *   Handles `data` prop being `null` or empty by displaying "No dialogue data...". (Good)
    *   No explicit internal error handling as it primarily renders data passed to it. If data is malformed (e.g., `powerScore` is not a number), it might lead to SVG rendering issues or NaN calculations.
*   **Suggestions:**
    *   **Data Validation (Prop Types/Runtime):** While TypeScript helps, consider adding runtime checks within the component if there's a risk of malformed `DialogueTurn` objects being passed, especially for `powerScore`. E.g., log a warning and skip rendering a point if `powerScore` is invalid.
    *   **Error Boundary:** For more complex charts, wrapping it in a React Error Boundary could prevent a chart rendering error from crashing the entire report/page. The boundary could display a "Chart failed to load" message.

This completes the error handling review.

## 4. Performance Notes (`analyzeDialoguePowerBalance` in `WritingQualityAnalyzer.ts`)

The `analyzeDialoguePowerBalance` method involves several string operations and iterations that could have performance implications on very large texts (e.g., hundreds of pages or millions of characters).

**Current Operations with Potential Performance Impact:**

1.  **`textAnalysisEngine.parseText(sceneText)`:**
    *   This is an external call. Its performance is critical. If this is slow, the entire power balance analysis will be slow. Assumed to be optimized separately.

2.  **Filtering `dialogueSegments`:**
    *   A single pass `filter` operation. Performance impact should be minimal (O(N) where N is number of segments).

3.  **Main Loop (`for (let i = 0; i < dialogueSegments.length; i++)`):**
    *   Iterates once per dialogue segment. This is the core loop.

4.  **Inside the Main Loop (per dialogue turn):**
    *   `segment.content.toLowerCase()`: Creates a new string. Generally efficient.
    *   `text.split(/\s+/)`: Creates an array of words. Performance depends on string length and number of words. For very long dialogue turns, this could be a minor factor.
    *   `QUESTION_WORDS.some(qw => words[0] === qw)`: Iterates up to `QUESTION_WORDS.length`. Small constant time.
    *   `COMMAND_VERBS.some(cv => words[0] === cv && !isQuestion)`: Similar, small constant time.
    *   **Interruptions Check:** `prevSegment.content.endsWith("...")` and `segment.content.startsWith("...")`. These are efficient string methods.
    *   **Hedge/Intensifier Logic:** `words.forEach(word => { HEDGE_WORDS.includes(word); INTENSIFIER_WORDS.includes(word); })`. This iterates through all words in a dialogue turn. For each word, `includes` on `HEDGE_WORDS` and `INTENSIFIER_WORDS` arrays is O(M) where M is the length of these arrays.
        *   **Potential Optimization:** Convert `HEDGE_WORDS` and `INTENSIFIER_WORDS` to `Set` objects for O(1) average time complexity lookups (`set.has(word)`). This would change the complexity from O(W*M) to O(W) for this part, where W is word count.
    *   **Topic Control Logic:**
        *   `words.forEach(word => { ... currentTurnTopics.add(word); })`: Iterates all words. String operations (`toLowerCase`, `length`) and `Set.add` are efficient. `STOP_WORDS.includes`, `HEDGE_WORDS.includes`, `INTENSIFIER_WORDS.includes` are again O(M). Same optimization as above applies.
        *   `new Set([...previousTurnTopics].filter(x => currentTurnTopics.has(x)))`: Set intersection. Can be O(P+C) or O(P*C) depending on implementation details (P = size of previousTopics, C = size of currentTopics). For typical topic set sizes, this should be acceptable.
    *   **Pronoun Ratio:** `words.forEach(...)`. Simple iteration and string comparisons. Efficient.
    *   **Response Latency:** `sceneText.substring(...)` creates a new string from the narrative text between segments. If narrative sections are huge, this substring creation could be costly. `/\b(paused|...)\b/.test(textBetween)` is a regex test, generally efficient for this pattern.
        *   **Potential Optimization:** Instead of creating large substrings of narrative, if `TextAnalysisEngine` could also return non-dialogue segments (narrative segments), this logic could operate on those smaller, pre-parsed narrative segments.
    *   **Weaponized Politeness:** `POLITENESS_KEYWORDS.some(pk => text.includes(pk))`. `text.includes` is O(W*L) where L is length of keyword. `some` iterates `POLITENESS_KEYWORDS.length` times. Similar optimization to hedge/intensifier words using `Set` for keywords could be applied if keywords were single words. For phrase-based keywords, `includes` is reasonable.
    *   **Exchange Termination:** `TERMINATION_PHRASES.some(tp => text.includes(tp))`. Similar to politeness. For narration check: `sceneText.substring(segment.endPosition).toLowerCase().split('\n')[0]`. This creates a substring from the *rest of the document* for the last segment, then splits. This could be inefficient if the last segment is early in a very long document.
        *   **Potential Optimization:** Limit the length of `narrationAfter` substring (e.g., only check next 200-300 characters).

**Overall Complexity:**

*   The dominant factor is iterating through each dialogue segment.
*   Inside each segment, iterating through its words is common.
*   Some operations involve checking against predefined lists of keywords.
*   The `TextAnalysisEngine.parseText` is a black box here but is foundational.

**Suggestions for Future Optimization (if performance becomes an issue):**

1.  **Keyword Set Lookups:** Convert `HEDGE_WORDS`, `INTENSIFIER_WORDS`, `STOP_WORDS` (if not already optimized internally by JS engine for `includes` on small arrays) to `Set` objects for faster lookups within loops. This is a low-hanging fruit.
2.  **Optimize Narrative Analysis (Latency/Termination):**
    *   For response latency, if `TextAnalysisEngine` can provide narrative segments, use those instead of large substrings of `sceneText`.
    *   For exchange termination narration check, limit the substring length for `narrationAfter` to avoid processing the entire rest of the document.
3.  **Web Workers for Long Texts:** If the entire analysis is too slow for the main thread with very large documents, consider offloading the `analyzeDialoguePowerBalance` call (or parts of it, if `TextAnalysisEngine` can also run in a worker) to a Web Worker to prevent UI freezing. This is a significant architectural change.
4.  **Caching:** If `sceneText` doesn't change often but analysis is re-requested, caching results based on `sceneText` hash could be an option. (Depends on application flow).
5.  **Profiling:** If performance issues arise, use browser profiling tools to identify the actual bottlenecks in the JavaScript execution. The current analysis is based on code structure, not runtime profiling.
6.  **Incremental Analysis (Advanced):** For a live editor scenario (not the current batch processing model), analyzing only changed segments would be much more complex but optimal.

**Conclusion on Performance:**
For moderately sized texts (e.g., a chapter of a book), the current implementation is likely acceptable. The primary concerns for very large texts would be the substring operations for narrative analysis and the efficiency of keyword lookups within word loops. The `Set` optimization for keyword lists is the easiest first step if needed. The dependency on `TextAnalysisEngine`'s performance is also key.
This completes the performance notes.

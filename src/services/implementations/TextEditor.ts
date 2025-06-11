import { 
  ITextEditor, 
  ContractResult, 
  TextChange, 
  TextFix, 
  ChangeHistory, 
  EditorAnnotation, 
  EditorState, 
  WritingIssue, 
  EditorSettings, 
  BulkFixOperation, 
  CollaborationCursor 
} from '../../types/contracts';
import { SeamManager } from '../SeamManager';

export class TextEditor implements ITextEditor {
  private editorState: EditorState;
  private changeHistory: ChangeHistory;
  private settings: EditorSettings;
  private collaborationCursors = new Map<string, CollaborationCursor>();
  private isAnalyzing = false;
  private analysisTimeout?: NodeJS.Timeout;
  private pendingFixes = new Map<string, TextFix>();
  private nextId = 1;

  // Performance optimization constants
  private static readonly MAX_HISTORY_SIZE = 1000;
  private static readonly ANALYSIS_DEBOUNCE_MS = 2000;
  private static readonly MAX_COLLABORATION_CURSORS = 50;
  private static readonly LARGE_DOCUMENT_THRESHOLD = 100000;

  constructor() {
    this.editorState = this.createInitialState();
    this.changeHistory = this.createInitialHistory();
    this.settings = this.createDefaultSettings();
    this.initializeEditor();
  }

  // Core text editing functionality
  async insertText(position: number, text: string): Promise<ContractResult<TextChange>> {
    try {
      if (position < 0 || position > this.editorState.text.length) {
        return {
          success: false,
          error: `Invalid position ${position}. Must be between 0 and ${this.editorState.text.length}`
        };
      }

      if (!text || text.length === 0) {
        return {
          success: false,
          error: 'Text to insert cannot be empty'
        };
      }

      const change: TextChange = {
        id: `change-${this.nextId++}`,
        type: 'insert',
        position,
        length: text.length,
        oldText: '',
        newText: text,
        timestamp: Date.now(),
        userId: 'local-user'
      };

      // Apply the change
      this.editorState.text = 
        this.editorState.text.slice(0, position) + 
        text + 
        this.editorState.text.slice(position);

      // Update cursor position
      this.editorState.cursorPosition = position + text.length;

      // Update metadata
      this.updateMetadata();

      // Record in history
      this.addToHistory(change);

      // Update annotations positions
      this.adjustAnnotationsForChange(change);

      // Trigger analysis if enabled
      if (this.settings.realTimeAnalysis) {
        this.scheduleAnalysis();
      }

      // Broadcast change for collaboration
      await this.broadcastChange(change);

      return {
        success: true,
        data: change,
        metadata: {
          newTextLength: this.editorState.text.length,
          newCursorPosition: this.editorState.cursorPosition
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to insert text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async deleteText(position: number, length: number): Promise<ContractResult<TextChange>> {
    try {
      if (position < 0 || position >= this.editorState.text.length) {
        return {
          success: false,
          error: `Invalid position ${position}`
        };
      }

      if (length <= 0 || position + length > this.editorState.text.length) {
        return {
          success: false,
          error: `Invalid length ${length} at position ${position}`
        };
      }

      const deletedText = this.editorState.text.slice(position, position + length);

      const change: TextChange = {
        id: `change-${this.nextId++}`,
        type: 'delete',
        position,
        length,
        oldText: deletedText,
        newText: '',
        timestamp: Date.now(),
        userId: 'local-user'
      };

      // Apply the change
      this.editorState.text = 
        this.editorState.text.slice(0, position) + 
        this.editorState.text.slice(position + length);

      // Update cursor position
      this.editorState.cursorPosition = position;

      // Update metadata
      this.updateMetadata();

      // Record in history
      this.addToHistory(change);

      // Update annotations
      this.adjustAnnotationsForChange(change);

      // Trigger analysis if enabled
      if (this.settings.realTimeAnalysis) {
        this.scheduleAnalysis();
      }

      // Broadcast change
      await this.broadcastChange(change);

      return {
        success: true,
        data: change,
        metadata: {
          deletedText,
          newTextLength: this.editorState.text.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async replaceText(position: number, length: number, newText: string): Promise<ContractResult<TextChange>> {
    try {
      if (position < 0 || position >= this.editorState.text.length) {
        return {
          success: false,
          error: `Invalid position ${position}`
        };
      }

      if (length < 0 || position + length > this.editorState.text.length) {
        return {
          success: false,
          error: `Invalid length ${length} at position ${position}`
        };
      }

      const oldText = this.editorState.text.slice(position, position + length);

      const change: TextChange = {
        id: `change-${this.nextId++}`,
        type: 'replace',
        position,
        length,
        oldText,
        newText,
        timestamp: Date.now(),
        userId: 'local-user'
      };

      // Apply the change
      this.editorState.text = 
        this.editorState.text.slice(0, position) + 
        newText + 
        this.editorState.text.slice(position + length);

      // Update cursor position
      this.editorState.cursorPosition = position + newText.length;

      // Update metadata
      this.updateMetadata();

      // Record in history
      this.addToHistory(change);

      // Update annotations
      this.adjustAnnotationsForChange(change);

      // Trigger analysis if enabled
      if (this.settings.realTimeAnalysis) {
        this.scheduleAnalysis();
      }

      // Broadcast change
      await this.broadcastChange(change);

      return {
        success: true,
        data: change,
        metadata: {
          replacedText: oldText,
          newTextLength: this.editorState.text.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to replace text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getText(): Promise<ContractResult<string>> {
    try {
      return {
        success: true,
        data: this.editorState.text,
        metadata: {
          textLength: this.editorState.text.length,
          retrievedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async setText(text: string): Promise<ContractResult<boolean>> {
    try {
      if (typeof text !== 'string') {
        return {
          success: false,
          error: 'Text must be a string'
        };
      }

      const change: TextChange = {
        id: `change-${this.nextId++}`,
        type: 'replace',
        position: 0,
        length: this.editorState.text.length,
        oldText: this.editorState.text,
        newText: text,
        timestamp: Date.now(),
        userId: 'local-user'
      };

      // Set new text
      this.editorState.text = text;
      this.editorState.cursorPosition = 0;

      // Clear annotations and issues
      this.editorState.annotations = [];
      this.editorState.activeIssues = [];
      this.editorState.pendingFixes = [];

      // Update metadata
      this.updateMetadata();

      // Record in history
      this.addToHistory(change);

      // Trigger analysis if enabled
      if (this.settings.realTimeAnalysis) {
        this.scheduleAnalysis();
      }

      return {
        success: true,
        data: true,
        metadata: {
          newTextLength: text.length,
          previousLength: change.oldText.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Issue highlighting and annotation
  async highlightIssues(issues: WritingIssue[]): Promise<ContractResult<EditorAnnotation[]>> {
    try {
      const annotations: EditorAnnotation[] = [];

      for (const issue of issues) {
        // Validate issue
        if (issue.position < 0 || issue.position >= this.editorState.text.length) {
          continue; // Skip invalid issues
        }

        const annotation: EditorAnnotation = {
          id: `annotation-${this.nextId++}`,
          type: 'issue',
          position: issue.position,
          length: issue.length,
          severity: this.mapIssueSeverityToAnnotation(issue.severity),
          message: issue.message,
          category: issue.type,
          data: {
            issueId: issue.id,
            suggestion: issue.suggestion,
            fixes: issue.fixes
          },
          timestamp: Date.now()
        };

        annotations.push(annotation);
        this.editorState.annotations.push(annotation);
      }

      // Update active issues
      this.editorState.activeIssues = [...issues];

      return {
        success: true,
        data: annotations,
        metadata: {
          totalIssues: issues.length,
          annotationsCreated: annotations.length,
          highlightedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to highlight issues: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async clearHighlights(issueIds?: string[]): Promise<ContractResult<boolean>> {
    try {
      if (issueIds && issueIds.length > 0) {
        // Clear specific highlights
        this.editorState.annotations = this.editorState.annotations.filter(
          annotation => 
            annotation.type !== 'issue' || 
            !issueIds.includes(annotation.data?.issueId)
        );
        
        this.editorState.activeIssues = this.editorState.activeIssues.filter(
          issue => !issueIds.includes(issue.id)
        );
      } else {
        // Clear all highlights
        this.editorState.annotations = this.editorState.annotations.filter(
          annotation => annotation.type !== 'issue'
        );
        this.editorState.activeIssues = [];
      }

      return {
        success: true,
        data: true,
        metadata: {
          clearedIssues: issueIds?.length || 'all',
          remainingAnnotations: this.editorState.annotations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear highlights: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async addAnnotation(annotation: EditorAnnotation): Promise<ContractResult<boolean>> {
    try {
      // Validate annotation
      if (annotation.position < 0 || annotation.position >= this.editorState.text.length) {
        return {
          success: false,
          error: 'Invalid annotation position'
        };
      }

      // Ensure unique ID
      annotation.id = annotation.id || `annotation-${this.nextId++}`;
      annotation.timestamp = Date.now();

      this.editorState.annotations.push(annotation);

      return {
        success: true,
        data: true,
        metadata: {
          annotationId: annotation.id,
          totalAnnotations: this.editorState.annotations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add annotation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async removeAnnotation(annotationId: string): Promise<ContractResult<boolean>> {
    try {
      const initialLength = this.editorState.annotations.length;
      this.editorState.annotations = this.editorState.annotations.filter(
        annotation => annotation.id !== annotationId
      );

      const removed = this.editorState.annotations.length < initialLength;

      return {
        success: true,
        data: removed,
        metadata: {
          annotationRemoved: removed,
          remainingAnnotations: this.editorState.annotations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove annotation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getAnnotations(position?: number, length?: number): Promise<ContractResult<EditorAnnotation[]>> {
    try {
      let annotations = this.editorState.annotations;

      if (position !== undefined && length !== undefined) {
        // Filter annotations in range
        const endPosition = position + length;
        annotations = annotations.filter(annotation => {
          const annotationEnd = annotation.position + annotation.length;
          return (
            (annotation.position >= position && annotation.position < endPosition) ||
            (annotationEnd > position && annotationEnd <= endPosition) ||
            (annotation.position <= position && annotationEnd >= endPosition)
          );
        });
      }

      return {
        success: true,
        data: [...annotations], // Return copy
        metadata: {
          totalAnnotations: annotations.length,
          filtered: position !== undefined && length !== undefined
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get annotations: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Suggestion and fix application
  async suggestReplacement(position: number, replacement: string): Promise<ContractResult<TextFix>> {
    try {
      // Find an existing issue at this position
      const issue = this.editorState.activeIssues.find(
        i => i.position <= position && position < i.position + i.length
      );

      const fix: TextFix = {
        id: `fix-${this.nextId++}`,
        issueId: issue?.id || `manual-${this.nextId++}`,
        issueType: issue?.type || 'manual',
        position,
        length: 0,
        originalText: '',
        suggestedText: replacement,
        confidence: 0.8,
        description: `Replace with: "${replacement}"`,
        category: 'suggestion',
        metadata: {
          createdAt: Date.now(),
          source: 'manual'
        }
      };

      this.pendingFixes.set(fix.id, fix);

      return {
        success: true,
        data: fix,
        metadata: {
          fixId: fix.id,
          hasRelatedIssue: !!issue
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to suggest replacement: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async applyFix(fix: TextFix): Promise<ContractResult<TextChange>> {
    try {
      // Apply the fix as a text replacement
      const replaceResult = await this.replaceText(fix.position, fix.length, fix.suggestedText);
      
      if (replaceResult.success && replaceResult.data) {
        // Remove the fix from pending
        this.pendingFixes.delete(fix.id);
        
        // Remove related annotation if exists
        this.editorState.annotations = this.editorState.annotations.filter(
          annotation => annotation.data?.issueId !== fix.issueId
        );

        // Remove related issue
        this.editorState.activeIssues = this.editorState.activeIssues.filter(
          issue => issue.id !== fix.issueId
        );

        return {
          success: true,
          data: replaceResult.data,
          metadata: {
            fixId: fix.id,
            issueId: fix.issueId,
            appliedAt: Date.now()
          }
        };
      }

      return replaceResult;
    } catch (error) {
      return {
        success: false,
        error: `Failed to apply fix: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async applyBulkFixes(fixes: TextFix[]): Promise<ContractResult<BulkFixOperation>> {
    try {
      // Sort fixes by position (descending) to avoid position shifts
      const sortedFixes = [...fixes].sort((a, b) => b.position - a.position);
      
      // Generate preview
      const previewResult = await this.previewBulkFixes(sortedFixes);
      if (!previewResult.success || !previewResult.data) {
        return {
          success: false,
          error: `Failed to generate preview: ${previewResult.error}`
        };
      }

      const bulkOperation: BulkFixOperation = {
        id: `bulk-${this.nextId++}`,
        fixes: sortedFixes,
        preview: previewResult.data,
        affectedIssues: sortedFixes.length,
        estimatedChanges: sortedFixes.reduce((sum, fix) => 
          sum + Math.abs(fix.suggestedText.length - fix.length), 0
        ),
        category: 'selected',
        confirmationRequired: sortedFixes.length > 10
      };

      // Apply all fixes
      let appliedCount = 0;
      const appliedChanges: TextChange[] = [];

      for (const fix of sortedFixes) {
        const applyResult = await this.applyFix(fix);
        if (applyResult.success && applyResult.data) {
          appliedChanges.push(applyResult.data);
          appliedCount++;
        }
      }

      return {
        success: true,
        data: bulkOperation,
        metadata: {
          fixesApplied: appliedCount,
          totalFixes: sortedFixes.length,
          changes: appliedChanges
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to apply bulk fixes: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async previewBulkFixes(fixes: TextFix[]): Promise<ContractResult<string>> {
    try {
      let previewText = this.editorState.text;
      
      // Sort fixes by position (descending) to avoid position shifts
      const sortedFixes = [...fixes].sort((a, b) => b.position - a.position);
      
      // Apply fixes to preview text
      for (const fix of sortedFixes) {
        if (fix.position >= 0 && fix.position + fix.length <= previewText.length) {
          previewText = 
            previewText.slice(0, fix.position) + 
            fix.suggestedText + 
            previewText.slice(fix.position + fix.length);
        }
      }

      return {
        success: true,
        data: previewText,
        metadata: {
          fixesApplied: sortedFixes.length,
          originalLength: this.editorState.text.length,
          previewLength: previewText.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to preview bulk fixes: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async rejectFix(fixId: string): Promise<ContractResult<boolean>> {
    try {
      const rejected = this.pendingFixes.delete(fixId);
      
      return {
        success: true,
        data: rejected,
        metadata: {
          fixId,
          rejected,
          remainingFixes: this.pendingFixes.size
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reject fix: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Change tracking and history
  async trackChanges(): Promise<ContractResult<ChangeHistory>> {
    try {
      return {
        success: true,
        data: { ...this.changeHistory }, // Return copy
        metadata: {
          totalChanges: this.changeHistory.totalChanges,
          currentVersion: this.changeHistory.currentVersion,
          canUndo: this.changeHistory.undoStack.length > 0,
          canRedo: this.changeHistory.redoStack.length > 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to track changes: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async undo(): Promise<ContractResult<TextChange | null>> {
    try {
      if (this.changeHistory.undoStack.length === 0) {
        return {
          success: true,
          data: null,
          metadata: { canUndo: false }
        };
      }

      const change = this.changeHistory.undoStack.pop()!;
      
      // Reverse the change
      switch (change.type) {
        case 'insert':
          // Remove the inserted text
          this.editorState.text = 
            this.editorState.text.slice(0, change.position) + 
            this.editorState.text.slice(change.position + change.length);
          this.editorState.cursorPosition = change.position;
          break;
          
        case 'delete':
          // Restore the deleted text
          this.editorState.text = 
            this.editorState.text.slice(0, change.position) + 
            change.oldText + 
            this.editorState.text.slice(change.position);
          this.editorState.cursorPosition = change.position + change.oldText.length;
          break;
          
        case 'replace':
          // Restore the original text
          this.editorState.text = 
            this.editorState.text.slice(0, change.position) + 
            change.oldText + 
            this.editorState.text.slice(change.position + change.newText.length);
          this.editorState.cursorPosition = change.position + change.oldText.length;
          break;
      }

      // Add to redo stack
      this.changeHistory.redoStack.push(change);

      // Update metadata
      this.updateMetadata();

      return {
        success: true,
        data: change,
        metadata: {
          canUndo: this.changeHistory.undoStack.length > 0,
          canRedo: this.changeHistory.redoStack.length > 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to undo: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async redo(): Promise<ContractResult<TextChange | null>> {
    try {
      if (this.changeHistory.redoStack.length === 0) {
        return {
          success: true,
          data: null,
          metadata: { canRedo: false }
        };
      }

      const change = this.changeHistory.redoStack.pop()!;
      
      // Reapply the change
      switch (change.type) {
        case 'insert':
          this.editorState.text = 
            this.editorState.text.slice(0, change.position) + 
            change.newText + 
            this.editorState.text.slice(change.position);
          this.editorState.cursorPosition = change.position + change.newText.length;
          break;
          
        case 'delete':
          this.editorState.text = 
            this.editorState.text.slice(0, change.position) + 
            this.editorState.text.slice(change.position + change.length);
          this.editorState.cursorPosition = change.position;
          break;
          
        case 'replace':
          this.editorState.text = 
            this.editorState.text.slice(0, change.position) + 
            change.newText + 
            this.editorState.text.slice(change.position + change.length);
          this.editorState.cursorPosition = change.position + change.newText.length;
          break;
      }

      // Add back to undo stack
      this.changeHistory.undoStack.push(change);

      // Update metadata
      this.updateMetadata();

      return {
        success: true,
        data: change,
        metadata: {
          canUndo: this.changeHistory.undoStack.length > 0,
          canRedo: this.changeHistory.redoStack.length > 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to redo: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getChangeHistory(): Promise<ContractResult<ChangeHistory>> {
    try {
      return {
        success: true,
        data: { ...this.changeHistory },
        metadata: {
          totalChanges: this.changeHistory.totalChanges,
          historySize: this.changeHistory.changes.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get change history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async clearHistory(): Promise<ContractResult<boolean>> {
    try {
      this.changeHistory = this.createInitialHistory();
      
      return {
        success: true,
        data: true,
        metadata: { clearedAt: Date.now() }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Real-time analysis integration
  async enableRealTimeAnalysis(enabled: boolean): Promise<ContractResult<boolean>> {
    try {
      this.settings.realTimeAnalysis = enabled;
      
      if (enabled) {
        // Trigger immediate analysis if enabled
        this.scheduleAnalysis();
      } else {
        // Clear scheduled analysis
        if (this.analysisTimeout) {
          clearTimeout(this.analysisTimeout);
          this.analysisTimeout = undefined;
        }
      }

      await this.saveSettings();

      return {
        success: true,
        data: enabled,
        metadata: { settingApplied: Date.now() }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to enable real-time analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async triggerAnalysis(): Promise<ContractResult<WritingIssue[]>> {
    try {
      if (this.isAnalyzing) {
        return {
          success: false,
          error: 'Analysis already in progress'
        };
      }

      this.isAnalyzing = true;
      this.editorState.isAnalyzing = true;
      this.editorState.analysisProgress = 0;

      try {
        const seamManager = SeamManager.getInstance();
        const writingAnalyzer = seamManager.getWritingQualityAnalyzer();
        
        // Update progress
        this.editorState.analysisProgress = 25;

        const reportResult = await writingAnalyzer.generateQualityReport(this.editorState.text);
        
        if (!reportResult.success || !reportResult.data) {
          throw new Error(reportResult.error || 'Analysis failed');
        }

        // Update progress
        this.editorState.analysisProgress = 75;

        // Convert analysis results to writing issues
        const issues: WritingIssue[] = [];
        let issueId = this.nextId++;

        // Convert show/tell issues
        for (const showTell of reportResult.data.showTellIssues) {
          issues.push({
            id: `issue-${issueId++}`,
            type: 'show_tell',
            severity: showTell.severity === 'high' ? 'high' : showTell.severity === 'medium' ? 'medium' : 'low',
            position: showTell.position,
            length: showTell.text.length,
            text: showTell.text,
            message: showTell.suggestion,
            suggestion: showTell.example,
            fixes: [],
            category: 'show_tell',
            confidence: 0.8,
            source: 'writing_analyzer'
          });
        }

        // Convert trope matches
        for (const trope of reportResult.data.tropeMatches) {
          issues.push({
            id: `issue-${issueId++}`,
            type: 'trope',
            severity: trope.confidence > 0.8 ? 'medium' : 'low',
            position: trope.position,
            length: trope.text.length,
            text: trope.text,
            message: `Common trope detected: ${trope.name}`,
            suggestion: trope.subversionSuggestions[0],
            fixes: [],
            category: 'trope',
            confidence: trope.confidence,
            source: 'writing_analyzer'
          });
        }

        // Convert purple prose issues
        for (const prose of reportResult.data.purpleProseIssues) {
          issues.push({
            id: `issue-${issueId++}`,
            type: 'purple_prose',
            severity: prose.severity === 'severe' ? 'high' : prose.severity === 'moderate' ? 'medium' : 'low',
            position: prose.position,
            length: prose.text.length,
            text: prose.text,
            message: prose.suggestion,
            suggestion: prose.simplifiedVersion,
            fixes: [],
            category: 'purple_prose',
            confidence: 0.75,
            source: 'writing_analyzer'
          });
        }

        // Update progress
        this.editorState.analysisProgress = 100;

        // Highlight the issues
        await this.highlightIssues(issues);

        // Update metadata
        this.editorState.metadata.lastAnalysis = Date.now();

        return {
          success: true,
          data: issues,
          metadata: {
            totalIssues: issues.length,
            analysisTime: Date.now(),
            reportScores: reportResult.data.overallScore
          }
        };
      } finally {
        this.isAnalyzing = false;
        this.editorState.isAnalyzing = false;
        this.editorState.analysisProgress = 0;
      }
    } catch (error) {
      this.isAnalyzing = false;
      this.editorState.isAnalyzing = false;
      this.editorState.analysisProgress = 0;
      
      return {
        success: false,
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getAnalysisStatus(): Promise<ContractResult<{ isAnalyzing: boolean; progress: number }>> {
    try {
      return {
        success: true,
        data: {
          isAnalyzing: this.editorState.isAnalyzing,
          progress: this.editorState.analysisProgress
        },
        metadata: {
          lastAnalysis: this.editorState.metadata.lastAnalysis,
          totalIssues: this.editorState.activeIssues.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get analysis status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async setAnalysisSettings(settings: Partial<EditorSettings>): Promise<ContractResult<EditorSettings>> {
    try {
      this.settings = { ...this.settings, ...settings };
      await this.saveSettings();

      return {
        success: true,
        data: { ...this.settings },
        metadata: { updatedAt: Date.now() }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set analysis settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Editor state management
  async getEditorState(): Promise<ContractResult<EditorState>> {
    try {
      return {
        success: true,
        data: { ...this.editorState },
        metadata: { retrievedAt: Date.now() }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get editor state: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async setEditorState(state: Partial<EditorState>): Promise<ContractResult<boolean>> {
    try {
      this.editorState = { ...this.editorState, ...state };
      
      return {
        success: true,
        data: true,
        metadata: { updatedAt: Date.now() }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set editor state: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async setCursorPosition(position: number): Promise<ContractResult<boolean>> {
    try {
      if (position < 0 || position > this.editorState.text.length) {
        return {
          success: false,
          error: `Invalid cursor position ${position}`
        };
      }

      this.editorState.cursorPosition = position;
      
      return {
        success: true,
        data: true,
        metadata: { position }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set cursor position: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async setSelection(start: number, end: number): Promise<ContractResult<boolean>> {
    try {
      if (start < 0 || end < 0 || start > this.editorState.text.length || end > this.editorState.text.length) {
        return {
          success: false,
          error: 'Invalid selection range'
        };
      }

      if (start > end) {
        [start, end] = [end, start]; // Swap if backwards
      }

      this.editorState.selection = { start, end };
      this.editorState.cursorPosition = end;

      return {
        success: true,
        data: true,
        metadata: { start, end, length: end - start }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set selection: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Advanced features
  async findText(query: string, options?: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }): Promise<ContractResult<{ position: number; length: number }[]>> {
    try {
      if (!query) {
        return {
          success: false,
          error: 'Search query cannot be empty'
        };
      }

      const opts = {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
        ...options
      };

      const matches: { position: number; length: number }[] = [];
      let searchText = this.editorState.text;
      let searchQuery = query;

      if (!opts.caseSensitive) {
        searchText = searchText.toLowerCase();
        searchQuery = searchQuery.toLowerCase();
      }

      if (opts.regex) {
        try {
          const flags = opts.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(searchQuery, flags);
          let match;

          while ((match = regex.exec(searchText)) !== null) {
            matches.push({
              position: match.index,
              length: match[0].length
            });
          }
        } catch (error) {
          return {
            success: false,
            error: 'Invalid regular expression'
          };
        }
      } else {
        let startIndex = 0;
        while (true) {
          const index = searchText.indexOf(searchQuery, startIndex);
          if (index === -1) break;

          // Check word boundaries if wholeWord is enabled
          if (opts.wholeWord) {
            const beforeChar = index > 0 ? this.editorState.text[index - 1] : ' ';
            const afterChar = index + query.length < this.editorState.text.length ? 
              this.editorState.text[index + query.length] : ' ';
            
            if (!/\W/.test(beforeChar) || !/\W/.test(afterChar)) {
              startIndex = index + 1;
              continue;
            }
          }

          matches.push({
            position: index,
            length: query.length
          });

          startIndex = index + 1;
        }
      }

      return {
        success: true,
        data: matches,
        metadata: {
          totalMatches: matches.length,
          query,
          options: opts
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find text: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async replaceAll(search: string, replace: string, options?: { caseSensitive?: boolean; wholeWord?: boolean }): Promise<ContractResult<number>> {
    try {
      const findResult = await this.findText(search, options);
      if (!findResult.success || !findResult.data) {
        return {
          success: false,
          error: `Find operation failed: ${findResult.error}`
        };
      }

      const matches = findResult.data;
      let replacedCount = 0;

      // Sort matches by position (descending) to avoid position shifts
      const sortedMatches = matches.sort((a, b) => b.position - a.position);

      for (const match of sortedMatches) {
        const replaceResult = await this.replaceText(match.position, match.length, replace);
        if (replaceResult.success) {
          replacedCount++;
        }
      }

      return {
        success: true,
        data: replacedCount,
        metadata: {
          totalMatches: matches.length,
          replacedCount,
          search,
          replace
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to replace all: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getWordCount(): Promise<ContractResult<{ characters: number; words: number; paragraphs: number; lines: number }>> {
    try {
      const text = this.editorState.text;
      
      const characters = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
      const lines = text.split('\n').length;

      const stats = { characters, words, paragraphs, lines };

      return {
        success: true,
        data: stats,
        metadata: {
          calculatedAt: Date.now(),
          textLength: text.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get word count: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async exportWithChanges(format: 'markdown' | 'html' | 'text'): Promise<ContractResult<string>> {
    try {
      const text = this.editorState.text;
      
      switch (format) {
        case 'text':
          return {
            success: true,
            data: text,
            metadata: { format, exportedAt: Date.now() }
          };
          
        case 'markdown':
          // Simple markdown conversion (could be enhanced)
          const markdownText = text
            .replace(/\n\n+/g, '\n\n') // Normalize paragraph breaks
            .replace(/^(.+)$/gm, '$1  '); // Add markdown line breaks
          
          return {
            success: true,
            data: markdownText,
            metadata: { format, exportedAt: Date.now() }
          };
          
        case 'html':
          // Simple HTML conversion
          const htmlText = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exported Text</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        p { margin-bottom: 1em; }
    </style>
</head>
<body>
${text.split('\n\n').map(p => `    <p>${p.replace(/\n/g, '<br>')}</p>`).join('\n')}
</body>
</html>`;
          
          return {
            success: true,
            data: htmlText,
            metadata: { format, exportedAt: Date.now() }
          };
          
        default:
          return {
            success: false,
            error: `Unsupported export format: ${format}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Collaboration features
  async addCollaborationCursor(cursor: CollaborationCursor): Promise<ContractResult<boolean>> {
    try {
      // Limit number of collaboration cursors for performance
      if (this.collaborationCursors.size >= TextEditor.MAX_COLLABORATION_CURSORS) {
        // Remove oldest cursor
        const oldestUserId = Array.from(this.collaborationCursors.keys())[0];
        this.collaborationCursors.delete(oldestUserId);
      }

      cursor.timestamp = Date.now();
      this.collaborationCursors.set(cursor.userId, cursor);

      return {
        success: true,
        data: true,
        metadata: {
          userId: cursor.userId,
          totalCursors: this.collaborationCursors.size
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add collaboration cursor: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async removeCollaborationCursor(userId: string): Promise<ContractResult<boolean>> {
    try {
      const removed = this.collaborationCursors.delete(userId);
      
      return {
        success: true,
        data: removed,
        metadata: {
          userId,
          removed,
          remainingCursors: this.collaborationCursors.size
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove collaboration cursor: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getCollaborationCursors(): Promise<ContractResult<CollaborationCursor[]>> {
    try {
      const cursors = Array.from(this.collaborationCursors.values());
      
      return {
        success: true,
        data: cursors,
        metadata: {
          totalCursors: cursors.length,
          retrievedAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get collaboration cursors: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async broadcastChange(change: TextChange): Promise<ContractResult<boolean>> {
    try {
      // In a real implementation, this would broadcast to other clients
      // For now, we'll just log the change
      console.log('Broadcasting change:', change);
      
      return {
        success: true,
        data: true,
        metadata: {
          changeId: change.id,
          broadcastAt: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to broadcast change: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private helper methods
  private createInitialState(): EditorState {
    return {
      text: '',
      cursorPosition: 0,
      annotations: [],
      activeIssues: [],
      pendingFixes: [],
      isAnalyzing: false,
      analysisProgress: 0,
      metadata: {
        lastAnalysis: 0,
        characterCount: 0,
        wordCount: 0,
        paragraphCount: 0
      }
    };
  }

  private createInitialHistory(): ChangeHistory {
    return {
      changes: [],
      currentVersion: 0,
      totalVersions: 0,
      undoStack: [],
      redoStack: [],
      metadata: {
        createdAt: Date.now(),
        lastModified: Date.now(),
        totalChanges: 0,
        sessionId: `session-${Date.now()}`
      }
    };
  }

  private createDefaultSettings(): EditorSettings {
    return {
      realTimeAnalysis: true,
      analysisDelay: TextEditor.ANALYSIS_DEBOUNCE_MS,
      showInlineIssues: true,
      highlightSeverity: 'medium',
      enableAutoFix: false,
      showSuggestions: true,
      fontSize: 14,
      theme: 'light',
      lineNumbers: false,
      wordWrap: true
    };
  }

  private async initializeEditor(): Promise<void> {
    try {
      await this.loadSettings();
      await this.loadEditorState();
    } catch (error) {
      console.warn('Failed to initialize editor:', error);
    }
  }

  private updateMetadata(): void {
    const text = this.editorState.text;
    this.editorState.metadata = {
      ...this.editorState.metadata,
      characterCount: text.length,
      wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
      paragraphCount: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
    };
  }

  private addToHistory(change: TextChange): void {
    // Add to changes list
    this.changeHistory.changes.push(change);
    
    // Add to undo stack
    this.changeHistory.undoStack.push(change);
    
    // Clear redo stack when new change is made
    this.changeHistory.redoStack = [];
    
    // Limit history size for performance
    if (this.changeHistory.undoStack.length > TextEditor.MAX_HISTORY_SIZE) {
      this.changeHistory.undoStack.shift();
    }
    
    if (this.changeHistory.changes.length > TextEditor.MAX_HISTORY_SIZE) {
      this.changeHistory.changes.shift();
    }
    
    // Update metadata
    this.changeHistory.currentVersion++;
    this.changeHistory.totalVersions++;
    this.changeHistory.metadata.totalChanges++;
    this.changeHistory.metadata.lastModified = Date.now();
  }

  private adjustAnnotationsForChange(change: TextChange): void {
    for (const annotation of this.editorState.annotations) {
      if (change.type === 'insert') {
        if (annotation.position >= change.position) {
          annotation.position += change.length;
        }
      } else if (change.type === 'delete') {
        if (annotation.position >= change.position + change.length) {
          annotation.position -= change.length;
        } else if (annotation.position >= change.position) {
          // Annotation is within deleted range
          annotation.position = change.position;
          annotation.length = Math.max(0, annotation.length - (change.position + change.length - annotation.position));
        }
      } else if (change.type === 'replace') {
        if (annotation.position >= change.position + change.length) {
          annotation.position += change.newText.length - change.length;
        } else if (annotation.position >= change.position) {
          // Annotation overlaps with replacement
          annotation.position = change.position;
          annotation.length = Math.max(0, annotation.length - change.length + change.newText.length);
        }
      }
    }
  }

  private scheduleAnalysis(): void {
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
    }

    this.analysisTimeout = setTimeout(() => {
      this.triggerAnalysis().catch(error => {
        console.error('Scheduled analysis failed:', error);
      });
    }, this.settings.analysisDelay);
  }

  private mapIssueSeverityToAnnotation(severity: string): 'info' | 'warning' | 'error' {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      localStorage.setItem('textEditor_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save editor settings:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem('textEditor_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load editor settings:', error);
    }
  }

  private async loadEditorState(): Promise<void> {
    try {
      const stored = localStorage.getItem('textEditor_state');
      if (stored) {
        const state = JSON.parse(stored);
        this.editorState = { ...this.editorState, ...state };
      }
    } catch (error) {
      console.warn('Failed to load editor state:', error);
    }
  }

  public async saveEditorState(): Promise<void> {
    try {
      // Only save essential state, not transient data
      const stateToSave = {
        text: this.editorState.text,
        cursorPosition: this.editorState.cursorPosition,
        selection: this.editorState.selection
      };
      localStorage.setItem('textEditor_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save editor state:', error);
    }
  }
}
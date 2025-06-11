# Story Voice Studio - Complete User Manual 📖

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating Your First Audiobook](#creating-your-first-audiobook)
3. [Understanding the Interface](#understanding-the-interface)
4. [Advanced Features](#advanced-features)
5. [Project Management](#project-management)
6. [Writing Quality Analysis](#writing-quality-analysis)
7. [Voice Customization](#voice-customization)
8. [Audio Controls](#audio-controls)
9. [Export and Sharing](#export-and-sharing)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements
- **Modern web browser** (Chrome recommended)
- **Internet connection** (for ElevenLabs AI voices, optional)
- **4GB RAM minimum** for large documents
- **50MB free browser storage** for projects

### First Launch
1. Open Story Voice Studio in your web browser
2. The application loads automatically - no installation required
3. You'll see the main interface with story input area
4. All processing happens locally in your browser for privacy

### ElevenLabs Setup (Optional)
For ultra-realistic AI voices:
1. Click **"Setup ElevenLabs"** in the header
2. Visit [ElevenLabs.io](https://elevenlabs.io) to create an account
3. Copy your API key from Profile → API Keys
4. Paste the key in Story Voice Studio
5. You'll get 10,000 free characters per month

---

## Creating Your First Audiobook

### Step 1: Prepare Your Text
- **Dialogue formatting**: Use quotation marks ("Hello," said John)
- **Clear attribution**: Identify who is speaking
- **Character consistency**: Use the same name throughout
- **Good structure**: Mix dialogue and narration

### Step 2: Input Your Story
1. **Text Input Tab**: Paste or type your story directly
2. **File Upload Tab**: Upload a .txt file (up to 10MB)
3. **Sample Story**: Click "Load Sample Story" to try a demo

### Step 3: Generate Audiobook
1. Click **"Generate Audiobook"** button
2. Watch the progress indicator as it:
   - Analyzes text structure
   - Detects characters and dialogue
   - Assigns unique voices
   - Generates audio segments
   - Combines final audiobook

### Step 4: Listen and Customize
1. **Play your audiobook** using the built-in player
2. **Review character voices** in the character list
3. **Adjust settings** if needed
4. **Download** when satisfied

---

## Understanding the Interface

### Header Navigation
- **Story Voice Studio** - Logo and app title
- **View Tabs** - Switch between Audiobook, Analysis, Voices, Progress
- **Projects Button** - Open project manager
- **ElevenLabs Status** - Shows connection status
- **Start Over** - Reset current session

### Main Content Areas

#### Audiobook View
- **Audio Player** - Main playback controls
- **Advanced Controls** - Speed, volume, bookmarks
- **Character List** - Character details and voice previews
- **Audio Statistics** - Duration, segments, characters

#### Analysis View
- **Quality Overview** - Overall writing scores
- **Show vs Tell** - Detailed issue analysis
- **Trope Detection** - Common tropes with subversion ideas
- **Prose Quality** - Style and clarity feedback

#### Voices View
- **Character Selection** - Choose character to customize
- **Voice Adjustments** - Pitch, speed, tone controls
- **Preview System** - Real-time voice testing
- **Save/Load** - Custom voice profiles

#### Progress View
- **Development Status** - Current completion status
- **Feature Roadmap** - Upcoming enhancements
- **Next Steps** - Development prompts for expansion

### Status Indicators
- **🟢 Green**: Completed or successful operations
- **🟡 Yellow**: In progress or warnings
- **🔴 Red**: Errors or failed operations
- **ℹ️ Blue**: Information or tips

---

## Advanced Features

### Character Detection
**How it works**: AI analyzes your text to identify:
- Unique speakers through dialogue attribution
- Character traits and personality indicators
- Emotional states and speech patterns
- Main vs. supporting character roles

**Manual Override**: 
- Edit character names in the character list
- Merge characters that were split incorrectly
- Add custom character descriptions

### Voice Assignment Algorithm
**Automatic Assignment**:
- Gender detection from names and context
- Age estimation from character description
- Tone assignment based on emotional states
- Voice uniqueness to prevent duplicates

**Quality Factors**:
- Character frequency (more dialogue = better voice match)
- Consistency checking across all assignments
- Narrator gets special neutral voice
- Main characters get priority voice selection

### Text Processing Engine
**Dialogue Detection**:
- Multiple quotation mark formats supported
- Thought vs. spoken dialogue distinction
- Attribution parsing with confidence scoring
- Context-aware speaker identification

**Narrative Analysis**:
- Scene vs. dialogue separation
- Mood and tone detection
- Pacing analysis for natural audio flow
- Character voice consistency checking

---

## Project Management

### Creating Projects
1. **Start New Project**: Use "New Project" button
2. **From Template**: Choose from fiction, educational, or custom templates
3. **Import Project**: Load previously exported projects
4. **Auto-naming**: Projects named automatically from content

### Saving and Loading
**Auto-save**: 
- Enabled by default every 5 minutes
- Saves text, characters, voices, and settings
- No data loss during browser crashes

**Manual Save**:
- Use "Save Current" in project manager
- Includes complete project state
- Preserves custom voice adjustments

**Loading Projects**:
- Browse all saved projects
- Search by name, content, or tags
- Sort by date, name, or completion status
- Preview project details before opening

### Project Organization
**Tagging System**:
- Add tags like "fiction", "fantasy", "work-in-progress"
- Filter projects by multiple tags
- Organize large project collections

**Project Templates**:
- Save successful projects as templates
- Include custom voice settings
- Share templates between users (future feature)

**Storage Management**:
- View storage usage statistics
- Clean up old projects and backups
- Export projects for external backup

---

## Writing Quality Analysis

### Show vs Tell Analysis
**What it detects**:
- Emotional telling ("She was angry" vs. "She slammed the door")
- State descriptions ("He was tired" vs. "His eyelids drooped")
- Character descriptions (telling vs. showing traits)
- Internal thoughts that could be externalized

**Severity Levels**:
- **Low**: Minor improvements, stylistic suggestions
- **Medium**: Noticeable impact on reader engagement
- **High**: Significant issues affecting story quality

**Improvement Suggestions**:
- Specific examples of showing alternatives
- Context-aware recommendations
- Writing technique explanations

### Trope Detection
**Covered Tropes** (50+ patterns):
- Character tropes (Chosen One, Mentor figure)
- Plot tropes (Love at first sight, Hero's journey)
- Setting tropes (Dark stormy night, Hidden magical world)
- Dialogue tropes (Last words, Dramatic irony)

**Subversion Ideas**:
- Creative alternatives to common tropes
- Ways to twist reader expectations
- Modern takes on classic patterns
- Genre-specific subversions

### Purple Prose Analysis
**Detection Patterns**:
- Excessive adjective stacking
- Overly complex metaphors
- Redundant descriptions
- Flowery language that obscures meaning

**Clarity Suggestions**:
- Simplified alternatives
- More direct phrasing
- Reader comprehension improvements
- Style consistency recommendations

### Quality Scoring
**Scoring System** (0-100 scale):
- **90-100**: Exceptional, publication-ready
- **80-89**: Strong writing with minor improvements
- **70-79**: Good foundation, some areas to develop
- **60-69**: Needs work, several issues to address
- **Below 60**: Significant revision recommended

---

## Voice Customization

### Character Voice Editor
**Voice Parameters**:
- **Pitch**: -1.0 to +1.0 relative adjustment
- **Speed**: -1.0 to +1.0 relative adjustment  
- **Tone**: Warm, Cold, Neutral, Dramatic
- **Emphasis**: 0.0 to 1.0 intensity control

**Real-time Preview**:
- Generate voice samples instantly
- Test with character-appropriate dialogue
- Compare before/after adjustments
- Contextual preview text selection

### Voice Profile Management
**Saving Custom Voices**:
- Save adjustments per character
- Name and organize voice profiles
- Export voice settings to file
- Import voice configurations

**Voice Libraries**:
- Build collections of character voices
- Organize by genre or story type
- Share voice libraries (future feature)
- Template voices for common character types

### Advanced Voice Features
**ElevenLabs Integration**:
- Access to 100+ premium voices
- Emotion and style controls
- Character consistency across sessions
- Professional audiobook quality

**Browser Voice Enhancement**:
- Optimize built-in voices for characters
- Gender and age appropriate selection
- Cross-platform voice compatibility
- Quality improvement filters

---

## Audio Controls

### Playback Controls
**Basic Controls**:
- Play/Pause with spacebar
- Restart from beginning
- Volume control with visual feedback
- Progress scrubbing and time display

**Advanced Speed Control**:
- 0.25x to 4.0x playback speed
- Presets for common speeds (0.5x, 1x, 1.5x, 2x)
- Maintains audio quality at all speeds
- Speed persistence across sessions

### Character Audio Mixing
**Individual Character Controls**:
- Volume slider for each character (0-100%)
- Mute/unmute specific characters
- Solo character (hear only one character)
- Visual volume indicators

**Mixing Scenarios**:
- **Dialogue focus**: Reduce narrator volume
- **Character study**: Solo specific characters
- **Volume balancing**: Ensure all voices audible
- **Accessibility**: Adjust for hearing preferences

### Bookmark System
**Creating Bookmarks**:
- Click to bookmark current position
- Add descriptive labels
- Automatic chapter detection
- Scene and dialogue bookmarking

**Bookmark Management**:
- Edit bookmark labels and descriptions
- Delete unwanted bookmarks
- Reorder bookmark list
- Export bookmark list as text

**Navigation Features**:
- Jump to bookmarks with one click
- Keyboard shortcuts for bookmark navigation
- Visual bookmark indicators on progress bar
- Bookmark-based chapter organization

### Export Features
**Timestamp Export**:
- SRT subtitle format for video
- VTT format for web players
- Custom timestamp formats
- Chapter marker generation

**Audio Export Options**:
- High-quality MP3 (with ElevenLabs)
- Uncompressed WAV (browser voices)
- Metadata embedding (title, characters, chapters)
- Multiple quality levels

---

## Export and Sharing

### Audio Export
**Format Options**:
- **MP3**: Compressed, smaller file size, universal compatibility
- **WAV**: Uncompressed, highest quality, larger file size
- **Automatic selection**: Based on voice source used

**Quality Settings**:
- ElevenLabs: Professional 44.1kHz, 16-bit
- Browser voices: Variable based on system capabilities
- Metadata: Character information, bookmarks, chapters

### Project Export
**Complete Project Backup**:
- JSON format with all project data
- Includes text, characters, voices, settings
- Audio data (optional, increases file size)
- Import/export across devices

**Selective Export**:
- Text only (for sharing with others)
- Voice settings only (for reuse)
- Analysis results (for writing improvement)
- Custom combinations based on needs

### Sharing Options
**Current Capabilities**:
- Download files for manual sharing
- Export project links (local only)
- Voice configuration sharing

**Future Features** (planned):
- Cloud storage integration
- Direct social media sharing
- Collaborative project editing
- Public project galleries

---

## Troubleshooting

### Common Issues

#### Processing Problems
**"Processing takes too long"**:
- Large documents (100k+ chars) take 1-5 minutes
- Use progressive processing for better feedback
- Close other browser tabs to free memory
- Chrome performs better than other browsers

**"Characters not detected properly"**:
- Ensure dialogue uses standard quotation marks
- Check that speaker attribution is clear ("Hello," said John)
- Use consistent character names throughout
- Review and edit character list manually if needed

#### Audio Issues
**"No sound playing"**:
- Check browser audio permissions
- Verify volume levels (both browser and system)
- Try downloading audio and playing externally
- Refresh page and regenerate if needed

**"Poor audio quality"**:
- Browser voices vary by system and browser
- Consider upgrading to ElevenLabs for better quality
- Check that audio format is supported
- Ensure stable internet for ElevenLabs voices

#### ElevenLabs Problems
**"API key not working"**:
- Verify key is copied correctly (no extra spaces)
- Check ElevenLabs account has remaining credits
- Ensure account is in good standing
- Try regenerating API key if still failing

**"Voices sound wrong"**:
- ElevenLabs voices may differ from browser preview
- Try different voice selections in character list
- Adjust voice parameters in customization panel
- Report issues to ElevenLabs support if persistent

#### Storage and Projects
**"Project won't save"**:
- Check browser localStorage is enabled
- Verify sufficient storage space available
- Disable private/incognito browsing mode
- Clear old projects if storage is full

**"Lost my project"**:
- Check project manager for auto-saved versions
- Look for exported backup files
- Projects only persist in same browser/device
- Consider regular project exports as backup

### Performance Tips

#### For Large Documents
- Use progressive processing for 100k+ character stories
- Break very large works into chapters/sections
- Close unnecessary browser tabs during processing
- Allow background processing to complete

#### Memory Management
- Refresh browser after processing multiple large projects
- Clear cache if experiencing slowdowns
- Monitor browser memory usage in Task Manager
- Consider upgrading RAM for very large documents

#### Browser Optimization
- **Chrome**: Best performance and compatibility
- **Firefox**: Good performance, some limitations
- **Safari**: Works but reduced Worker support
- **Edge**: Full compatibility, good performance

### Getting Help

#### Self-Service Resources
1. **This User Manual**: Comprehensive feature guide
2. **FAQ**: Common questions and answers
3. **Progress Dashboard**: Development status and roadmap
4. **In-app Help**: Tooltips and contextual guidance

#### Contact Support
- **Bug Reports**: Include browser, steps to reproduce, expected vs actual behavior
- **Feature Requests**: Describe desired functionality and use case
- **Technical Issues**: Include system specs, error messages, and screenshots
- **General Questions**: We're here to help with any aspect of the application

---

## Advanced Tips and Tricks

### Writing Better Stories for Audio
1. **Strong dialogue tags**: Make speaker attribution crystal clear
2. **Character voice distinction**: Give each character unique speech patterns
3. **Balanced pacing**: Mix dialogue with descriptive passages
4. **Audio-friendly formatting**: Use standard punctuation for better synthesis

### Optimizing Voice Selection
1. **Character personality**: Match voice tone to character traits
2. **Age appropriate**: Ensure voice age matches character description
3. **Voice contrast**: Make sure main characters sound distinctly different
4. **Narrator consideration**: Choose neutral, pleasant narrator voice

### Project Organization
1. **Consistent naming**: Use clear, descriptive project names
2. **Strategic tagging**: Tag projects for easy filtering and organization
3. **Regular backups**: Export important projects regularly
4. **Version control**: Save major revisions as separate projects

### Professional Results
1. **Quality source text**: Well-edited stories produce better audiobooks
2. **Voice customization**: Spend time perfecting character voices
3. **Bookmark structure**: Create logical chapter and scene bookmarks
4. **Final review**: Listen to entire audiobook before considering complete

---

*Story Voice Studio - Your Complete Guide to AI Audiobook Creation*

**Version 1.0** | Last Updated: December 2024
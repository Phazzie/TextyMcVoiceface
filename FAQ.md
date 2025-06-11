# Frequently Asked Questions 🤔

## General Questions

### What is Story Voice Studio?
Story Voice Studio is an AI-powered web application that transforms written stories into multi-voice audiobooks while providing comprehensive writing quality analysis. It automatically detects characters, assigns unique voices, and generates professional-quality audio output.

### Is it free to use?
Yes! Story Voice Studio works completely free with browser-based text-to-speech. For ultra-realistic AI voices, you can optionally connect your ElevenLabs account (which has a free tier with 10,000 characters per month).

### Do I need to install anything?
No installation required! Story Voice Studio runs entirely in your web browser. Just open the website and start creating audiobooks immediately.

### What browsers are supported?
- **Chrome** (recommended for best performance)
- **Firefox** (full compatibility)
- **Safari** (reduced Worker support, still functional)
- **Edge** (full compatibility)

## Getting Started

### How do I create my first audiobook?
1. Open Story Voice Studio in your browser
2. Paste or type your story text in the input area
3. Click "Generate Audiobook" 
4. Wait for processing (usually 5-30 seconds)
5. Listen to your audiobook and download if satisfied

### What kind of text works best?
- **Fiction stories** with dialogue and multiple characters
- **Clear dialogue attribution** (e.g., "Hello," said John)
- **Well-structured narratives** with distinct character voices
- **Any length** from short stories to full novels

### Can I use copyrighted text?
Only use text you own or have permission to use. Story Voice Studio is for personal use, education, and content you have rights to convert.

## Features & Functionality

### How does character detection work?
Our AI analyzes your text to:
- Identify dialogue vs. narration
- Detect unique speakers through attribution patterns
- Analyze character traits and emotional states
- Assign appropriate voice characteristics automatically

### Can I customize character voices?
Absolutely! Story Voice Studio offers:
- **Real-time voice preview** with instant adjustments
- **Custom voice profiles** with pitch, speed, and tone controls
- **Save/load voice settings** for consistent character voices
- **Import/export** voice configurations between projects

### What audio controls are available?
- **Playback speed**: 0.25x to 4.0x speed control
- **Character volumes**: Individual volume control per character
- **Bookmarks**: Create and manage audio bookmarks
- **Export timestamps**: Generate SRT/VTT subtitle files
- **Advanced mixing**: Solo/mute characters during playback

### What is writing quality analysis?
Our analysis engine provides:
- **Show vs Tell detection**: Identifies areas for improvement
- **Trope analysis**: Recognizes common tropes with subversion ideas
- **Purple prose detection**: Flags overly flowery language
- **Quality scoring**: 0-100 scores across multiple dimensions

## Technical Questions

### How large documents can I process?
- **Small stories** (under 10k characters): Near-instant processing
- **Medium stories** (10k-100k characters): 5-30 seconds
- **Large documents** (100k-500k characters): 1-5 minutes
- **Very large** (500k+ characters): Progressive processing with real-time updates

### Where is my data stored?
- **Locally in your browser**: All projects stored in browser localStorage
- **No cloud storage**: Your stories never leave your device
- **Privacy-focused**: We don't collect or store your personal content
- **Export/backup**: Download projects for external backup

### Does it work offline?
- **Text processing**: Works completely offline
- **Browser voices**: Available offline
- **ElevenLabs AI**: Requires internet connection
- **Project management**: Fully functional offline

### How much storage does it use?
- **Base application**: ~10MB
- **Average project**: 1-5MB (including audio)
- **Large projects**: 10-50MB (depending on audio length)
- **Browser storage**: Uses localStorage (usually 5-10GB available)

## Audio & Voice Questions

### What's the difference between browser voices and ElevenLabs?
- **Browser voices**: Free, instant, good quality, built into your browser
- **ElevenLabs AI**: Ultra-realistic, human-like, requires API key, costs money

### How do I get ElevenLabs API key?
1. Visit [ElevenLabs.io](https://elevenlabs.io)
2. Create a free account
3. Go to Profile → API Keys
4. Copy your API key
5. Paste it in Story Voice Studio settings

### Can I use my own voice recordings?
Currently, Story Voice Studio uses text-to-speech synthesis. Custom voice recordings aren't supported yet, but it's on our roadmap.

### What audio formats are supported?
- **Output**: MP3 (with ElevenLabs) or WAV (browser voices)
- **Quality**: Professional audiobook quality
- **Metadata**: Embedded character and chapter information

## Troubleshooting

### Processing takes too long
- **Large documents**: Use progressive processing for 100k+ characters
- **Browser performance**: Chrome performs better than other browsers
- **Memory**: Close other tabs if experiencing slowdowns
- **Background processing**: Let it run in the background

### Audio doesn't play
- **Browser settings**: Check if audio is allowed in your browser
- **File size**: Large files may take time to load
- **Format support**: Try downloading and playing in external player
- **Cache**: Refresh the page and try again

### Characters not detected properly
- **Dialogue formatting**: Use standard quotation marks ("Hello," said John)
- **Clear attribution**: Make sure speaker attribution is clear
- **Consistent names**: Use the same name for each character throughout
- **Manual editing**: You can edit characters in the character list

### ElevenLabs not working
- **API key**: Verify your API key is correct
- **Credits**: Check your ElevenLabs account has remaining credits
- **Internet**: Ensure stable internet connection
- **Fallback**: System will use browser voices if ElevenLabs fails

### Project won't save
- **Browser storage**: Check if localStorage is enabled
- **Storage space**: Clear old projects if storage is full
- **Private browsing**: Projects won't persist in incognito mode
- **Export backup**: Download project as backup

## Writing & Content

### What makes good audiobook text?
- **Clear dialogue tags**: "Hello," said Mary, not just "Hello"
- **Distinct character voices**: Each character should have unique speech patterns
- **Good pacing**: Mix of dialogue and narration
- **Proper formatting**: Standard punctuation and paragraph breaks

### Can it handle accents or dialects?
- **Text-based**: Include accent indicators in the text ("'Ello there!")
- **Voice customization**: Adjust pitch and speed for character variation
- **Future feature**: Accent detection and assignment is planned

### How accurate is the writing analysis?
- **Show vs Tell**: ~85% accuracy in identifying telling language
- **Trope detection**: Covers 50+ common tropes with high confidence
- **Purple prose**: Effective at flagging overly complex language
- **Continuous improvement**: Analysis algorithms constantly refined

## Advanced Features

### Can I collaborate with others?
Currently single-user, but collaboration features are planned:
- **Real-time editing**: Multi-user simultaneous editing
- **Comment system**: Feedback and review workflow
- **Version control**: Track changes and revisions
- **Share projects**: Send projects to other users

### Is there an API?
Not yet, but planned for future releases:
- **REST API**: Programmatic access to all features
- **Webhooks**: Integration with other tools
- **SDKs**: Libraries for popular programming languages
- **Third-party integration**: Connect with writing software

### Can I batch process multiple stories?
Single story processing currently, but batch processing is planned:
- **Multiple file upload**: Process several stories at once
- **Queue management**: Priority and scheduling controls
- **Batch export**: Download multiple audiobooks
- **Progress tracking**: Monitor multiple jobs

## Business & Licensing

### Can I use this commercially?
- **Your content**: You own all rights to your generated audiobooks
- **Commercial use**: Allowed for content you have rights to
- **Attribution**: Not required but appreciated
- **Redistribution**: Don't redistribute the software itself

### Is my content safe?
- **Local processing**: Stories processed entirely in your browser
- **No uploads**: Content never sent to our servers
- **Privacy**: We don't access, store, or analyze your content
- **ElevenLabs**: Only text sent for voice generation (their privacy policy applies)

### Can I contribute to development?
- **Open source**: Considering open-sourcing parts of the application
- **Feedback**: Always welcome feedback and feature requests
- **Bug reports**: Report issues through our contact channels
- **Beta testing**: Join our beta program for early features

## Getting Help

### Where can I get support?
- **FAQ**: This document covers most common questions
- **User Manual**: Comprehensive guide to all features
- **Contact**: Reach out through our support channels
- **Community**: Join our user community for tips and tricks

### How do I report a bug?
1. **Reproduce**: Ensure the issue happens consistently
2. **Browser info**: Note which browser and version you're using
3. **Steps**: Describe exactly what you did
4. **Expected vs actual**: What should happen vs. what happened
5. **Contact**: Send details through our support channels

### Can I request features?
Absolutely! We love feature requests:
- **User-driven development**: Features based on user needs
- **Roadmap**: Check our roadmap for planned features
- **Voting**: Popular requests get priority
- **Timeline**: Most features implemented within 3-6 months

---

**Still have questions?** Contact our support team - we're here to help! 🚀

*Story Voice Studio - Bringing Stories to Life*
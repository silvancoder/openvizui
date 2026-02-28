All notable changes to this project will be documented in this file.

## [1.0.4] - 2026-02-27

### Added
- Implement resizable sidebars for the Chat and Resource panels with persistent widths
- Restore auto-updater and application code signing features

### Changed
- Enhance SVG icons by removing hardcoded backgrounds and optimizing sizes
- Beautify the UI with a modern mesh gradient background, glassmorphism cards, and refined soft shadows

### Fixed
- Fix missing properties (`global_instructions`, `chat_sidebar_width`) in the `AppConfig` type definitions

## [1.0.3] - 2026-02-17

### Added
- Add "Fetch Models" button in Chat Settings to dynamically retrieve model lists
- Implement "Smart Select" dropdown for model selection with support for custom model IDs
- Add internationalization support for Chat error messages and configuration warnings

### Changed
- Remove hardcoded default AI providers and base URLs for a cleaner initial state
- Refine model selection logic to automatically fill and close the dropdown upon selection
- Polish English translations across the entire application for a more natural UI experience

## [1.0.2] - 2026-02-13

### Added
- Add version check on the 'About' page
- Add version upgrade log document
- Add comprehensive internationalization support for 10 languages across the application
- Integrate Terminal file explorer and context management features into Chat Interface
- Add CLI tool help modal with localized commands instructions
- Implement process termination on tool switch
- Add OAuth login status detection for Gemini and GitHub Copilot

### Changed
- Merge 'AI Generated' label with CLI tool help button
- Refine Chat page padding for better layout on wide screens
- Localize sidebar navigation items ('Chat' etc.)

## [1.0.1] - 2026-02-02

### Added
- Add plugin management function

# Traffic Analysis Extension

A simple browser extension to analyze website traffic sources, visits, top countries, and referrers.

## Features

- 🚀 **Real-time Analysis**: Analyzes the current website you're visiting
- 📊 **Website Info**: Shows domain, security status, estimated visits, and global rank
- 🌍 **Top Countries**: Displays visitor demographics by country
- 🔗 **Traffic Sources**: Shows referrer information and traffic sources
- 📝 **Recent Visits**: Keeps track of your recent website visits
- 🔒 **Privacy-focused**: All data stored locally in your browser

## Technology Stack

- **Frontend**: React.js, HTML, CSS
- **Build Tool**: Webpack
- **Extension**: Chrome Extension Manifest V3
- **APIs**: DomainsDB API (free) for domain verification
- **Styling**: Simple CSS with gradient backgrounds and modern design

## Installation

1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Load the `dist/` folder as an unpacked extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

## Usage

1. Click the extension icon in your Chrome toolbar
2. The popup will show analysis of the current website
3. View traffic data including:
   - Domain information and security status
   - Estimated monthly visits and global ranking
   - Top countries by visitor percentage
   - Traffic sources and referrers
   - Recent visits history

## File Structure

```
├── dist/                  # Built extension files
├── public/
│   ├── icons/            # Extension icons
│   ├── manifest.json     # Extension manifest
│   └── popup.html        # Popup HTML template
├── src/
│   ├── components/
│   │   └── App.js        # Main React component
│   ├── styles/
│   │   └── simple.css    # Simple styling
│   ├── background.js     # Background service worker
│   ├── content.js        # Content script for page monitoring
│   └── popup.js          # Popup entry point
├── package.json          # Project dependencies
└── webpack.config.js     # Build configuration
```

## Key Components

### 1. Content Script (`content.js`)
- Monitors URL changes on web pages
- Stores visited sites in Chrome storage
- Tracks page navigation events

### 2. Background Script (`background.js`) 
- Handles tab updates and navigation
- Manages persistent data storage
- Processes messages from content scripts

### 3. Popup App (`App.js`)
- Main React component for the extension popup
- Fetches and displays traffic analysis data
- Integrates with free APIs when available
- Shows realistic mock data based on domain characteristics

### 4. API Integration
- Uses DomainsDB API for domain verification
- Generates realistic traffic data based on domain patterns
- Handles API failures gracefully with fallback data

## Development

To modify and develop the extension:

1. Make changes to files in `src/`
2. Run `npm run build` to rebuild
3. Reload the extension in Chrome extensions page
4. Test your changes

## Data Sources

- **Domain Verification**: DomainsDB API (free)
- **Traffic Estimation**: Algorithm based on domain characteristics
- **Geographic Data**: Realistic estimates based on global web patterns
- **Referrer Data**: Common traffic source patterns

## Privacy & Security

- All data is processed locally in your browser
- No personal browsing data is sent to external servers
- Only domain names are used for analysis
- Recent visits are stored locally in Chrome storage

## Browser Compatibility

- Chrome (Manifest V3)
- Compatible with Chromium-based browsers
- Requires ES6+ support

## License

MIT License - Feel free to modify and distribute.

# Traffic Analysis Extension

A browser extension built with React.js that analyzes website traffic sources, showing visits, top countries, and referrers.

## Features

- 📊 **Traffic Overview**: Display monthly visits, bounce rate, average visit duration, and pages per session
- 🌍 **Top Countries**: Show traffic breakdown by country with visual percentages
- 🔗 **Top Referrers**: Analyze traffic sources including search engines, social media, and direct traffic
- 🎨 **Modern UI**: Clean, responsive interface with tabbed navigation
- ⚡ **Real-time Analysis**: Analyze any website you visit with a single click

## Installation

### Development Setup

1. **Clone or download the project files**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

### Install in Chrome/Edge

1. Open Chrome/Edge and go to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension should appear in your extensions list

### Install in Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to the `dist` folder and select `manifest.json`
4. The extension will be loaded temporarily

## Usage

1. **Navigate to any website** you want to analyze
2. **Click the extension icon** in your browser toolbar
3. **View traffic data** in the popup:
   - **Overview tab**: Key metrics and statistics
   - **Countries tab**: Traffic breakdown by country
   - **Referrers tab**: Top traffic sources
4. **Refresh data** using the refresh button if needed

## Technical Details

### Built With

- **React.js 18** - Frontend framework
- **Webpack 5** - Build tool and bundler
- **Babel** - JavaScript transpiler
- **CSS3** - Modern styling with flexbox and grid
- **Chrome Extensions API** - Browser integration

### Architecture

```
src/
├── components/          # React components
│   ├── App.js          # Main application component
│   ├── Header.js       # Extension header
│   ├── TrafficAnalyzer.js  # Main analyzer component
│   ├── TrafficStats.js     # Overview statistics
│   ├── CountryList.js      # Country breakdown
│   ├── ReferrerList.js     # Referrer sources
│   ├── LoadingSpinner.js   # Loading animation
│   └── ErrorMessage.js     # Error handling
├── services/           # Business logic
│   └── TrafficService.js   # API integration service
├── styles/            # CSS stylesheets
│   └── popup.css      # Main styles
└── popup.js           # Entry point
```

### API Integration

The extension is structured to easily integrate with traffic analysis APIs:

- **SimilarWeb API** (requires API key)
- **Google Analytics API** (requires authentication)
- **Custom analytics APIs**

Currently uses mock data for demonstration. To integrate real APIs:

1. Open `src/services/TrafficService.js`
2. Replace the `getBasicSiteInfo` method with real API calls
3. Update API keys in the service configuration

### Data Structure

The extension expects traffic data in the following format:

```javascript
{
  monthlyVisits: 1500000,
  bounceRate: 45.2,
  avgVisitDuration: 180,
  pagesPerSession: 2.5,
  globalRank: 15000,
  category: "Technology",
  topCountries: [
    { name: "United States", flag: "🇺🇸", percentage: 35.5 },
    { name: "India", flag: "🇮🇳", percentage: 18.2 }
  ],
  topReferrers: [
    { name: "Google Search", type: "Search", percentage: 45.0 },
    { name: "Facebook", type: "Social", percentage: 12.5 }
  ]
}
```

## Development

### Available Scripts

- `npm run build` - Build for production
- `npm run dev` - Build and watch for changes
- `npm start` - Development server (for testing components)

### Modifying the Extension

1. **Components**: Edit files in `src/components/`
2. **Styling**: Modify `src/styles/popup.css`
3. **API Logic**: Update `src/services/TrafficService.js`
4. **Build**: Run `npm run build` after changes
5. **Reload**: Refresh the extension in browser developer settings

### Browser Support

- **Chrome 88+**
- **Firefox 78+**
- **Edge 88+**
- **Safari** (with minor manifest adjustments)

## Customization

### Styling

The extension uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #667eea;
  --background-color: #f8f9fa;
  --text-color: #333;
}
```

### Adding New Features

1. **New Tab**: Add component to `TrafficAnalyzer.js`
2. **New Metric**: Update `TrafficStats.js` and data structure
3. **New API**: Extend `TrafficService.js`

## Privacy & Security

- **No Data Storage**: Extension doesn't store personal data
- **HTTPS Only**: All API calls use secure connections
- **Minimal Permissions**: Only requests necessary browser permissions
- **Open Source**: All code is transparent and auditable

## Troubleshooting

### Common Issues

1. **"Cannot analyze this URL"**
   - Extension can't analyze localhost, chrome-extension, or file:// URLs
   - Navigate to a regular website (http/https)

2. **"No traffic data available"**
   - Check internet connection
   - Try refreshing the data
   - Some websites may not have sufficient traffic data

3. **Extension not loading**
   - Verify `dist` folder was built correctly
   - Check browser console for errors
   - Ensure developer mode is enabled

### Getting Support

- Check browser console for errors
- Verify extension permissions
- Review manifest.json configuration
- Test with different websites

## License

MIT License - feel free to modify and distribute.

## Contributing

1. Fork the project
2. Create your feature branch
3. Test thoroughly
4. Submit a pull request

---

**Note**: This extension uses mock data for demonstration. For production use, integrate with legitimate traffic analysis APIs and ensure compliance with website terms of service.

# Workplace Harassment Documentation Website

This website is designed to document and display incidents of workplace harassment in a secure, organized manner. It features a bilingual interface (English and Japanese) and provides both calendar and timeline views for incident tracking.

## Features

- **Bilingual Support**: Toggle between English and Japanese interfaces
- **Calendar View**: Interactive calendar highlighting dates with reported incidents
- **Timeline View**: Chronological listing of all incidents
- **Search and Filter**: Find incidents by keywords, category, or date range
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Evidence Management**: Securely link to supporting evidence files
- **Incident Details**: Modal view showing comprehensive incident information

## Project Structure

```
evidence/
├── css/
│   └── styles.css           # Main stylesheet
├── js/
│   ├── app.js               # Main application logic
│   ├── firebase-config.js   # Firebase configuration
│   └── translations.js      # Language translations
├── incidents.json           # Incident data storage
├── index.html               # Main HTML file
└── README.md                # This documentation
```

## Setup Instructions

### Local Development

1. Clone or download this repository to your local machine
2. Open the project folder in your preferred code editor
3. To test locally, you can use a simple HTTP server:
   - Using Python: `python -m http.server`
   - Using Node.js: `npx serve`
4. Open your browser and navigate to `http://localhost:8000` (or the port provided)

### Firebase Hosting Setup

1. Go to the [Firebase console](https://console.firebase.google.com/)
2. Click "Add project" and name it "evidence"
3. After project creation, click on the web icon (</>) to add a web app
4. Register the app with a nickname like "Evidence Documentation"
5. Copy the firebaseConfig object provided and replace the placeholder in `js/firebase-config.js`
6. Install Firebase CLI if you haven't already:
   ```
   npm install -g firebase-tools
   ```
7. Login to Firebase:
   ```
   firebase login
   ```
8. Initialize your project:
   ```
   firebase init
   ```
   - Select Hosting
   - Select your "evidence" project
   - Use "." as your public directory
   - Configure as a single-page app: No
   - Set up automatic builds and deploys: No
9. Deploy your website:
   ```
   firebase deploy
   ```

## Managing Incident Data

The `incidents.json` file contains all incident data. Each incident has the following structure:

```json
{
  "id": "unique-id",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "title": {
    "en": "English Title",
    "ja": "Japanese Title"
  },
  "category": {
    "en": "Category in English",
    "ja": "Category in Japanese"
  },
  "description": {
    "en": "Detailed description in English",
    "ja": "Detailed description in Japanese"
  },
  "evidence": [
    {
      "type": "image|document|audio|video",
      "url": "path/to/evidence/file",
      "description": {
        "en": "Evidence description in English",
        "ja": "Evidence description in Japanese"
      }
    }
  ]
}
```

### Adding New Incidents

To add a new incident:

1. Open the `incidents.json` file
2. Add a new object to the `incidents` array following the structure above
3. Save the file and upload it to your hosting

### Evidence Files

Evidence files should be stored in a secure location. When using Firebase:

1. Upload evidence files to Firebase Storage
2. Set appropriate security rules for access control
3. Use the generated URLs in your `incidents.json` file

## Security Considerations

- Ensure that your Firebase security rules are properly configured to protect sensitive data
- Consider implementing authentication if the site needs to be restricted to specific users
- Regularly backup your `incidents.json` file
- Be cautious about what information is included in incident descriptions to protect privacy

## Legal Considerations in Japan

When documenting workplace harassment in Japan, be aware of:

- The Act on Comprehensive Promotion of Labor Policies (労働施策総合推進法) which includes provisions on power harassment
- The Equal Employment Opportunity Law (男女雇用機会均等法) regarding sexual harassment
- Privacy laws that may affect how you document and store evidence
- The importance of factual, objective documentation without defamatory content

## Customization

- Modify `css/styles.css` to change the visual appearance
- Edit `js/translations.js` to update or add language translations
- Adjust `js/app.js` to modify functionality or add new features

## Support

For issues or questions, please contact the administrator of this website.

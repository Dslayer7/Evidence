// Your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "evidence.firebaseapp.com",
    projectId: "evidence",
    storageBucket: "evidence.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const db = firebase.firestore();
const storage = firebase.storage();

/* 
FIREBASE SETUP INSTRUCTIONS:

1. Go to the Firebase console (https://console.firebase.google.com/)
2. Click "Add project" and name it "evidence"
3. After project creation, click on the web icon (</>) to add a web app
4. Register the app with a nickname like "Evidence Documentation"
5. Copy the firebaseConfig object provided and replace the placeholder above
6. Install Firebase CLI if you haven't already:
   - Run: npm install -g firebase-tools
7. Login to Firebase:
   - Run: firebase login
8. Initialize your project:
   - Run: firebase init
   - Select Hosting
   - Select your "evidence" project
   - Use "." as your public directory
   - Configure as a single-page app: No
   - Set up automatic builds and deploys: No
9. Deploy your website:
   - Run: firebase deploy

For more detailed instructions, visit: https://firebase.google.com/docs/hosting/quickstart
*/

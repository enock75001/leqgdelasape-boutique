// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "le-bleu-water-hub",
  "appId": "1:342431785251:web:4e1b42a34b6d42f2416c96",
  "storageBucket": "le-bleu-water-hub.firebasestorage.app",
  "apiKey": "AIzaSyB9jCs2ZFTWb2p3B2fsgZ-8rPZT2HdbMuE",
  "authDomain": "le-bleu-water-hub.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "342431785251"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

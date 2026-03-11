import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGFu-DlhDkvihjxa9BvvTmutXFDd9TfMQ",
  authDomain: "grocery-df582.firebaseapp.com",
  projectId: "grocery-df582",
  storageBucket: "grocery-df582.firebasestorage.app",
  messagingSenderId: "341259628119",
  appId: "1:341259628119:web:5fcbdbafca78896cec7d12",
  measurementId: "G-V587CK8EJD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

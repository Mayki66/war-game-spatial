// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCGMOl1Mv_zDSjMAqKWgn_TvE6lWbjb1M",
  authDomain: "war-game-spatial.firebaseapp.com",
  databaseURL: "https://war-game-spatial-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "war-game-spatial",
  storageBucket: "war-game-spatial.firebasestorage.app",
  messagingSenderId: "339367839233",
  appId: "1:339367839233:web:1540640dd03e6e0f736200"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
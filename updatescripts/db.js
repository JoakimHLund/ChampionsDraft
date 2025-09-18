// updatescripts/db.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtkvwfwgZmCY7Ho1Uh1Itm8jDXhuff7_g",
  authDomain: "championsdraft25.firebaseapp.com",
  projectId: "championsdraft25",
  storageBucket: "championsdraft25.firebasestorage.app",
  messagingSenderId: "194206448130",
  appId: "1:194206448130:web:58358b48e25006f511c51b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

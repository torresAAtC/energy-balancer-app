// ========== CONFIGURACIÓN DE FIREBASE ==========
// ⚠️ IMPORTANTE: Reemplaza estos valores con los que obtendrás de Firebase Console

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBku7EKfgpm6YIiPI18bFihJPl-y7oUgP0",
  authDomain: "energy-balancer-app.firebaseapp.com",
  databaseURL: "https://energy-balancer-app-default-rtdb.firebaseio.com",
  projectId: "energy-balancer-app",
  storageBucket: "energy-balancer-app.firebasestorage.app",
  messagingSenderId: "1084926432419",
  appId: "1:1084926432419:web:5c40a8c17c2cc1ff5a5b16"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Referencias a las bases de datos
const communityDB = database.ref('community_appliances');
const usersDB = database.ref('users');

// Variable global para almacenar el userId
let currentUserId = null;
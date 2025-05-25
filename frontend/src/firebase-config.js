// Import the functions you need from the SDKs you need
import { initializeApp } from "@firebase/app";
import { getAnalytics } from "@firebase/analytics";
import { getFirestore, collection, doc, setDoc, addDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc } from "@firebase/firestore";
import { getAuth, onAuthStateChanged } from "@firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2ZLktr7HvwqWizK_e6f4KF3A_2jB6leg",
  authDomain: "civilify-a9de6.firebaseapp.com",
  projectId: "civilify-a9de6",
  storageBucket: "civilify-a9de6.firebasestorage.app",
  messagingSenderId: "433624047904",
  appId: "1:433624047904:web:0d0e8ca4ca22406731f745",
  measurementId: "G-X8LZ911PYZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to add a user profile to Firestore
async function addUserProfile(uid, username, profilePictureUrl) {
    try {
      // Create a reference to the user's document
      const userRef = doc(db, "users", uid);
  
      // Create the user profile data
      const userProfile = {
        username: username,
        profile_picture_url: profilePictureUrl,
      };
  
      // Add the user profile to Firestore
      await setDoc(userRef, userProfile);
      console.log("User profile added successfully!");
    } catch (error) {
      console.error("Error adding user profile:", error);
    }
}

// Chat Firestore Functions

// Create a new conversation
async function createConversation(userId, userEmail, title) {
  try {
    const conversationsRef = collection(db, "conversations");
    const conversationData = {
      userId,
      userEmail,
      title: title || "New Conversation",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "pending",
      assignedAdminId: null
    };
    
    const docRef = await addDoc(conversationsRef, conversationData);
    return { id: docRef.id, ...conversationData };
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
}

// Get all conversations for a user
async function getUserConversations(userEmail) {
  try {
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("userEmail", "==", userEmail),
      orderBy("updatedAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const conversations = [];
    
    querySnapshot.forEach((doc) => {
      conversations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return conversations;
  } catch (error) {
    console.error("Error getting user conversations:", error);
    throw error;
  }
}

// Add a message to a conversation
async function addMessage(conversationId, userId, userEmail, content, isUserMessage) {
  try {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const messageData = {
      userId,
      userEmail,
      content,
      isUserMessage,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    
    // Update the conversation's updatedAt timestamp
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...messageData };
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
}

// Get all messages for a conversation
async function getConversationMessages(conversationId) {
  try {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return messages;
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    throw error;
  }
}

// Update conversation details
async function updateConversation(conversationId, updates) {
  try {
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { id: conversationId, ...updates };
  } catch (error) {
    console.error("Error updating conversation:", error);
    throw error;
  }
}

export {
  app,
  db,
  auth,
  onAuthStateChanged,
  addUserProfile,
  createConversation,
  getUserConversations,
  addMessage,
  getConversationMessages,
  updateConversation
};
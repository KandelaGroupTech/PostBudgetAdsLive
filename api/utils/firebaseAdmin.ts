import * as admin from 'firebase-admin';

// Check if the environment variable exists
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountKey) {
    console.error('Missing FIREBASE_SERVICE_ACCOUNT environment variable for admin client');
}

// Initialize Firebase Admin if it hasn't been initialized already
if (admin.apps.length === 0) {
    try {
        const serviceAccount = JSON.parse(serviceAccountKey || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // The storage bucket name (without gs://) should be provided if we need storage on server
            // storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
        });
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
    }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

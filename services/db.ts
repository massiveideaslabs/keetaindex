import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query,
  QuerySnapshot,
  DocumentData,
  DocumentReference
} from 'firebase/firestore';
import { AppItem, Report, SubmissionData } from '../types';

const APPS_COLLECTION = 'apps';
const REPORTS_COLLECTION = 'reports';

// Helper to check DB connection
const checkDb = () => {
    if (!db) throw new Error("Database not configured. Please check your .env file and ensure VITE_FIREBASE_API_KEY is set.");
};

// Timeout helper to prevent hanging requests
const withTimeout = <T>(promise: Promise<T>, ms: number = 30000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error("Operation timed out. Please check your internet connection or try again.")), ms)
        )
    ]);
};

export const getApps = async (): Promise<AppItem[]> => {
  try {
    checkDb();
    if (!db) return [];
  
    const appsCol = collection(db, APPS_COLLECTION);
    const q = query(appsCol);
    // Use timeout for initial fetch too
    const snapshot = await withTimeout(getDocs(q), 30000) as QuerySnapshot<DocumentData>;
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as AppItem));
  } catch (err) {
    console.error("Error fetching apps:", err);
    throw err;
  }
};

export const addApp = async (data: SubmissionData): Promise<AppItem> => {
  checkDb();
  if (!db) throw new Error("No DB");

  const newApp = {
    ...data,
    tags: ['New', 'Community'],
    addedAt: Date.now(),
    clicks: 0,
    featured: false
  };

  const docRef = await withTimeout(addDoc(collection(db, APPS_COLLECTION), newApp)) as DocumentReference<DocumentData>;
  
  return {
    ...newApp,
    id: docRef.id
  };
};

export const updateApp = async (id: string, data: Partial<AppItem>): Promise<void> => {
  checkDb();
  if (!db) return;
  
  const appRef = doc(db, APPS_COLLECTION, id);
  await withTimeout(updateDoc(appRef, data));
};

export const deleteApp = async (id: string): Promise<void> => {
  checkDb();
  if (!db) return;

  const appRef = doc(db, APPS_COLLECTION, id);
  await withTimeout(deleteDoc(appRef));
};

export const incrementAppClicks = async (id: string, currentClicks: number): Promise<void> => {
  try {
    checkDb();
    if (!db) return;

    // Fire and forget, no timeout needed usually, but good practice to catch
    const appRef = doc(db, APPS_COLLECTION, id);
    await updateDoc(appRef, { clicks: currentClicks + 1 });
  } catch (e) {
    console.warn("Failed to increment clicks", e);
  }
};

// --- Reports ---

export const getReports = async (): Promise<Report[]> => {
  try {
    checkDb();
    if (!db) return [];

    const reportsCol = collection(db, REPORTS_COLLECTION);
    const snapshot = await withTimeout(getDocs(reportsCol)) as QuerySnapshot<DocumentData>;
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Report));
  } catch (err) {
    console.error("Error fetching reports:", err);
    return []; // Return empty on error to allow app to load
  }
};

export const addReport = async (app: AppItem, reasons: string[]): Promise<Report> => {
  checkDb();
  if (!db) throw new Error("No DB");

  const newReport = {
    appId: app.id,
    appName: app.name,
    reasons,
    timestamp: Date.now()
  };

  const docRef = await withTimeout(addDoc(collection(db, REPORTS_COLLECTION), newReport)) as DocumentReference<DocumentData>;

  return {
    ...newReport,
    id: docRef.id
  };
};

export const deleteReport = async (id: string): Promise<void> => {
  checkDb();
  if (!db) return;

  const reportRef = doc(db, REPORTS_COLLECTION, id);
  await withTimeout(deleteDoc(reportRef));
};

export const deleteReportsForApp = async (appId: string): Promise<void> => {
    checkDb();
    if (!db) return;
    
    const reports = await getReports();
    const toDelete = reports.filter(r => r.appId === appId);
    
    await Promise.all(toDelete.map(r => deleteReport(r.id)));
};
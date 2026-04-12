import { Alumni, Event, OrgProfile, HomeSettings } from '../types';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const COLLECTION_NAME = 'alumni';
const EVENTS_COLLECTION = 'events';

export const dbService = {
  // Alumni methods...
  async getAlumni(): Promise<Alumni[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Alumni;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      return [];
    }
  },
  
  async addAlumni(alumni: Omit<Alumni, 'id' | 'uniqueCode'>): Promise<string> {
    try {
      const alumniRef = collection(db, COLLECTION_NAME);
      const snapshot = await getCountFromServer(alumniRef);
      const count = snapshot.data().count + 1;
      
      // Generate Unique Code: PAK + 4 digit seq + day + month + year
      // Example: PAK000123Feb91
      const birthDate = alumni.birthDate || '1990-01-01';
      const [y, m, d] = birthDate.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(m, 10) - 1;
      const monthName = months[monthIndex] || 'Jan';
      const yearShort = y ? y.slice(-2) : '90';
      const dayPadded = d ? d.padStart(2, '0') : '01';
      const seq = count.toString().padStart(4, '0');
      const uniqueCode = `PAK${seq}${dayPadded}${monthName}${yearShort}`;

      await addDoc(alumniRef, {
        ...alumni,
        uniqueCode,
        createdAt: serverTimestamp(),
      });
      
      return uniqueCode;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      throw error;
    }
  },

  async findAlumniByUniqueCode(code: string): Promise<Alumni | null> {
    try {
      const alumniRef = collection(db, COLLECTION_NAME);
      const q = query(alumniRef, where("uniqueCode", "==", code));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Alumni;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  async updateAlumni(alumni: Alumni): Promise<void> {
    if (!alumni.id) return;
    try {
      const alumniRef = doc(db, COLLECTION_NAME, alumni.id);
      const { id, ...data } = alumni;
      await updateDoc(alumniRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${alumni.id}`);
    }
  },

  async deleteAlumni(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  },

  subscribeAlumni(callback: (alumni: Alumni[]) => void) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const alumni = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Alumni;
      });
      callback(alumni);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, EVENTS_COLLECTION);
    });
  },

  async findAlumniByEmailOrPhone(identifier: string): Promise<Alumni | null> {
    try {
      const alumniRef = collection(db, COLLECTION_NAME);
      
      // Try searching by email first
      const emailQuery = query(alumniRef, where("email", "==", identifier));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        const doc = emailSnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Alumni;
      }
      
      // If not found by email, try searching by phone
      const phoneQuery = query(alumniRef, where("phone", "==", identifier));
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (!phoneSnapshot.empty) {
        const doc = phoneSnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Alumni;
      }
      
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  async findAlumniByEmailAndPhone(email: string, phone: string): Promise<Alumni | null> {
    try {
      const alumniRef = collection(db, COLLECTION_NAME);
      const q = query(
        alumniRef, 
        where("email", "==", email),
        where("phone", "==", phone)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Alumni;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  async findAlumniByName(name: string): Promise<Alumni | null> {
    try {
      const alumniRef = collection(db, COLLECTION_NAME);
      // Note: This is an exact match search. For partial match, we'd need a different approach.
      const q = query(alumniRef, where("fullName", "==", name));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Alumni;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return null;
    }
  },

  // Event methods
  async getEvents(): Promise<Event[]> {
    try {
      const q = query(collection(db, EVENTS_COLLECTION), orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Event;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, EVENTS_COLLECTION);
      return [];
    }
  },

  async addEvent(event: Omit<Event, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, EVENTS_COLLECTION), {
        ...event,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, EVENTS_COLLECTION);
    }
  },

  async updateEvent(event: Event): Promise<void> {
    if (!event.id) return;
    try {
      const eventRef = doc(db, EVENTS_COLLECTION, event.id);
      const { id, ...data } = event;
      await updateDoc(eventRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${EVENTS_COLLECTION}/${event.id}`);
    }
  },

  async deleteEvent(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, EVENTS_COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${EVENTS_COLLECTION}/${id}`);
    }
  },

  subscribeEvents(callback: (events: Event[]) => void) {
    const q = query(collection(db, EVENTS_COLLECTION), orderBy('date', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as unknown as Event;
      });
      callback(events);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, EVENTS_COLLECTION);
    });
  },

  // Profile methods
  async getProfile(): Promise<OrgProfile | null> {
    try {
      const profileRef = doc(db, 'settings', 'profile');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        return {
          ...data,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as OrgProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/profile');
      return null;
    }
  },

  async updateProfile(profile: OrgProfile): Promise<void> {
    try {
      const profileRef = doc(db, 'settings', 'profile');
      await setDoc(profileRef, {
        ...profile,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/profile');
    }
  },

  subscribeProfile(callback: (profile: OrgProfile | null) => void) {
    const profileRef = doc(db, 'settings', 'profile');
    return onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          ...data,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as OrgProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/profile');
    });
  },

  // Home Settings methods
  async getHomeSettings(): Promise<HomeSettings | null> {
    try {
      const homeRef = doc(db, 'settings', 'home');
      const homeSnap = await getDoc(homeRef);
      if (homeSnap.exists()) {
        const data = homeSnap.data();
        return {
          ...data,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as HomeSettings;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/home');
      return null;
    }
  },

  async updateHomeSettings(settings: HomeSettings): Promise<void> {
    try {
      const homeRef = doc(db, 'settings', 'home');
      await setDoc(homeRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/home');
    }
  },

  subscribeHomeSettings(callback: (settings: HomeSettings | null) => void) {
    const homeRef = doc(db, 'settings', 'home');
    return onSnapshot(homeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          ...data,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as HomeSettings);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/home');
    });
  },

  async syncDatabase(): Promise<{ updated: number, total: number }> {
    try {
      const alumniRef = collection(db, COLLECTION_NAME);
      const q = query(alumniRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      const alumniList = snapshot.docs;
      let updatedCount = 0;

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = 0; i < alumniList.length; i++) {
        const alumniDoc = alumniList[i];
        const data = alumniDoc.data();
        
        if (!data.uniqueCode) {
          const birthDate = data.birthDate || '1990-01-01';
          const [y, m, d] = birthDate.split('-');
          const monthName = months[parseInt(m) - 1] || 'Jan';
          const yearShort = y ? y.slice(-2) : '90';
          const dayPadded = d ? d.padStart(2, '0') : '01';
          const seq = (i + 1).toString().padStart(4, '0');
          const uniqueCode = `PAK${seq}${dayPadded}${monthName}${yearShort}`;

          await updateDoc(alumniDoc.ref, {
            uniqueCode,
            updatedAt: serverTimestamp()
          });
          updatedCount++;
        }
      }

      return { updated: updatedCount, total: alumniList.length };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
      throw error;
    }
  }
};

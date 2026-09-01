import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { Firestore, doc, getDoc, getFirestore } from 'firebase/firestore';
import { FIREBASE_APP } from '../core/firebase-app.provider';

/**
 * Autenticación real del admin (email/password) + chequeo de pertenencia a la
 * lista blanca `admins/{uid}` en Firestore. No expone ningún método de
 * registro: el único "hacerte admin" es manual, vía Firebase Console (ver
 * checklist del plan) — nunca desde la app.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly app = inject(FIREBASE_APP);
  private readonly auth: Auth = getAuth(this.app);
  private readonly firestore: Firestore = getFirestore(this.app);

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isAdminSignal = signal(false);
  private readonly readySignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAdmin = this.isAdminSignal.asReadonly();

  private readyPromise: Promise<void>;
  private resolveReady!: () => void;

  constructor() {
    this.readyPromise = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });

    onAuthStateChanged(this.auth, async (user) => {
      this.currentUserSignal.set(user);
      this.isAdminSignal.set(user ? await this.esAdmin(user.uid) : false);
      this.readySignal.set(true);
      this.resolveReady();
    });
  }

  /** Se resuelve una vez que Firebase restauró (o descartó) la sesión persistida. */
  waitUntilReady(): Promise<void> {
    return this.readyPromise;
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  private async esAdmin(uid: string): Promise<boolean> {
    const snap = await getDoc(doc(this.firestore, 'admins', uid));
    return snap.exists();
  }
}

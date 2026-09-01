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

  /**
   * Se resuelve una vez que Firebase restauró (o descartó) la sesión
   * persistida al arrancar la app. Solo cubre ESE momento inicial (por eso el
   * guard la usa) — no se re-resuelve en logins/logouts posteriores dentro de
   * la misma sesión; para eso, `login()`/`logout()` ya dejan `isAdmin()`
   * correcto por sí solos antes de devolver el control.
   */
  waitUntilReady(): Promise<void> {
    return this.readyPromise;
  }

  async login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    this.currentUserSignal.set(credential.user);
    this.isAdminSignal.set(await this.esAdmin(credential.user.uid));
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSignal.set(null);
    this.isAdminSignal.set(false);
  }

  private async esAdmin(uid: string): Promise<boolean> {
    const snap = await getDoc(doc(this.firestore, 'admins', uid));
    return snap.exists();
  }
}

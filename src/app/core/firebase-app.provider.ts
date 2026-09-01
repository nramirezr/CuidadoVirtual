import { InjectionToken, Provider } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase.config';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');

/**
 * Por ahora apunta siempre al proyecto real de Firebase (`cuidadovirtual`), en
 * dev y en producción por igual — todavía no hay Firebase CLI/emuladores
 * configurados en este repo. Si más adelante se instala el Local Emulator
 * Suite, este es el lugar para conectar `connectAuthEmulator`/
 * `connectFirestoreEmulator` detrás de un chequeo explícito (no automático
 * por hostname, para no romper por sorpresa una verificación local contra
 * datos reales).
 */
export function provideFirebaseApp(): Provider {
  return {
    provide: FIREBASE_APP,
    useFactory: () => initializeApp(firebaseConfig)
  };
}

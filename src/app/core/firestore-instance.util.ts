import { FirebaseApp } from 'firebase/app';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';

/**
 * Safari (iPhone y Mac) tarda ~10 s en descubrir que el canal en tiempo real
 * de Firestore no le sirve y recién ahí cae a "long polling", así que cada
 * lectura inicial demora ese tiempo. En Safari se fuerza long polling desde
 * el inicio; el resto de los navegadores usa el canal normal.
 */
function esSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Android|Edg/.test(ua));
}

/** Debe ser la única forma de obtener Firestore: la configuración solo se puede fijar la primera vez. */
export function obtenerFirestore(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, esSafari() ? { experimentalForceLongPolling: true } : {});
  } catch {
    return getFirestore(app);
  }
}

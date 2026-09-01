import { Observable } from 'rxjs';
import { DocumentData, Query, onSnapshot } from 'firebase/firestore';

/**
 * Envuelve una query de Firestore en tiempo real (`onSnapshot`) como
 * Observable, siguiendo el mismo patrón de RxJS que ya usa
 * `visit-counter.service.ts` para HTTP. Cada emisión trae el snapshot completo
 * ya mapeado a `T[]`, con el id del documento agregado.
 */
export function collectionSnapshots$<T>(q: Query<DocumentData>): Observable<T[]> {
  return new Observable<T[]>((subscriber) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        subscriber.next(
          snapshot.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T)
        );
      },
      (error) => subscriber.error(error)
    );
    return () => unsubscribe();
  });
}

import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { FIREBASE_APP } from '../core/firebase-app.provider';
import { collectionSnapshots$ } from '../core/firestore-rx.util';
import { CategoriaDoc } from '../models/categoria-doc.model';
import { slugify } from '../utils/slug.util';

export interface CategoriaFormInput {
  nombre: string;
  icono: string;
  activa?: boolean;
}

/**
 * Categorías respaldadas por Firestore. Reemplaza tanto la lectura estática de
 * `data/categorias.ts` (rutas públicas) como las escrituras del antiguo
 * `AdminMockDataService` (panel de administración). API a propósito parecida
 * a la del mock: mismos nombres de método, ahora async.
 */
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly app = inject(FIREBASE_APP);
  private readonly firestore: Firestore = getFirestore(this.app);
  private readonly coleccion = collection(this.firestore, 'categorias');

  // ---------- lectura ----------

  /** Tiempo real, todas las categorías (activas e inactivas) — para el admin. */
  categoriasLive(): Observable<CategoriaDoc[]> {
    const q = query(this.coleccion, orderBy('orden'));
    return collectionSnapshots$<CategoriaDoc>(q);
  }

  /** Una sola lectura, solo activas por defecto — para las rutas públicas. */
  async categoriasOneShot(soloActivas = true): Promise<CategoriaDoc[]> {
    const q = query(this.coleccion, orderBy('orden'));
    const snap = await getDocs(q);
    const todas = snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as CategoriaDoc);
    return soloActivas ? todas.filter((c) => c.activa) : todas;
  }

  async findBySlug(slug: string): Promise<CategoriaDoc | null> {
    const q = query(this.coleccion, where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      return null;
    }
    const d = snap.docs[0];
    return { ...(d.data() as object), id: d.id } as CategoriaDoc;
  }

  /** Tiempo real + cantidad de videos por categoría (query de conteo, sin denormalizar). */
  categoriasConConteoLive(): Observable<(CategoriaDoc & { videoCount: number })[]> {
    return this.categoriasLive().pipe(
      switchMap(async (categorias) => {
        const videosColeccion = collection(this.firestore, 'videos');
        return Promise.all(
          categorias.map(async (c) => {
            const countSnap = await getCountFromServer(
              query(videosColeccion, where('categoriaId', '==', c.id))
            );
            return { ...c, videoCount: countSnap.data().count };
          })
        );
      })
    );
  }

  // ---------- escritura (protegida por firestore.rules; requiere admin) ----------

  async agregarCategoria(datos: CategoriaFormInput): Promise<void> {
    const countSnap = await getCountFromServer(this.coleccion);
    await addDoc(this.coleccion, {
      nombre: datos.nombre,
      icono: datos.icono,
      slug: slugify(datos.nombre),
      orden: countSnap.data().count,
      activa: datos.activa ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  async actualizarCategoria(id: string, datos: CategoriaFormInput): Promise<void> {
    const ref = doc(this.firestore, 'categorias', id);
    const anteriorSnap = await getDoc(ref);
    const anterior = anteriorSnap.exists() ? (anteriorSnap.data() as CategoriaDoc) : undefined;

    const batch = writeBatch(this.firestore);
    batch.update(ref, {
      nombre: datos.nombre,
      icono: datos.icono,
      slug: slugify(datos.nombre),
      ...(datos.activa !== undefined ? { activa: datos.activa } : {}),
      updatedAt: serverTimestamp()
    });

    // El vínculo categoría-video también guarda el nombre denormalizado
    // (compat con videoMod/reel-card): si se renombra, se actualiza en cascada.
    if (anterior && anterior.nombre !== datos.nombre) {
      const videosQ = query(collection(this.firestore, 'videos'), where('categoriaId', '==', id));
      const videosSnap = await getDocs(videosQ);
      videosSnap.forEach((d) => {
        batch.update(d.ref, { categoria: datos.nombre, updatedAt: serverTimestamp() });
      });
    }

    await batch.commit();
  }

  async eliminarCategoria(id: string): Promise<void> {
    const videosQ = query(collection(this.firestore, 'videos'), where('categoriaId', '==', id));
    const videosSnap = await getDocs(videosQ);

    const batch = writeBatch(this.firestore);
    videosSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(this.firestore, 'categorias', id));
    await batch.commit();
  }

  async reordenarCategorias(idsEnOrden: string[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    idsEnOrden.forEach((id, index) => {
      batch.update(doc(this.firestore, 'categorias', id), {
        orden: index,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import {
  Firestore,
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
import { AuthService } from './auth.service';

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
  private readonly auth = inject(AuthService);
  private readonly firestore: Firestore = getFirestore(this.app);
  private readonly coleccion = collection(this.firestore, 'categorias');

  // ---------- lectura ----------

  /** Tiempo real, todas las categorías (activas e inactivas) — para el admin. */
  categoriasLive(): Observable<CategoriaDoc[]> {
    const q = query(this.coleccion, orderBy('orden'));
    return collectionSnapshots$<CategoriaDoc>(q);
  }

  /**
   * Una sola lectura, solo activas por defecto — para las rutas públicas.
   * El filtro va en la propia consulta (`where`), no en memoria: con las
   * reglas de seguridad de Firestore, si una consulta trajera un documento
   * inactivo y quien pregunta no es admin, toda la consulta fallaría con
   * permission-denied. El orden se resuelve en JS para no necesitar un
   * índice compuesto nuevo.
   */
  async categoriasOneShot(soloActivas = true): Promise<CategoriaDoc[]> {
    const q = soloActivas ? query(this.coleccion, where('activa', '==', true)) : query(this.coleccion);
    const snap = await getDocs(q);
    const todas = snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as CategoriaDoc);
    return todas.sort((a, b) => a.orden - b.orden);
  }

  async findBySlug(slug: string): Promise<CategoriaDoc | null> {
    const q = query(this.coleccion, where('slug', '==', slug), where('activa', '==', true), limit(1));
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

  private registrarAuditoria(
    batch: ReturnType<typeof writeBatch>,
    accion: 'crear' | 'actualizar' | 'eliminar',
    coleccion: 'categorias' | 'videos',
    docId: string
  ): void {
    const entrada = doc(collection(this.firestore, 'auditLog'));
    batch.set(entrada, {
      accion,
      coleccion,
      docId,
      adminUid: this.auth.currentUser()?.uid ?? null,
      createdAt: serverTimestamp()
    });
  }

  async agregarCategoria(datos: CategoriaFormInput): Promise<void> {
    const countSnap = await getCountFromServer(this.coleccion);
    const ref = doc(this.coleccion);

    const batch = writeBatch(this.firestore);
    batch.set(ref, {
      nombre: datos.nombre,
      icono: datos.icono,
      slug: slugify(datos.nombre),
      orden: countSnap.data().count,
      activa: datos.activa ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    this.registrarAuditoria(batch, 'crear', 'categorias', ref.id);
    await batch.commit();
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

    this.registrarAuditoria(batch, 'actualizar', 'categorias', id);
    await batch.commit();
  }

  async eliminarCategoria(id: string): Promise<void> {
    const videosQ = query(collection(this.firestore, 'videos'), where('categoriaId', '==', id));
    const videosSnap = await getDocs(videosQ);

    const batch = writeBatch(this.firestore);
    videosSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(this.firestore, 'categorias', id));
    this.registrarAuditoria(batch, 'eliminar', 'categorias', id);
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

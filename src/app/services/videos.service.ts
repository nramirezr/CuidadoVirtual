import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Firestore,
  collection,
  doc,
  getCountFromServer,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { FIREBASE_APP } from '../core/firebase-app.provider';
import { collectionSnapshots$ } from '../core/firestore-rx.util';
import { VideoDoc } from '../models/video-doc.model';
import { AuthService } from './auth.service';
import { FuenteVideo } from '../models/videoMod.model';

export interface VideoFormInput {
  titulo: string;
  descripcion: string;
  fuente: FuenteVideo;
  youtubeId?: string;
  mp4Url?: string;
  posterUrl?: string;
  esPlaceholder?: boolean;
  activo?: boolean;
}

/**
 * Videos respaldados por Firestore. Reemplaza tanto la lectura estática de
 * `data/videos.ts` como las escrituras del antiguo `AdminMockDataService`.
 */
@Injectable({ providedIn: 'root' })
export class VideosService {
  private readonly app = inject(FIREBASE_APP);
  private readonly auth = inject(AuthService);
  private readonly firestore: Firestore = getFirestore(this.app);
  private readonly coleccion = collection(this.firestore, 'videos');

  // ---------- lectura ----------

  /** Tiempo real, todos (activos e inactivos) — para el admin. */
  videosDeCategoriaLive(categoriaId: string): Observable<VideoDoc[]> {
    const q = query(this.coleccion, where('categoriaId', '==', categoriaId), orderBy('orden'));
    return collectionSnapshots$<VideoDoc>(q);
  }

  /**
   * Una sola lectura, solo activos por defecto — para las rutas públicas.
   * El filtro va en la propia consulta (`where`), no en memoria: con las
   * reglas de seguridad de Firestore, si una consulta trajera un documento
   * inactivo y quien pregunta no es admin, toda la consulta fallaría con
   * permission-denied. El orden se resuelve en JS para no necesitar un
   * índice compuesto nuevo.
   */
  async videosDeCategoriaOneShot(categoriaId: string, soloActivos = true): Promise<VideoDoc[]> {
    const condiciones = soloActivos
      ? [where('categoriaId', '==', categoriaId), where('activo', '==', true)]
      : [where('categoriaId', '==', categoriaId)];
    const q = query(this.coleccion, ...condiciones);
    const snap = await getDocs(q);
    const todos = snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as VideoDoc);
    return todos.sort((a, b) => a.orden - b.orden);
  }

  /** Todos los videos, de todas las categorías — para el modo "Ver todos" público. */
  async videosOneShot(soloActivos = true): Promise<VideoDoc[]> {
    const q = soloActivos ? query(this.coleccion, where('activo', '==', true)) : query(this.coleccion);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as VideoDoc);
  }

  // ---------- escritura (protegida por firestore.rules; requiere admin) ----------

  private registrarAuditoria(
    batch: ReturnType<typeof writeBatch>,
    accion: 'crear' | 'actualizar' | 'eliminar',
    docId: string
  ): void {
    const entrada = doc(collection(this.firestore, 'auditLog'));
    batch.set(entrada, {
      accion,
      coleccion: 'videos',
      docId,
      adminUid: this.auth.currentUser()?.uid ?? null,
      createdAt: serverTimestamp()
    });
  }

  async agregarVideo(
    categoriaId: string,
    categoriaNombre: string,
    datos: VideoFormInput
  ): Promise<void> {
    const countSnap = await getCountFromServer(
      query(this.coleccion, where('categoriaId', '==', categoriaId))
    );
    const ref = doc(this.coleccion);

    const batch = writeBatch(this.firestore);
    batch.set(ref, {
      categoriaId,
      categoria: categoriaNombre,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      fuente: datos.fuente,
      youtubeId: datos.youtubeId ?? null,
      mp4Url: datos.mp4Url ?? null,
      posterUrl: datos.posterUrl ?? null,
      esPlaceholder: datos.esPlaceholder ?? false,
      orden: countSnap.data().count,
      activo: datos.activo ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: this.auth.currentUser()?.uid ?? null
    });
    this.registrarAuditoria(batch, 'crear', ref.id);
    await batch.commit();
  }

  async actualizarVideo(id: string, datos: Partial<VideoFormInput>): Promise<void> {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (datos.titulo !== undefined) payload['titulo'] = datos.titulo;
    if (datos.descripcion !== undefined) payload['descripcion'] = datos.descripcion;
    if (datos.fuente !== undefined) payload['fuente'] = datos.fuente;
    if (datos.youtubeId !== undefined) payload['youtubeId'] = datos.youtubeId ?? null;
    if (datos.mp4Url !== undefined) payload['mp4Url'] = datos.mp4Url ?? null;
    if (datos.posterUrl !== undefined) payload['posterUrl'] = datos.posterUrl ?? null;
    if (datos.activo !== undefined) payload['activo'] = datos.activo;

    const batch = writeBatch(this.firestore);
    // batch.update() sin genérico explícito espera UpdateData<DocumentData>; el
    // payload es dinámico (solo trae los campos que cambiaron), y sus
    // overloads no infieren bien un Record<string, unknown> genérico — se
    // castea a `any` deliberadamente en vez de tipar cada combinación posible.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batch.update(doc(this.firestore, 'videos', id), payload as any);
    this.registrarAuditoria(batch, 'actualizar', id);
    await batch.commit();
  }

  async eliminarVideo(id: string): Promise<void> {
    const batch = writeBatch(this.firestore);
    batch.delete(doc(this.firestore, 'videos', id));
    this.registrarAuditoria(batch, 'eliminar', id);
    await batch.commit();
  }
}

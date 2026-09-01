import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
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

  /** Una sola lectura, solo activos por defecto — para las rutas públicas. */
  async videosDeCategoriaOneShot(categoriaId: string, soloActivos = true): Promise<VideoDoc[]> {
    const q = query(this.coleccion, where('categoriaId', '==', categoriaId), orderBy('orden'));
    const snap = await getDocs(q);
    const todos = snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as VideoDoc);
    return soloActivos ? todos.filter((v) => v.activo) : todos;
  }

  /** Todos los videos, de todas las categorías — para el modo "Ver todos" público. */
  async videosOneShot(soloActivos = true): Promise<VideoDoc[]> {
    const snap = await getDocs(this.coleccion);
    const todos = snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as VideoDoc);
    return soloActivos ? todos.filter((v) => v.activo) : todos;
  }

  // ---------- escritura (protegida por firestore.rules; requiere admin) ----------

  async agregarVideo(
    categoriaId: string,
    categoriaNombre: string,
    datos: VideoFormInput
  ): Promise<void> {
    const countSnap = await getCountFromServer(
      query(this.coleccion, where('categoriaId', '==', categoriaId))
    );
    await addDoc(this.coleccion, {
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
    // updateDoc() sin genérico explícito espera UpdateData<DocumentData>; el
    // payload es dinámico (solo trae los campos que cambiaron), y sus
    // overloads no infieren bien un Record<string, unknown> genérico — se
    // castea a `any` deliberadamente en vez de tipar cada combinación posible.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(doc(this.firestore, 'videos', id), payload as any);
  }

  async eliminarVideo(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'videos', id));
  }
}

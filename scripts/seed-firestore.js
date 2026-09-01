#!/usr/bin/env node
'use strict';

/**
 * Script de migración/seed, una sola vez: escribe las 11 categorías y sus
 * videos placeholder (hoy hardcodeados en src/app/data/categorias.ts y
 * src/app/data/videos.ts) en Firestore. Corre localmente con firebase-admin
 * (bypassa firestore.rules por completo, ya que usa una credencial de
 * service account), NUNCA en CI, y NUNCA se importa desde src/ de Angular.
 *
 * Uso:
 *   node scripts/seed-firestore.js --key-file=/ruta/a/tu-service-account.json
 *   node scripts/seed-firestore.js --key-file=... --force   (reinserta aunque ya haya datos)
 *
 * También acepta la credencial vía la variable de entorno
 * FIREBASE_SERVICE_ACCOUNT_KEY (mismo formato base64 que usa api/increment-visit.ts),
 * si prefieres no pasar un archivo.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const COMBINING_MARKS = /[̀-ͯ]/g;

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Espejo de src/app/data/categorias.ts (sin los helpers, que no aplican aquí).
const categorias = [
  { nombre: 'Sonda Nasogástrica', icono: '💉👃🥛' },
  { nombre: 'Hipoglicemiantes', icono: '📉🍬' },
  { nombre: 'Anticoagulante', icono: '🩸' },
  { nombre: 'Traqueotomia', icono: '🫁' },
  { nombre: 'Cateter Urinario Permanente', icono: '🚽' },
  { nombre: 'Catéter Subcutáneo', icono: '💉' },
  { nombre: 'Gastrostomía', icono: '🍼' },
  { nombre: 'Analgésia y dolor', icono: '💊' },
  { nombre: 'Prevención de caídas', icono: '🚧' },
  { nombre: 'Apoyo Social', icono: '🤝' },
  { nombre: 'Cuidados para el Cuidador', icono: '🫂' }
];

// Espejo de src/app/data/videos.ts.
const PLACEHOLDER_NOTICE = 'CONTENIDO DE EJEMPLO — reemplazar antes de producción.';
const videos = [
  {
    categoria: 'Sonda Nasogástrica',
    titulo: 'Cuidados en casa para paciente con sonda nasogástrica',
    descripcion: `Recomendaciones básicas de manejo diario de la sonda nasogástrica en el hogar. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'Yd2LGPhqlG4'
  },
  {
    categoria: 'Hipoglicemiantes',
    titulo: 'Inyección de insulina por vía subcutánea',
    descripcion: `Recomendaciones para el manejo de insulina en el domicilio. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'EVYGp38fVZE'
  },
  {
    categoria: 'Anticoagulante',
    titulo: 'Terapia anticoagulante y cuidados de enfermería',
    descripcion: `Qué considerar durante un tratamiento con anticoagulantes. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'occm4Ozzrbs'
  },
  {
    categoria: 'Traqueotomia',
    titulo: 'Cuidados en casa para paciente con traqueostomía',
    descripcion: `Manejo básico de la traqueostomía en el hogar. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'RHAQBOfrEaw'
  },
  {
    categoria: 'Cateter Urinario Permanente',
    titulo: 'Manejo y cuidados de la sonda Foley',
    descripcion: `Cuidados diarios del catéter urinario permanente. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: '1WkvJXDI4UU'
  },
  {
    categoria: 'Catéter Subcutáneo',
    titulo: 'Instalación de catéter subcutáneo',
    descripcion: `Procedimiento y cuidados del catéter subcutáneo. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'xoeddeMR-qs'
  },
  {
    categoria: 'Gastrostomía',
    titulo: 'Manejo de gastrostomía en casa | Cuidados del estoma',
    descripcion: `Cuidados del estoma y alimentación por gastrostomía. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'UVcVdiomDqU'
  },
  {
    categoria: 'Analgésia y dolor',
    titulo: 'Importancia del control del dolor en cuidados paliativos',
    descripcion: `Por qué es clave el manejo del dolor en el paciente. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'NIu5pXaClTE'
  },
  {
    categoria: 'Prevención de caídas',
    titulo: 'Cómo prevenir caídas en personas mayores',
    descripcion: `Medidas simples para reducir el riesgo de caídas en el hogar. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'AG-lpTfZYLc'
  },
  {
    categoria: 'Apoyo Social',
    titulo: 'Aprende a crear tus redes de apoyo como cuidador',
    descripcion: `Cómo construir una red de apoyo social como cuidador. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'ClbG0UO5oR8'
  },
  {
    categoria: 'Cuidados para el Cuidador',
    titulo: 'Cuidar y cuidarte: evita la sobrecarga del cuidador',
    descripcion: `Señales de sobrecarga y cómo cuidar de uno mismo. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'JZYIePlpptA'
  }
];

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const keyFileArg = args.find((a) => a.startsWith('--key-file='));
  const keyFile = keyFileArg ? keyFileArg.slice('--key-file='.length) : null;

  let credentialJson;
  if (keyFile) {
    credentialJson = JSON.parse(fs.readFileSync(path.resolve(keyFile), 'utf8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    credentialJson = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
    );
  } else {
    console.error(
      'Falta credencial. Pasa --key-file=ruta/al/service-account.json (descargado desde\n' +
        'Firebase Console > Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada)\n' +
        'o setea la variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY.'
    );
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(credentialJson) });
  }
  const db = getFirestore();

  const existentes = await db.collection('categorias').limit(1).get();
  if (!existentes.empty && !force) {
    console.error(
      'La colección "categorias" ya tiene documentos — no se hace nada.\n' +
        'Pasa --force si de verdad quieres insertar de todas formas (puede duplicar datos).'
    );
    process.exit(1);
  }

  const idPorNombre = new Map();
  for (let i = 0; i < categorias.length; i++) {
    const c = categorias[i];
    const ref = await db.collection('categorias').add({
      nombre: c.nombre,
      icono: c.icono,
      slug: slugify(c.nombre),
      orden: i,
      activa: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    idPorNombre.set(c.nombre, ref.id);
    console.log(`categoría creada: ${c.nombre} -> ${ref.id}`);
  }

  const ordenPorCategoria = new Map();
  for (const v of videos) {
    const categoriaId = idPorNombre.get(v.categoria);
    if (!categoriaId) {
      console.warn(`video "${v.titulo}" referencia una categoría desconocida ("${v.categoria}") — se omite`);
      continue;
    }
    const orden = ordenPorCategoria.get(categoriaId) ?? 0;
    await db.collection('videos').add({
      categoriaId,
      categoria: v.categoria,
      titulo: v.titulo,
      descripcion: v.descripcion,
      fuente: v.fuente,
      youtubeId: v.youtubeId ?? null,
      mp4Url: v.mp4Url ?? null,
      posterUrl: v.posterUrl ?? null,
      esPlaceholder: true,
      orden,
      activo: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: null
    });
    ordenPorCategoria.set(categoriaId, orden + 1);
    console.log(`video creado: ${v.titulo}`);
  }

  console.log(`\nListo: ${categorias.length} categorías, ${videos.length} videos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

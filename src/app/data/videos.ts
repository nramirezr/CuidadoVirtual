import { videoMod } from '../models/videoMod.model';

const PLACEHOLDER_NOTICE = 'CONTENIDO DE EJEMPLO — reemplazar antes de producción.';

export const videos: videoMod[] = [
  {
    id: 'sg-01',
    categoria: 'Sonda Nasogástrica',
    titulo: 'Cuidados en casa para paciente con sonda nasogástrica',
    descripcion: `Recomendaciones básicas de manejo diario de la sonda nasogástrica en el hogar. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'Yd2LGPhqlG4',
    esPlaceholder: true
  },
  {
    id: 'hg-01',
    categoria: 'Hipoglicemiantes',
    titulo: 'Inyección de insulina por vía subcutánea',
    descripcion: `Recomendaciones para el manejo de insulina en el domicilio. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'EVYGp38fVZE',
    esPlaceholder: true
  },
  {
    id: 'ac-01',
    categoria: 'Anticoagulante',
    titulo: 'Terapia anticoagulante y cuidados de enfermería',
    descripcion: `Qué considerar durante un tratamiento con anticoagulantes. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'occm4Ozzrbs',
    esPlaceholder: true
  },
  {
    id: 'tr-01',
    categoria: 'Traqueotomia',
    titulo: 'Cuidados en casa para paciente con traqueostomía',
    descripcion: `Manejo básico de la traqueostomía en el hogar. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'RHAQBOfrEaw',
    esPlaceholder: true
  },
  {
    id: 'cu-01',
    categoria: 'Cateter Urinario Permanente',
    titulo: 'Manejo y cuidados de la sonda Foley',
    descripcion: `Cuidados diarios del catéter urinario permanente. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: '1WkvJXDI4UU',
    esPlaceholder: true
  },
  {
    id: 'ca-01',
    categoria: 'Catéter Subcutáneo',
    titulo: 'Instalación de catéter subcutáneo',
    descripcion: `Procedimiento y cuidados del catéter subcutáneo. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'xoeddeMR-qs',
    esPlaceholder: true
  },
  {
    id: 'ga-01',
    categoria: 'Gastrostomía',
    titulo: 'Manejo de gastrostomía en casa | Cuidados del estoma',
    descripcion: `Cuidados del estoma y alimentación por gastrostomía. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'UVcVdiomDqU',
    esPlaceholder: true
  },
  {
    id: 'an-01',
    categoria: 'Analgésia y dolor',
    titulo: 'Importancia del control del dolor en cuidados paliativos',
    descripcion: `Por qué es clave el manejo del dolor en el paciente. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'NIu5pXaClTE',
    esPlaceholder: true
  },
  {
    id: 'pc-01',
    categoria: 'Prevención de caídas',
    titulo: 'Cómo prevenir caídas en personas mayores',
    descripcion: `Medidas simples para reducir el riesgo de caídas en el hogar. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'AG-lpTfZYLc',
    esPlaceholder: true
  },
  {
    id: 'sc-01',
    categoria: 'Apoyo Social',
    titulo: 'Aprende a crear tus redes de apoyo como cuidador',
    descripcion: `Cómo construir una red de apoyo social como cuidador. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'ClbG0UO5oR8',
    esPlaceholder: true
  },
  {
    id: 'do-01',
    categoria: 'Cuidados para el Cuidador',
    titulo: 'Cuidar y cuidarte: evita la sobrecarga del cuidador',
    descripcion: `Señales de sobrecarga y cómo cuidar de uno mismo. ${PLACEHOLDER_NOTICE}`,
    fuente: 'youtube',
    youtubeId: 'JZYIePlpptA',
    esPlaceholder: true
  }
];

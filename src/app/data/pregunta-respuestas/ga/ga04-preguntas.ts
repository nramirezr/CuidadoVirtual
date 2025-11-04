import { pregRespMod } from '@models/pregRespMod.model';

// Código: GA04 (Signos de Alarma)
export const ga04Preguntas: pregRespMod[] = [
  {
    codigo: 'GA04',
    pregunta: '¿Qué debo hacer si la sonda de Gastrostomía se sale completamente?',
    respuesta: '¡Actúe rápido! El orificio puede cerrarse en horas. Cubra el orificio con una gasa limpia y seca sin presionar. Llame a hospitalización domiciliaria o acuda inmediatamente a urgencias.'
  },
  {
    codigo: 'GA04',
    pregunta: '¿Qué hago si sale líquido del estómago o el alimento por el orificio de la sonda?',
    respuesta: 'Puede ser signo de que el orificio se ha agrandado o que el balón interno se desinfló. Limpie la piel y coloque una gasa. Avise al equipo de salud para que revisen el tope de la sonda.'
  },
  {
    codigo: 'GA04',
    pregunta: '¿Qué significa si la piel alrededor de la sonda está roja, inflamada o con pus?',
    respuesta: 'Es señal de una posible infección. No aplique cremas o pomadas. Limpie suavemente la zona y avise inmediatamente al equipo de salud. Podría necesitar antibióticos.'
  },
  {
    codigo: 'GA04',
    pregunta: '¿Cuándo debo acudir al servicio de urgencia por la Gastrostomía?',
    respuesta: 'Debe acudir de inmediato si: la sonda se sale y no puede reinsertarla rápidamente, hay sangrado abundante del orificio, el paciente presenta fiebre alta o dolor abdominal intenso, o si tiene náuseas y vómitos constantes y el tubo no funciona.'
  }
];

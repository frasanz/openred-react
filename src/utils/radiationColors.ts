/**
 * Calcula el color RGB para un valor de radiación dado.
 * Escala: Azul oscuro → Azul claro → Verde → Amarillo → Naranja → Rojo → Morado
 * @param value Valor de radiación en µSv/h
 * @returns Array [R, G, B] con valores 0-255
 */
export const getRadiationColor = (value: number): [number, number, number] => {
  if (value < 0.08) {
    // Azul oscuro a azul claro (0-0.08 µSv/h)
    const t = value / 0.08;
    const red = 0;
    const green = Math.round(0 + t * 100); // 0 a 100
    const blue = Math.round(139 + t * 116); // 139 a 255
    return [red, green, blue];
  } else if (value < 0.12) {
    // Azul claro a verde (0.08-0.12 µSv/h)
    const t = (value - 0.08) / 0.04;
    const red = 0;
    const green = Math.round(100 + t * 155); // 100 a 255
    const blue = Math.round(255 - t * 255); // 255 a 0
    return [red, green, blue];
  } else if (value < 0.16) {
    // Verde a amarillo (0.12-0.16 µSv/h)
    const t = (value - 0.12) / 0.04;
    const red = Math.round(0 + t * 255); // 0 a 255
    const green = 255;
    const blue = 0;
    return [red, green, blue];
  } else if (value < 0.20) {
    // Amarillo a naranja (0.16-0.20 µSv/h)
    const t = (value - 0.16) / 0.04;
    const red = 255;
    const green = Math.round(255 - t * 90); // 255 a 165
    const blue = 0;
    return [red, green, blue];
  } else if (value < 0.30) {
    // Naranja a rojo (0.20-0.30 µSv/h)
    const t = (value - 0.20) / 0.10;
    const red = 255;
    const green = Math.round(165 - t * 165); // 165 a 0
    const blue = 0;
    return [red, green, blue];
  } else if (value < 0.50) {
    // Rojo a morado (0.30-0.50 µSv/h)
    const t = (value - 0.30) / 0.20;
    const red = Math.round(255 - t * 105); // 255 a 150
    const green = 0;
    const blue = Math.round(0 + t * 200); // 0 a 200
    return [red, green, blue];
  } else {
    // Morado intenso (0.50+ µSv/h)
    return [150, 0, 200];
  }
};

/**
 * Versión con alpha para usar en capas con transparencia
 */
export const getRadiationColorWithAlpha = (value: number): [number, number, number, number] => {
  const [r, g, b] = getRadiationColor(value);
  return [r, g, b, 200];
};

/**
 * Calcula el color RGB para un valor de iluminación (lux) en contaminación lumínica.
 * Escala: Azul oscuro (muy oscuro/cielo limpio) → Naranja → Rojo brillante (muy contaminado)
 * @param value Valor de iluminación en lux
 * @returns Array [R, G, B] con valores 0-255
 */
export const getLightPollutionColor = (value: number): [number, number, number] => {
  // Escala logarítmica para lux (típicamente 0.0001 a 10+ lux)
  if (value < 0.001) {
    // Azul muy oscuro (cielo excelente)
    return [0, 0, 80];
  } else if (value < 0.01) {
    // Azul oscuro a azul (0.001-0.01 lux)
    const t = (value - 0.001) / 0.009;
    const red = 0;
    const green = Math.round(0 + t * 50);
    const blue = Math.round(80 + t * 100);
    return [red, green, blue];
  } else if (value < 0.1) {
    // Azul a verde azulado (0.01-0.1 lux)
    const t = (value - 0.01) / 0.09;
    const red = 0;
    const green = Math.round(50 + t * 155);
    const blue = Math.round(180 - t * 80);
    return [red, green, blue];
  } else if (value < 1.0) {
    // Verde a amarillo (0.1-1.0 lux)
    const t = (value - 0.1) / 0.9;
    const red = Math.round(0 + t * 255);
    const green = Math.round(205 + t * 50);
    const blue = Math.round(100 - t * 100);
    return [red, green, blue];
  } else if (value < 10.0) {
    // Amarillo a naranja (1-10 lux)
    const t = (value - 1.0) / 9.0;
    const red = 255;
    const green = Math.round(255 - t * 90);
    const blue = 0;
    return [red, green, blue];
  } else {
    // Naranja a rojo (10+ lux - muy contaminado)
    const t = Math.min(1, (value - 10.0) / 40.0);
    const red = 255;
    const green = Math.round(165 - t * 165);
    const blue = 0;
    return [red, green, blue];
  }
};

/**
 * Versión con alpha para contaminación lumínica
 */
export const getLightPollutionColorWithAlpha = (value: number): [number, number, number, number] => {
  const [r, g, b] = getLightPollutionColor(value);
  return [r, g, b, 200];
};

/**
 * Calcula el color RGB para una temperatura de color (CCT) en Kelvin.
 * Escala 2000K (cálido, naranja) → 3500K (amarillo) → 5000K (blanco neutro) → 7000K (frío, azul).
 * Valores fuera del rango se saturan a los extremos.
 * @param kelvin Temperatura de color en K
 * @returns Array [R, G, B] con valores 0-255
 */
export const getCCTColor = (kelvin: number): [number, number, number] => {
  if (kelvin <= 2000) {
    return [255, 130, 40]; // Naranja cálido
  } else if (kelvin < 3500) {
    // Naranja cálido → Amarillo (2000-3500K)
    const t = (kelvin - 2000) / 1500;
    const red = 255;
    const green = Math.round(130 + t * 100); // 130 a 230
    const blue = Math.round(40 + t * 100);   // 40 a 140
    return [red, green, blue];
  } else if (kelvin < 5000) {
    // Amarillo → Blanco neutro (3500-5000K)
    const t = (kelvin - 3500) / 1500;
    const red = 255;
    const green = Math.round(230 + t * 25);  // 230 a 255
    const blue = Math.round(140 + t * 115);  // 140 a 255
    return [red, green, blue];
  } else if (kelvin < 7000) {
    // Blanco → Azul frío (5000-7000K)
    const t = (kelvin - 5000) / 2000;
    const red = Math.round(255 - t * 100);   // 255 a 155
    const green = Math.round(255 - t * 60);  // 255 a 195
    const blue = 255;
    return [red, green, blue];
  } else {
    return [155, 195, 255]; // Azul frío saturado
  }
};

/**
 * Leyenda de colores para contaminación lumínica - Temperatura de color (CCT)
 */
export const LIGHT_POLLUTION_CCT_LEGEND: LegendItem[] = [
  {
    range: '<2700',
    gradient: 'linear-gradient(to right, rgb(255,130,40), rgb(255,176,84))',
    label: '<2700 K',
    qualifierKey: 'legend.cctQuality.veryWarm'
  },
  {
    range: '2700-3500',
    gradient: 'linear-gradient(to right, rgb(255,176,84), rgb(255,230,140))',
    label: '2700-3500 K',
    qualifierKey: 'legend.cctQuality.warm'
  },
  {
    range: '3500-5000',
    gradient: 'linear-gradient(to right, rgb(255,230,140), rgb(255,255,255))',
    label: '3500-5000 K',
    qualifierKey: 'legend.cctQuality.neutral'
  },
  {
    range: '5000-6500',
    gradient: 'linear-gradient(to right, rgb(255,255,255), rgb(180,217,255))',
    label: '5000-6500 K',
    qualifierKey: 'legend.cctQuality.cool'
  },
  {
    range: '>6500',
    gradient: 'linear-gradient(to right, rgb(180,217,255), rgb(155,195,255))',
    label: '>6500 K',
    qualifierKey: 'legend.cctQuality.veryCool'
  }
];

/**
 * Entrada de leyenda. `qualifierKey` es una clave i18n (namespace map) opcional
 * para cualificadores traducibles (p. ej. calidad del cielo en lux).
 */
export interface LegendItem {
  range: string;
  gradient: string;
  label: string;
  qualifierKey?: string;
}

/**
 * Leyenda de colores para mostrar en la UI - Radiación
 */
export const RADIATION_LEGEND: LegendItem[] = [
  {
    range: '0-0.08',
    gradient: 'linear-gradient(to right, rgb(0,0,139), rgb(0,100,255))',
    label: '0-0.08 µSv/h'
  },
  {
    range: '0.08-0.12',
    gradient: 'linear-gradient(to right, rgb(0,100,255), rgb(0,255,0))',
    label: '0.08-0.12 µSv/h'
  },
  {
    range: '0.12-0.16',
    gradient: 'linear-gradient(to right, rgb(0,255,0), rgb(255,255,0))',
    label: '0.12-0.16 µSv/h'
  },
  {
    range: '0.16-0.20',
    gradient: 'linear-gradient(to right, rgb(255,255,0), rgb(255,165,0))',
    label: '0.16-0.20 µSv/h'
  },
  {
    range: '0.20-0.30',
    gradient: 'linear-gradient(to right, rgb(255,165,0), rgb(255,0,0))',
    label: '0.20-0.30 µSv/h'
  },
  {
    range: '0.30-0.50',
    gradient: 'linear-gradient(to right, rgb(255,0,0), rgb(150,0,200))',
    label: '0.30-0.50 µSv/h'
  },
  {
    range: '0.50+',
    gradient: 'rgb(150,0,200)',
    label: '0.50+ µSv/h'
  }
];

/**
 * Leyenda de colores para contaminación lumínica - Escala en lux
 */
export const LIGHT_POLLUTION_LEGEND: LegendItem[] = [
  {
    range: '<0.001',
    gradient: 'rgb(0,0,80)',
    label: '<0.001 lux',
    qualifierKey: 'legend.luxQuality.excellent'
  },
  {
    range: '0.001-0.01',
    gradient: 'linear-gradient(to right, rgb(0,0,80), rgb(0,50,180))',
    label: '0.001-0.01 lux',
    qualifierKey: 'legend.luxQuality.good'
  },
  {
    range: '0.01-0.1',
    gradient: 'linear-gradient(to right, rgb(0,50,180), rgb(0,205,100))',
    label: '0.01-0.1 lux',
    qualifierKey: 'legend.luxQuality.acceptable'
  },
  {
    range: '0.1-1.0',
    gradient: 'linear-gradient(to right, rgb(0,205,100), rgb(255,255,0))',
    label: '0.1-1.0 lux',
    qualifierKey: 'legend.luxQuality.moderate'
  },
  {
    range: '1.0-10',
    gradient: 'linear-gradient(to right, rgb(255,255,0), rgb(255,165,0))',
    label: '1.0-10 lux',
    qualifierKey: 'legend.luxQuality.high'
  },
  {
    range: '>10',
    gradient: 'linear-gradient(to right, rgb(255,165,0), rgb(255,0,0))',
    label: '>10 lux',
    qualifierKey: 'legend.luxQuality.veryHigh'
  }
];

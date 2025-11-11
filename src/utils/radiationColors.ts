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
 * Leyenda de colores para mostrar en la UI
 */
export const RADIATION_LEGEND = [
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

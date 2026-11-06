import { describe, expect, it } from 'vitest';
import {
  A4_LANDSCAPE,
  A4_PORTRAIT,
  MM_TO_PT,
  computeWarpDimensions,
  createInitialQuad,
  displayedImageRect,
  fallbackQuad,
  fitImageToA4,
  imagePointToDisplay,
  isConvexQuad,
  orderCorners,
  screenPointToImage,
} from './documentGeometry';

describe('ordenamiento de esquinas', () => {
  it('ordena superior izquierda, superior derecha, inferior derecha e inferior izquierda', () => {
    const ordered = orderCorners([
      { x: 95, y: 180 },
      { x: 10, y: 20 },
      { x: 180, y: 30 },
      { x: 20, y: 190 },
    ]);

    expect(ordered).toEqual([
      { x: 10, y: 20 },
      { x: 180, y: 30 },
      { x: 95, y: 180 },
      { x: 20, y: 190 },
    ]);
    expect(isConvexQuad(ordered)).toBe(true);
  });

  it('mantiene el orden con una perspectiva inclinada', () => {
    const ordered = orderCorners([
      { x: 120, y: 200 },
      { x: 30, y: 10 },
      { x: 220, y: 55 },
      { x: 185, y: 260 },
    ]);

    expect(ordered[0]).toEqual({ x: 30, y: 10 });
    expect(ordered[1]).toEqual({ x: 220, y: 55 });
    expect(ordered[2]).toEqual({ x: 185, y: 260 });
    expect(ordered[3]).toEqual({ x: 120, y: 200 });
  });

  it('rechaza un cuadrilátero cruzado', () => {
    expect(
      isConvexQuad([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
      ]),
    ).toBe(false);
  });
});

describe('conversión entre pantalla e imagen', () => {
  it('calcula el área visible con barras laterales', () => {
    const rect = displayedImageRect(400, 300, 1000, 1000);

    expect(rect.width).toBe(300);
    expect(rect.height).toBe(300);
    expect(rect.x).toBe(50);
    expect(rect.y).toBe(0);
  });

  it('convierte un toque de pantalla a coordenadas de la imagen original', () => {
    const point = screenPointToImage(
      250,
      150,
      { left: 50, top: 0, width: 400, height: 300 },
      1000,
      1000,
    );

    expect(point.x).toBeCloseTo(500, 1);
    expect(point.y).toBeCloseTo(500, 1);
  });

  it('convierte de imagen a pantalla y viceversa sin perder la posición', () => {
    const display = imagePointToDisplay(
      { x: 250, y: 750 },
      400,
      300,
      1000,
      1000,
    );
    const point = screenPointToImage(
      display.x + 50,
      display.y,
      { left: 50, top: 0, width: 400, height: 300 },
      1000,
      1000,
    );

    expect(point.x).toBeCloseTo(250, 4);
    expect(point.y).toBeCloseTo(750, 4);
  });
});

describe('dimensiones del recorte', () => {
  it('usa la mayor anchura y la mayor altura del cuadrilátero', () => {
    const dimensions = computeWarpDimensions([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 120, y: 150 },
      { x: 0, y: 150 },
    ]);

    expect(dimensions.width).toBe(120);
    expect(dimensions.height).toBe(151);
    expect(dimensions.scale).toBe(1);
  });

  it('limita el lado mayor sin deformar la proporción', () => {
    const dimensions = computeWarpDimensions(
      [
        { x: 0, y: 0 },
        { x: 2000, y: 0 },
        { x: 2000, y: 3000 },
        { x: 0, y: 3000 },
      ],
      2000,
    );

    expect(Math.max(dimensions.width, dimensions.height)).toBe(2000);
    expect(dimensions.width / dimensions.height).toBeCloseTo(2 / 3, 3);
  });
});

describe('rectángulo de respaldo', () => {
  it('deja un margen interior aproximado del 5 %', () => {
    const quad = fallbackQuad(1000, 2000);

    expect(quad[0]).toEqual({ x: 50, y: 100 });
    expect(quad[1]).toEqual({ x: 949, y: 100 });
    expect(quad[2]).toEqual({ x: 949, y: 1899 });
    expect(quad[3]).toEqual({ x: 50, y: 1899 });
  });

  it('usa el rectángulo de respaldo cuando no hay detección', () => {
    const quad = createInitialQuad(null, 1000, 2000);

    expect(quad).toEqual(fallbackQuad(1000, 2000));
  });

  it('conserva una detección válida', () => {
    const detected = [
      { x: 80, y: 120 },
      { x: 900, y: 100 },
      { x: 920, y: 1850 },
      { x: 60, y: 1900 },
    ];

    expect(createInitialQuad(detected, 1000, 2000)).toEqual(
      orderCorners(detected),
    );
  });
});

describe('ajuste a una página A4', () => {
  it('usa A4 vertical para un documento vertical y conserva la proporción', () => {
    const layout = fitImageToA4(2000, 3000);

    expect(layout.orientation).toBe('portrait');
    expect(layout.pageWidth).toBeCloseTo(A4_PORTRAIT.width, 2);
    expect(layout.pageHeight).toBeCloseTo(A4_PORTRAIT.height, 2);
    expect(layout.width / layout.height).toBeCloseTo(2 / 3, 6);
    expect(layout.margin).toBeCloseTo(6 * MM_TO_PT, 6);
    expect(layout.x).toBeGreaterThanOrEqual(layout.margin - 0.000001);
    expect(layout.y).toBeGreaterThanOrEqual(layout.margin - 0.000001);
    expect(layout.x + layout.width).toBeLessThanOrEqual(
      layout.pageWidth - layout.margin + 0.0001,
    );
    expect(layout.y + layout.height).toBeLessThanOrEqual(
      layout.pageHeight - layout.margin + 0.0001,
    );
  });

  it('usa A4 horizontal para un documento apaisado', () => {
    const layout = fitImageToA4(3000, 2000);

    expect(layout.orientation).toBe('landscape');
    expect(layout.pageWidth).toBeCloseTo(A4_LANDSCAPE.width, 2);
    expect(layout.pageHeight).toBeCloseTo(A4_LANDSCAPE.height, 2);
    expect(layout.width / layout.height).toBeCloseTo(1.5, 6);
  });

  it('centra la imagen y deja márgenes uniformes', () => {
    const layout = fitImageToA4(1000, 1000);

    expect(layout.x).toBeCloseTo(
      (layout.pageWidth - layout.width) / 2,
      6,
    );
    expect(layout.y).toBeCloseTo(
      (layout.pageHeight - layout.height) / 2,
      6,
    );
  });
});

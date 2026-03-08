import type { PPCMeta, PPCPoint } from "@/stores/@types/progressive-pointcloud.ts";

export type ColorMode = "height" | "intensity" | "depth" | "hybrid";

/**
 * Turbo colormap - scientifically accurate color scheme
 * Normalized input [0, 1] -> RGB color
 * Based on Google's Turbo colormap for improved perceptual uniformity
 */
export function turboColormap(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));

  const r = Math.max(
    0,
    Math.min(
      255,
      Math.round(
        34.61 +
          t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))
      )
    )
  );

  const g = Math.max(
    0,
    Math.min(
      255,
      Math.round(
        23.31 +
          t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))
      )
    )
  );

  const b = Math.max(
    0,
    Math.min(
      255,
      Math.round(
        27.2 +
          t *
            (3211.1 -
              t * (15327.97 - t * (27814.0 - t * (22569.18 - t * 6838.66))))
      )
    )
  );

  return [r, g, b];
}

/**
 * Jet colormap for depth visualization
 * Normalized input [0, 1] -> RGB color
 * Blue (0) -> Cyan -> Green -> Yellow -> Red (1)
 */
export function jetColormap(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));

  let r: number, g: number, b: number;

  if (t < 0.25) {
    r = 0;
    g = 0;
    b = Math.round(255 * (0.5 + t * 2));
  } else if (t < 0.5) {
    r = 0;
    g = Math.round(255 * ((t - 0.25) * 4));
    b = 255;
  } else if (t < 0.75) {
    r = Math.round(255 * ((t - 0.5) * 4));
    g = 255;
    b = Math.round(255 * (1 - (t - 0.5) * 4));
  } else {
    r = 255;
    g = Math.round(255 * (1 - (t - 0.75) * 4));
    b = 0;
  }

  return [r, g, b];
}

/**
 * Calculate color based on selected mode and point data
 * Returns [R, G, B, A] values in range [0, 255]
 */
export function calculateColor(
  point: PPCPoint,
  meta: PPCMeta,
  mode: ColorMode
): [number, number, number, number] {
  const { x, y, z, intensity } = point;

  if (x === null || y === null || z === null) {
    return [0, 0, 0, 0];
  }

  const distance = Math.sqrt(x * x + y * y);

  switch (mode) {
    case "height": {
      const normalizedHeight = (z - meta.min_z) / (meta.max_z - meta.min_z || 1);
      const [r, g, b] = turboColormap(normalizedHeight);
      return [r, g, b, 255];
    }

    case "intensity": {
      if (intensity === null) return [128, 128, 128, 255];
      // Assuming intensity is in range [0, 255] or similar
      const normalizedIntensity = Math.max(0, Math.min(1, intensity / 255));
      const value = Math.round(normalizedIntensity * 255);
      return [value, value, value, 255];
    }

    case "depth": {
      const maxDistance = Math.sqrt(meta.max_x * meta.max_x + meta.max_y * meta.max_y);
      const normalizedDepth = distance / (maxDistance || 1);
      const [r, g, b] = jetColormap(1 - normalizedDepth); // Invert so close is red
      return [r, g, b, 255];
    }

    case "hybrid": {
      const normalizedHeight = (z - meta.min_z) / (meta.max_z - meta.min_z || 1);
      const [r, g, b] = turboColormap(normalizedHeight);
      const alpha = intensity !== null ? Math.max(128, Math.min(255, intensity)) : 255;
      return [r, g, b, alpha];
    }

    default:
      return [255, 255, 255, 255];
  }
}

/**
 * Calculate point size based on distance
 * Closer points are rendered larger
 */
export function calculatePointSize(distance: number, maxDistance: number): number {
  const normalizedDistance = distance / (maxDistance || 1);
  // Point size range: 1-4 pixels
  // Close points (0 distance) -> 4px
  // Far points (max distance) -> 1px
  return Math.max(1, Math.min(4, 4 - normalizedDistance * 3));
}
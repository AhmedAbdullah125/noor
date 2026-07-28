import { FALLBACK_IMAGE_URL } from "../constants";

/**
 * Swap a broken <img> to the bundled logo exactly once. Safety net for raw
 * <img> tags that don't go through <AppImage> — wired globally in App.tsx.
 * The logo is shown contained on a white background so it never stretches.
 */
export function applyImageFallback(img: HTMLImageElement): void {
  if (img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = FALLBACK_IMAGE_URL;
  img.style.objectFit = "contain";
  img.style.backgroundColor = "#ffffff";
  img.style.padding = "12%";
}

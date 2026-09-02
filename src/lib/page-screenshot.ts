import { domToJpeg } from "modern-screenshot";

export function getExportRoot(): HTMLElement {
  return (
    document.querySelector<HTMLElement>(".app-shell") ??
    document.querySelector<HTMLElement>("main") ??
    document.body
  );
}

export function getFullPageSize(root: HTMLElement) {
  return {
    width: Math.ceil(Math.max(root.scrollWidth, root.offsetWidth, root.clientWidth)),
    height: Math.ceil(Math.max(root.scrollHeight, root.offsetHeight, root.clientHeight)),
  };
}

export function exportScale(root: HTMLElement, maxDimension = 8192): number {
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const preferred = Math.min(2, dpr);
  const { width, height } = getFullPageSize(root);
  const scaledHeight = height * preferred;
  const scaledWidth = width * preferred;
  if (scaledHeight <= maxDimension && scaledWidth <= maxDimension) return preferred;
  return Math.min(maxDimension / height, maxDimension / width, 1);
}

function prepareClonedNode(node: Node) {
  if (!(node instanceof HTMLElement)) return;

  const style = window.getComputedStyle(node);
  const overflowBlocksCapture =
    style.overflow === "auto" ||
    style.overflow === "scroll" ||
    style.overflow === "hidden" ||
    style.overflowX === "auto" ||
    style.overflowX === "scroll" ||
    style.overflowX === "hidden" ||
    style.overflowY === "auto" ||
    style.overflowY === "scroll" ||
    style.overflowY === "hidden";

  if (overflowBlocksCapture) {
    node.style.overflow = "visible";
    node.style.overflowX = "visible";
    node.style.overflowY = "visible";
    node.style.maxHeight = "none";
    node.style.maxWidth = "none";
  }

  if (style.position === "sticky" || style.position === "fixed") {
    node.style.position = "static";
  }
}

export async function captureFullPageJpeg(root: HTMLElement): Promise<string> {
  const savedScrollX = window.scrollX;
  const savedScrollY = window.scrollY;
  window.scrollTo(0, 0);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const { width, height } = getFullPageSize(root);

    return await domToJpeg(root, {
      quality: 0.92,
      scale: exportScale(root),
      width,
      height,
      backgroundColor: "#f8fafc",
      features: {
        restoreScrollPosition: true,
      },
      filter: (node) => !(node instanceof Element && node.classList.contains("no-print")),
      onCloneEachNode: prepareClonedNode,
    });
  } finally {
    window.scrollTo(savedScrollX, savedScrollY);
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportFilename(prefix = "family-finance"): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.jpg`;
}

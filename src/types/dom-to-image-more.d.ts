declare module "dom-to-image-more" {
  interface Options {
    bgcolor?: string;
    scale?: number;
    quality?: number;
    width?: number;
    height?: number;
    style?: Partial<CSSStyleDeclaration>;
    filter?: (node: Node) => boolean;
  }

  function toPng(node: HTMLElement, options?: Options): Promise<string>;
  function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
  function toSvg(node: HTMLElement, options?: Options): Promise<string>;

  export default { toPng, toJpeg, toBlob, toSvg };

  const chartDataUrl = await domtoimage.toPng(container, {
    bgcolor: "#f1f5f9",
    scale: 2,
    width: container.offsetWidth,
    height: container.offsetHeight,
    filter: (node: Node) => {
      if (node instanceof HTMLElement) {
        return !node.classList.contains("recharts-legend-wrapper");
      }
      return true;
    },
  });
}

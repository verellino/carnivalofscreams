import { Mesh, Program, Texture } from "ogl";
import type { Geometry, OGLRenderingContext, Transform } from "ogl";

import { fragment, vertex } from "./shaders";
import type { ScrollState, Viewport } from "./types";

export type MediaOptions = {
  element: HTMLElement;
  geometry: Geometry;
  gl: OGLRenderingContext;
  height: number;
  scene: Transform;
  screen: { width: number; height: number };
  viewport: Viewport;
};

export default class Media {
  element: HTMLElement;
  image: HTMLImageElement;
  extra = 0;
  height: number;
  geometry: Geometry;
  gl: OGLRenderingContext;
  scene: Transform;
  screen: { width: number; height: number };
  viewport: Viewport;
  plane!: Mesh;
  bounds!: DOMRect;
  isBefore = false;
  isAfter = false;

  constructor({
    element,
    geometry,
    gl,
    height,
    scene,
    screen,
    viewport,
  }: MediaOptions) {
    this.element = element;
    this.image = this.element.querySelector("img") as HTMLImageElement;
    this.geometry = geometry;
    this.gl = gl;
    this.height = height;
    this.scene = scene;
    this.screen = screen;
    this.viewport = viewport;

    this.createMesh();
    this.createBounds();
    this.onResize();
  }

  createMesh() {
    const texture = new Texture(this.gl, {
      generateMipmaps: false,
    });

    const program = new Program(this.gl, {
      fragment,
      vertex,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uViewportSizes: { value: [this.viewport.width, this.viewport.height] },
        uStrength: { value: 0 },
      },
      transparent: true,
    });

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = this.image.currentSrc || this.image.src;
    image.onload = () => {
      program.uniforms.uImageSizes.value = [
        image.naturalWidth,
        image.naturalHeight,
      ];
      texture.image = image;
    };

    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program,
    });

    this.plane.setParent(this.scene);
  }

  createBounds() {
    this.bounds = this.element.getBoundingClientRect();

    this.updateScale();
    this.updateX();
    this.updateY();

    this.plane.program.uniforms.uPlaneSizes.value = [
      this.plane.scale.x,
      this.plane.scale.y,
    ];
  }

  updateScale() {
    this.plane.scale.x =
      (this.viewport.width * this.bounds.width) / this.screen.width;
    this.plane.scale.y =
      (this.viewport.height * this.bounds.height) / this.screen.height;
  }

  updateX(x = 0) {
    this.plane.position.x =
      -(this.viewport.width / 2) +
      this.plane.scale.x / 2 +
      ((this.bounds.left - x) / this.screen.width) * this.viewport.width;
  }

  updateY(y = 0) {
    this.plane.position.y =
      this.viewport.height / 2 -
      this.plane.scale.y / 2 -
      ((this.bounds.top - y) / this.screen.height) * this.viewport.height -
      this.extra;
  }

  update(scroll: ScrollState, direction: "up" | "down") {
    this.updateScale();
    this.updateX();
    this.updateY(scroll.current);

    const planeOffset = this.plane.scale.y / 2;
    const viewportOffset = this.viewport.height / 2;

    this.isBefore = this.plane.position.y + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.y - planeOffset > viewportOffset;

    if (direction === "up" && this.isBefore) {
      this.extra -= this.height;
      this.isBefore = false;
      this.isAfter = false;
    }

    if (direction === "down" && this.isAfter) {
      this.extra += this.height;
      this.isBefore = false;
      this.isAfter = false;
    }

    this.plane.program.uniforms.uStrength.value =
      ((scroll.current - scroll.last) / this.screen.width) * 10;
  }

  onResize(sizes?: {
    height?: number;
    screen?: { width: number; height: number };
    viewport?: Viewport;
  }) {
    this.extra = 0;

    if (sizes) {
      if (sizes.height) this.height = sizes.height;
      if (sizes.screen) this.screen = sizes.screen;
      if (sizes.viewport) {
        this.viewport = sizes.viewport;
        this.plane.program.uniforms.uViewportSizes.value = [
          this.viewport.width,
          this.viewport.height,
        ];
      }
    }

    this.createBounds();
  }

  destroy() {
    this.plane.setParent(null);
  }
}

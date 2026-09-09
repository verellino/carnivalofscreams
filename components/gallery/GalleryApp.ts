import { Camera, Plane, Renderer, Transform } from "ogl";
import type { Geometry, OGLRenderingContext } from "ogl";

import { lerp, normalizeWheel } from "./math";
import Media from "./Media";
import type { ScrollState, Viewport } from "./types";

type GalleryAppOptions = {
  container: HTMLElement;
  gallery: HTMLElement;
  reducedMotion?: boolean;
  onReady?: () => void;
};

export default class GalleryApp {
  container: HTMLElement;
  gallery: HTMLElement;
  reducedMotion: boolean;
  onReady?: () => void;

  scroll: ScrollState = {
    ease: 0.05,
    current: 0,
    target: 0,
    last: 0,
    position: 0,
  };

  speed = 2;
  direction: "up" | "down" = "down";
  isDown = false;
  start = 0;
  running = true;
  ready = false;
  raf = 0;

  renderer!: Renderer;
  gl!: OGLRenderingContext;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Geometry;
  medias: Media[] = [];

  screen = { width: 0, height: 0 };
  viewport: Viewport = { width: 0, height: 0 };
  galleryHeight = 0;

  constructor({
    container,
    gallery,
    reducedMotion = false,
    onReady,
  }: GalleryAppOptions) {
    this.container = container;
    this.gallery = gallery;
    this.reducedMotion = reducedMotion;
    this.onReady = onReady;

    this.onResize = this.onResize.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onTouchDown = this.onTouchDown.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchUp = this.onTouchUp.bind(this);
    this.update = this.update.bind(this);

    this.createRenderer();
    this.createCamera();
    this.createScene();

    this.onResize();

    this.createGeometry();
    this.createMedias();

    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });

    if (!this.renderer.gl) {
      throw new Error("WebGL is not available");
    }

    this.gl = this.renderer.gl;
    this.gl.canvas.classList.add("past-gallery__canvas");
    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 5;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 10,
    });
  }

  createMedias() {
    const elements = this.gallery.querySelectorAll<HTMLElement>(
      ".past-gallery__figure",
    );

    this.medias = Array.from(elements).map(
      (element) =>
        new Media({
          element,
          geometry: this.planeGeometry,
          gl: this.gl,
          height: this.galleryHeight,
          scene: this.scene,
          screen: this.screen,
          viewport: this.viewport,
        }),
    );
  }

  onTouchDown(event: MouseEvent | TouchEvent) {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("header, a, button, input, textarea")
    ) {
      return;
    }

    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = "touches" in event ? event.touches[0].clientY : event.clientY;
  }

  onTouchMove(event: MouseEvent | TouchEvent) {
    if (!this.isDown) return;

    if ("touches" in event) event.preventDefault();

    const y = "touches" in event ? event.touches[0].clientY : event.clientY;
    const distance = (this.start - y) * 2;

    this.scroll.target = this.scroll.position + distance;
  }

  onTouchUp() {
    this.isDown = false;
  }

  onWheel(event: WheelEvent) {
    const { pixelY } = normalizeWheel(event);
    this.scroll.target += pixelY * 0.5;
  }

  onResize() {
    this.screen = {
      height: window.innerHeight,
      width: window.innerWidth,
    };

    this.renderer.setSize(this.screen.width, this.screen.height);

    this.camera.perspective({
      aspect: this.gl.canvas.width / this.gl.canvas.height,
    });

    const fov = this.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;

    this.viewport = { height, width };

    const galleryBounds = this.gallery.getBoundingClientRect();
    this.galleryHeight =
      (this.viewport.height * galleryBounds.height) / this.screen.height;

    for (const media of this.medias) {
      media.onResize({
        height: this.galleryHeight,
        screen: this.screen,
        viewport: this.viewport,
      });
    }
  }

  update() {
    if (!this.running) return;

    if (!this.reducedMotion) {
      this.scroll.target += this.speed;
    }

    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      this.scroll.ease,
    );

    if (this.scroll.current > this.scroll.last) {
      this.direction = "down";
      this.speed = 2;
    } else if (this.scroll.current < this.scroll.last) {
      this.direction = "up";
      this.speed = -2;
    }

    for (const media of this.medias) {
      media.update(this.scroll, this.direction);
    }

    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });

    this.scroll.last = this.scroll.current;

    if (!this.ready) {
      this.ready = true;
      this.onReady?.();
    }

    this.raf = window.requestAnimationFrame(this.update);
  }

  addEventListeners() {
    window.addEventListener("resize", this.onResize);

    window.addEventListener("wheel", this.onWheel, { passive: true });

    window.addEventListener("mousedown", this.onTouchDown);
    window.addEventListener("mousemove", this.onTouchMove);
    window.addEventListener("mouseup", this.onTouchUp);

    window.addEventListener("touchstart", this.onTouchDown, { passive: true });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });
    window.addEventListener("touchend", this.onTouchUp);
  }

  destroy() {
    this.running = false;
    window.cancelAnimationFrame(this.raf);

    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("mousedown", this.onTouchDown);
    window.removeEventListener("mousemove", this.onTouchMove);
    window.removeEventListener("mouseup", this.onTouchUp);
    window.removeEventListener("touchstart", this.onTouchDown);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchUp);

    for (const media of this.medias) media.destroy();

    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.gl.canvas.remove();
  }
}

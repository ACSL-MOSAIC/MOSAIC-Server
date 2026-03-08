import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { PPCMeta, PPCPoint } from "@/stores/@types/progressive-pointcloud.ts";

import { calculateColor, type ColorMode } from "./colorMapping.ts";

export interface ThreeSceneOptions {
  pointSize?: number;
  showAxes?: boolean;
  autoRotate?: boolean;
}

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private points: THREE.Points | null = null;
  private axes: THREE.AxesHelper | null = null;
  private container: HTMLElement;
  private animationFrameId: number | null = null;

  // Options
  private pointSize: number = 0.05;
  private showAxes: boolean = true;

  constructor(container: HTMLElement, options: ThreeSceneOptions = {}) {
    this.container = container;
    this.pointSize = options.pointSize ?? 0.05;
    this.showAxes = options.showAxes ?? true;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create camera
    // Position camera behind and above the robot, looking at the robot
    // ROS coordinate system: X=forward, Y=left, Z=up
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.up.set(0, 0, 1); // Set Z-axis as up (ROS convention)
    this.camera.position.set(-5, 0, 3); // Behind (-X), centered (Y), above (+Z)
    this.camera.lookAt(0, 0, 0); // Look at robot origin

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Style canvas to fill container
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";

    container.appendChild(this.renderer.domElement);

    // Create controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = options.autoRotate ?? false;
    this.controls.autoRotateSpeed = 1.0;
    this.controls.target.set(0, 0, 0); // Set orbit center to robot origin
    this.controls.update();

    // Add coordinate axes
    if (this.showAxes) {
      this.axes = new THREE.AxesHelper(5);
      this.scene.add(this.axes);
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Start animation loop
    this.animate();
  }

  /**
   * Update points with new data (replaces existing points)
   */
  updatePoints(points: PPCPoint[], meta: PPCMeta, colorMode: ColorMode): void {
    // Remove old points
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
      this.points = null;
    }

    // Create new points
    this.createPoints(points, meta, colorMode);
  }

  /**
   * Add points to existing data (progressive rendering)
   */
  addPoints(
    _newPoints: PPCPoint[],
    allPoints: PPCPoint[],
    meta: PPCMeta,
    colorMode: ColorMode,
  ): void {
    // For simplicity, recreate the entire point cloud
    // Optimized version would extend the BufferGeometry attributes
    this.updatePoints(allPoints, meta, colorMode);
  }

  /**
   * Create points from point cloud data
   */
  private createPoints(points: PPCPoint[], meta: PPCMeta, colorMode: ColorMode): void {
    const positions: number[] = [];
    const colors: number[] = [];

    for (const point of points) {
      const { x, y, z } = point;

      if (x === null || y === null || z === null) {
        continue;
      }

      // Add position
      positions.push(x, y, z);

      // Calculate and add color
      const [r, g, b] = calculateColor(point, meta, colorMode);
      colors.push(r / 255, g / 255, b / 255);
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    // Compute bounding sphere for proper camera frustum culling
    geometry.computeBoundingSphere();

    // Create material
    const material = new THREE.PointsMaterial({
      size: this.pointSize,
      vertexColors: true,
      sizeAttenuation: true,
    });

    // Create points object
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  /**
   * Clear all points from the scene
   */
  clear(): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
      this.points = null;
    }
  }

  /**
   * Resize renderer and camera
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Set point size
   */
  setPointSize(size: number): void {
    this.pointSize = size;
    if (this.points) {
      (this.points.material as THREE.PointsMaterial).size = size;
    }
  }

  /**
   * Toggle axes visibility
   */
  setShowAxes(show: boolean): void {
    this.showAxes = show;
    if (show && !this.axes) {
      this.axes = new THREE.AxesHelper(5);
      this.scene.add(this.axes);
    } else if (!show && this.axes) {
      this.scene.remove(this.axes);
      this.axes = null;
    }
  }

  /**
   * Set auto-rotate
   */
  setAutoRotate(autoRotate: boolean): void {
    this.controls.autoRotate = autoRotate;
  }

  /**
   * Reset camera to initial position
   */
  resetCamera(): void {
    this.camera.position.set(-5, 0, 3); // Behind and above the robot
    this.camera.lookAt(0, 0, 0); // Look at robot origin
    this.controls.target.set(0, 0, 0); // Set orbit target to robot origin
    this.controls.update();
  }

  /**
   * Get current camera position
   */
  getCameraPosition(): { x: number; y: number; z: number } {
    return {
      x: Math.round(this.camera.position.x * 100) / 100,
      y: Math.round(this.camera.position.y * 100) / 100,
      z: Math.round(this.camera.position.z * 100) / 100,
    };
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Update controls
    this.controls.update();

    // Render scene
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Stop animation
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Dispose points
    this.clear();

    // Dispose axes
    if (this.axes) {
      this.scene.remove(this.axes);
      this.axes = null;
    }

    // Dispose controls
    this.controls.dispose();

    // Dispose renderer
    this.renderer.dispose();

    // Remove canvas from container
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

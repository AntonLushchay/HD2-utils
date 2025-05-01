import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import '../styles/components/EnemyModel.css';

type Characteristic = {
  health: number;
  weakPoint: string;
  bestTarget: string;
};

type Characteristics = {
  [key: string]: Characteristic;
};

interface EnemyModelProps {
  modelPath: string;
  characteristics: Characteristics;
  modelAvailable?: boolean;
}

const PART_DISPLAY_NAMES: { [key: string]: string } = {
  head: 'Голова',
  body: 'Туловище',
  legs: 'Конечности',
  mandibles: 'Жвалы',
  thorax: 'Грудной панцирь',
  abdomen: 'Брюшная часть',
};

const getPartDisplayName = (partName: string): string => PART_DISPLAY_NAMES[partName] || partName;

const EnemyModel: React.FC<EnemyModelProps> = ({ modelPath, characteristics, modelAvailable = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const clearScene = () => {
    if (sceneRef.current) {
      while (sceneRef.current.children.length > 0) {
        const object = sceneRef.current.children[0];
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
        sceneRef.current.remove(object);
      }
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    clearScene();

    setError(null);
    setLoading(true);

    if (!modelAvailable || !modelPath) {
      setLoading(false);
      setError('3D модель отсутствует');
      return;
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x333333);

    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2.5);
    hemisphereLight.position.set(0, 20, 0);
    scene.add(hemisphereLight);

    const mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainDirectionalLight.position.set(1, 2, 4);
    scene.add(mainDirectionalLight);

    const backDirectionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    backDirectionalLight.position.set(-1, 1, -4);
    scene.add(backDirectionalLight);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 10);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;

    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    controls.rotateSpeed = 1.0;

    controls.target.set(0, 0, 0);
    controls.update();

    let initialTouchPosition = { x: 0, y: 0 };
    let initialPinchDistance = 0;
    let isTouching = false;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isTouching = true;
        initialTouchPosition = { 
          x: event.touches[0].clientX, 
          y: event.touches[0].clientY 
        };
      } else if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isTouching || !controlsRef.current) return;

      event.preventDefault();

      if (event.touches.length === 1) {
        controlsRef.current.enabled = true;
      } else if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const delta = distance - initialPinchDistance;

        if (delta > 0) {
          controlsRef.current.object.position.z -= delta * 0.01;
        } else {
          controlsRef.current.object.position.z -= delta * 0.01;
        }

        initialPinchDistance = distance;

        controlsRef.current.update();
      }
    };

    const handleTouchEnd = () => {
      isTouching = false;
    };

    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', handleTouchEnd);

    const loader = new GLTFLoader();

    try {
      loader.load(
        modelPath,
        (gltf: GLTF) => {
          scene.children.forEach(child => {
            if (child.name === 'modelGroup' || child.name === 'boxHelper') {
              scene.remove(child);
            }
          });

          const loadedModel = gltf.scene;
          loadedModel.rotation.y = Math.PI;

          const group = new THREE.Group();
          group.name = 'modelGroup';
          group.add(loadedModel);

          let meshCount = 0;
          loadedModel.traverse((object: THREE.Object3D) => {
            if (object instanceof THREE.Mesh) {
              meshCount++;

              const simpleMaterial = new THREE.MeshLambertMaterial({
                color: 0xcccccc,
                emissive: new THREE.Color(0x333333),
                side: THREE.DoubleSide,
                flatShading: false,
              });

              if (Array.isArray(object.material)) {
                object.material = object.material.map(() => simpleMaterial.clone());
              } else {
                object.material = simpleMaterial.clone();
              }

              object.visible = true;
            }
          });

          const modelBox = new THREE.Box3().setFromObject(loadedModel);
          const modelCenter = modelBox.getCenter(new THREE.Vector3());
          const modelSize = modelBox.getSize(new THREE.Vector3());

          loadedModel.position.set(-modelCenter.x, -modelCenter.y, -modelCenter.z);

          const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
          let scaleFactor = 1;
          if (maxDim > 0) {
            const targetSize = 5;
            scaleFactor = targetSize / maxDim;
          }

          group.scale.set(scaleFactor, scaleFactor, scaleFactor);

          group.updateMatrixWorld(true);
          const groupBox = new THREE.Box3().setFromObject(group);
          const groupMinY = groupBox.min.y;

          group.position.set(0, -groupMinY, 0);

          scene.add(group);
          group.updateMatrixWorld(true);

          const finalGroupBox = new THREE.Box3().setFromObject(group);
          const finalGroupCenter = finalGroupBox.getCenter(new THREE.Vector3());
          const finalGroupSize = finalGroupBox.getSize(new THREE.Vector3());

          const idealDistance = Math.max(5, finalGroupSize.length() * 1.5);
          camera.position.set(0, finalGroupCenter.y, idealDistance);
          controls.target.copy(finalGroupCenter);
          controls.update();

          const oldBoxHelper = scene.getObjectByName('boxHelper');
          if (oldBoxHelper) {
            scene.remove(oldBoxHelper);
          }
          const boxHelper = new THREE.BoxHelper(group, 0x00ff00);
          boxHelper.name = 'boxHelper';
          scene.add(boxHelper);

          setLoading(false);
        },
        (xhr: ProgressEvent) => {
          // Тихая обработка прогресса загрузки без вывода в консоль
        },
        (err: unknown) => {
          const errorMessage = err instanceof Error ? err.message : 'неизвестная ошибка';
          setError(`Ошибка загрузки модели: ${errorMessage}. URL модели: ${modelPath}`);
          setLoading(false);
        }
      );
    } catch (error: any) {
      setError(`Исключение при загрузке модели: ${error.message}`);
      setLoading(false);
    }

    const resetCamera = () => {
      const boxTemp = new THREE.Box3();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          boxTemp.expandByObject(object);
        }
      });

      const centerTemp = boxTemp.getCenter(new THREE.Vector3());
      const sizeTemp = boxTemp.getSize(new THREE.Vector3());

      const distanceTemp = Math.max(5, sizeTemp.length() * 1.5);
      camera.position.set(0, sizeTemp.y * 0.5, distanceTemp);

      controls.target.copy(centerTemp);
      controls.update();
    };

    const resetButton = document.createElement('button');
    resetButton.textContent = 'Сбросить вид';
    resetButton.className = 'reset-button';
    resetButton.addEventListener('click', resetCamera);
    mount.appendChild(resetButton);

    const handleResize = () => {
      if (!mountRef.current) return;

      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);

      if (renderer.domElement) {
        renderer.domElement.removeEventListener('touchstart', handleTouchStart);
        renderer.domElement.removeEventListener('touchmove', handleTouchMove);
        renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      }

      if (mount.contains(resetButton)) {
        mount.removeChild(resetButton);
      }

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }

      clearScene();

      if (renderer) renderer.dispose();
    };
  }, [modelPath, characteristics, modelAvailable, selectedPart]);

  return (
    <div>
      <div ref={mountRef} className="model-container" />
      {loading && (
        <div className="loading">
          Загрузка модели...
        </div>
      )}
      {error && (
        <div className="error">
          {error}
          {!modelAvailable && (
            <div>
              <p>Модель не найдена. Пожалуйста, добавьте файл модели.</p>
            </div>
          )}
        </div>
      )}
      {selectedPart && selectedPart in characteristics && (
        <div className="characteristics-selected">
          <div className="characteristics-header">
            <h3 className="characteristics-title">{getPartDisplayName(selectedPart)}</h3>
            <button
              onClick={() => setSelectedPart(null)}
              className="close-button"
            >
              ✕
            </button>
          </div>
          <hr className="characteristics-divider" />
          <div className="characteristics-content">
            <p className="characteristics-field">
              <strong>Здоровье:</strong> {characteristics[selectedPart]?.health || 'Нет данных'}
            </p>
            <p className="characteristics-field">
              <strong>Слабое место:</strong> {characteristics[selectedPart]?.weakPoint || 'Нет данных'}
            </p>
            <p className="characteristics-field">
              <strong>Лучшая цель:</strong> {characteristics[selectedPart]?.bestTarget || 'Нет данных'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnemyModel;

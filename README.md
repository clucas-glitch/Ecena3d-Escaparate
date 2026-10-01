# Escaparate 3D — Three.js + Vite

Proyecto base construido desde cero a partir de la referencia visual del escaparate.

## 1. Estructura

```text
escaparate-threejs/
├── index.html
├── package.json
├── README.md
├── public/
└── src/
    ├── main.js
    └── style.css
```

La carpeta `public/` queda lista para agregar después un modelo `.glb`, por ejemplo:

```text
public/
└── models/
    └── Michelle.glb
```

## 2. Instalar y ejecutar

En Visual Studio Code:

```bash
npm install
npm run dev
```

Después abre la dirección local que muestre Vite, normalmente:

```text
http://localhost:5173/
```

## 3. Controles

- Mouse sobre la pelota: hover.
- Mouse fuera de la pelota: vuelve a reposo.
- Click sobre la pelota: cambia entre estado activo/inactivo.
- Flechas: mover la pelota.
- ESPACIO: pausar/reanudar su movimiento.
- R: regresar la pelota a una posición inicial.

## 4. Requisitos implementados

- Three.js.
- Mesh + geometría + material.
- Variables y `const`.
- Arrays.
- Condicionales.
- Ciclos `for...of`.
- Funciones reutilizables.
- Posición, rotación y escala.
- `requestAnimationFrame`.
- Movimiento oscilatorio con `Math.sin`.
- Eventos `pointermove`, `click`, `keydown` y `resize`.
- Raycaster para detectar la pelota 3D.
- Estado de hover y reposo.
- Respuesta visual al hover y click.
- `MeshBasicMaterial`.
- `MeshMatcapMaterial`.
- `MeshPhongMaterial`.
- `MeshToonMaterial`.
- `MeshStandardMaterial`.
- Sombras.
- Límite de `devicePixelRatio` para ayudar al rendimiento.
- Escena construida sin modelos externos.

## 5. Siguiente etapa: importar la bailarina

Cuando tengas `Michelle.glb`, colócala aquí:

```text
public/models/Michelle.glb
```

Después se puede importar con:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load('/models/Michelle.glb', (gltf) => {
  const model = gltf.scene;

  scene.add(model);

  const mixer = new THREE.AnimationMixer(model);

  if (gltf.animations.length > 0) {
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
  }
});
```

Y dentro de `animate()` se actualizaría el `mixer` con el tiempo.

> Nota: para que la bailarina baile, el archivo `.glb` debe contener una animación.

## 6. Sobre el rendimiento

El proyecto usa `requestAnimationFrame`, que sincroniza el render con el navegador. Además se limita el pixel ratio a 2 para evitar que pantallas con densidad muy alta generen una carga innecesaria.

60 FPS no se puede garantizar en cualquier computadora, pero la escena inicial está mantenida relativamente ligera para apuntar a ese objetivo.

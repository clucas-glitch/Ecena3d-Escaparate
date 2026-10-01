import * as THREE from 'three'; // Traigo toda la librería Three.js para poder crear la escena 3D
import './style.css'; // Traigo los estilos de la página (el CSS)

// ★ PASO 2 (CÁMARA CON MOUSE): esta línea trae el control de cámara.
// Si tu versión de three no encuentra esta ruta, prueba: 'three/addons/controls/OrbitControls.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ============================================================
// 1. VARIABLES PRINCIPALES
// ============================================================

const scene = new THREE.Scene(); // Creo la escena: es la "caja" donde van todos los objetos y luces
scene.background = new THREE.Color(0x111111); // Color de fondo de la escena (gris casi negro)

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - 0x111111 -> 0x87ceeb (azul cielo) o 0xffffff (blanco). El fondo cambia de golpe.
*/

const camera = new THREE.PerspectiveCamera( // Creo la cámara con perspectiva (como un ojo humano)
  45, // Campo de visión (FOV): qué tan "abierta" es la lente
  window.innerWidth / window.innerHeight, // Proporción de la pantalla (ancho/alto) para que no se deforme
  0.1, // Lo más cerca que la cámara puede ver
  100 // Lo más lejos que la cámara puede ver
);

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - FOV: 45 -> 20 (zoom, todo se ve cerca y plano) o 90 (ojo de pez, muy deformado).
 - Posición de cámara (abajo): (8.5, 5.5, 10.5) -> (0, 3, 12) para verlo de frente,
   o (0, 15, 0.1) para verlo desde arriba.
*/

camera.position.set(8.5, 5.5, 10.5); // Dónde está la cámara: x (derecha), y (arriba), z (hacia mí)
camera.lookAt(0, 2.2, 0); // Hacia qué punto mira la cámara (más o menos donde está la pelota)

const renderer = new THREE.WebGLRenderer({ // El renderer es el que "dibuja" todo en pantalla
  antialias: true // Suaviza los bordes para que no se vean con dientes de sierra
});

renderer.setSize(window.innerWidth, window.innerHeight); // El dibujo ocupa toda la ventana
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Usa la resolución de mi pantalla pero nunca más de 2 (para no ir lento)
renderer.shadowMap.enabled = true; // Enciende las sombras (luz -> objeto -> sombra en el piso)
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipo de sombra: suave. Con THREE.PCFShadowMap se ven más duras
renderer.outputColorSpace = THREE.SRGBColorSpace; // Hace que los colores se vean como en una pantalla normal
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Hace la luz más realista, ni muy saturada ni muy plana
renderer.toneMappingExposure = 1.1; // Exposición (cuánta luz entra)

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - toneMappingExposure: 1.1 -> 0.5 (escena oscura y dramática) o 2.0 (muy iluminada, casi quemada).
 - shadowMap.type: THREE.PCFSoftShadowMap -> THREE.BasicShadowMap (sombras pixeladas y duras).
*/

document.body.appendChild(renderer.domElement); // Meto el canvas (el lienzo donde se dibuja) en la página

const clock = new THREE.Clock(); // Reloj para medir el tiempo y que la animación vaya igual en cualquier computadora

// ============================================================
// 2. ESTADO MODIFICABLE (valores que cambian mientras corre)
// ============================================================

const state = {
  ballHovered: false, // ¿El mouse está encima de la pelota? Empieza en NO
  ballActive: false, // ¿La pelota fue clickeada (activa)? Empieza en NO
  ballMoving: true, // ¿La pelota está oscilando (subiendo y bajando)? Empieza en SÍ

  ballBaseY: 4, // Altura "central" de la pelota (sobre el piso)
  ballAmplitude: 0.12, // Cuánto sube y baja desde la base. ★ CORREGIDO: antes se llamaba "allAmplitude" y el código buscaba "ballAmplitude" -> daba NaN y la pelota DESAPARECÍA
  ballSpeed: 6, // Qué tan rápido sube y baja
  selectedObject: null // Aquí podría guardarse el objeto seleccionado (por ahora no se usa)
};

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - ballAmplitude: 0.12 -> 0.8 (la pelota sube y baja MUCHO, se nota enseguida).
 - ballSpeed: 2.2 -> 6 (vibra rápido) o 0.5 (flota lento).
 - ballBaseY: 2.15 -> 4 (la pelota flota alta) o 1.7 (casi sobre la mesa).
 - ballMoving: true -> false (empieza quieta; con ESPACIO se activa).
*/

// ============================================================
// 3. MATERIALES (el "aspecto" de cada superficie)
// ============================================================

// Material básico: NO reacciona a la luz, siempre se ve del mismo color (lo uso en el panel de atrás)
const basicMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#dd718a') // Color vino oscuro
});

// Material matcap: se ve como una escultura/ilustración (lo uso en las columnas)
const matcapMaterial = new THREE.MeshMatcapMaterial({
  color: new THREE.Color('#eb0b69') // Color dorado
});

// Material phong: reacciona a la luz y tiene brillo (lo uso en el cubo pequeño)
const phongMaterial = new THREE.MeshPhongMaterial({
  color: new THREE.Color('#d4240c'), // Color café
  shininess: 80 // Qué tan brillante es el reflejo (más alto = más brillante)
});

// Material toon: aspecto de caricatura (lo uso en el cono)
const toonMaterial = new THREE.MeshToonMaterial({
  color: new THREE.Color('#d7e144') // Color café claro
});

// Material estándar: el más realista (PBR). Lo dejo definido aunque no lo uso directo
const standardMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#c18b48'),
  roughness: 0.65, // 0 = espejo, 1 = totalmente mate
  metalness: 0.05 // 0 = no metal, 1 = metal puro
});

// Materiales específicos para cada parte del escaparate
const floorMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#8f6339'), // Piso café
  roughness: 0.8
});

const backWallMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#b87936'), // Pared de atrás naranja/café
  roughness: 0.75
});

const sideWallMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#762018'), // Pared lateral izquierda roja oscura
  roughness: 0.8
});

const ceilingMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#5d341e'), // Techo café oscuro
  roughness: 0.9
});

const tableMaterial = new THREE.MeshPhongMaterial({
  color: new THREE.Color('#542514'), // Mesa café muy oscuro
  shininess: 45
});

const ballMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#d49a3a'), // Pelota dorada
  metalness: 0.25, // Un poquito metálica
  roughness: 0.35 // Bastante brillante
});

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - ballMaterial color: '#d49a3a' -> '#ff0000' (pelota roja, cambio MUY notable sobre fondo café).
 - ballMaterial metalness: 0.25 -> 1 y roughness 0.35 -> 0.1 (pelota tipo espejo metálico).
 - floorMaterial color: '#8f6339' -> '#2b4c7e' (piso azul).
 - sideWallMaterial color: '#762018' -> '#1d6b3a' (pared verde).
 - phongMaterial shininess: 80 -> 300 (brillo muy fuerte) o 5 (casi mate).
*/

// ============================================================
// 4. FUNCIÓN PARA CREAR MESHES (un mesh = forma + material)
// ============================================================

function createMesh(geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material); // Junto la forma con su material para crear el objeto

  mesh.position.set(position[0], position[1], position[2]); // Lo coloco en x, y, z
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]); // Lo roto (en radianes)
  mesh.scale.set(scale[0], scale[1], scale[2]); // Lo escalo (1 = tamaño original)

  mesh.castShadow = true; // Este objeto proyecta sombra
  mesh.receiveShadow = true; // Este objeto recibe sombra de otros

  scene.add(mesh); // Lo agrego a la escena para que se vea

  return mesh; // Devuelvo el objeto por si lo quiero usar después
}

// ============================================================
// 5. ESCAPARATE: PISO, PAREDES Y TECHO
// ============================================================

const showcase = {
  width: 12, // Ancho total del escaparate
  height: 6, // Alto total
  depth: 6 // Profundidad total
};

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - width: 12 -> 20 (escaparate muy largo). OJO: los límites de la pelota (más abajo, ±4.5) quedarían cortos.
 - height: 6 -> 10 (techo mucho más alto; la luz del techo estaría en y=5.5, así que bájale o súbele).
*/

// Piso: una caja muy delgada y ancha
const floor = createMesh(
  new THREE.BoxGeometry(showcase.width, 0.25, showcase.depth), // Forma: ancho x grosor x profundidad
  floorMaterial,
  [0, -0.125, 0] // Posición: un poquito hundido para que su cara de arriba quede en y=0
);

// Pared trasera
const backWall = createMesh(
  new THREE.BoxGeometry(showcase.width, showcase.height, 0.25),
  backWallMaterial,
  [0, showcase.height / 2, -showcase.depth / 2] // Al fondo (z negativo), a media altura
);

// Pared lateral izquierda
const leftWall = createMesh(
  new THREE.BoxGeometry(0.25, showcase.height, showcase.depth),
  sideWallMaterial,
  [-showcase.width / 2, showcase.height / 2, 0] // En el borde izquierdo (x negativo)
);

// Pared lateral derecha (le creo su material aquí mismo)
const rightWall = createMesh(
  new THREE.BoxGeometry(0.25, showcase.height, showcase.depth),
  new THREE.MeshStandardMaterial({
    color: 0xa36b2e, // Color naranja café
    roughness: 0.8
  }),
  [showcase.width / 2, showcase.height / 2, 0] // En el borde derecho (x positivo)
);

// Techo
const ceiling = createMesh(
  new THREE.BoxGeometry(showcase.width, 0.25, showcase.depth),
  ceilingMaterial,
  [0, showcase.height, 0] // Arriba de todo
);

// ============================================================
// 6. COLUMNAS
// ============================================================

const columnGeometry = new THREE.CylinderGeometry(0.34, 0.34, 4.5, 24); // Cilindro: radio arriba, radio abajo, altura, lados

// Lista de posiciones: así creo 4 columnas sin repetir código
const columnPositions = [
  [-3.8, 2.25, -1.2],
  [-1.9, 2.25, -1.2],
  [3.0, 2.25, -1.2],
  [4.8, 2.25, -1.2]
];

for (const position of columnPositions) { // Repito para cada posición de la lista
  createMesh(columnGeometry, matcapMaterial, position, [0, 0, 0], [1, 1, 1]);
}

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - CylinderGeometry(0.34, 0.34, 4.5, 24) -> (0.1, 0.8, 4.5, 24): columnas en forma de cono.
 - Cambia 0.34 -> 0.8 para columnas MUY gruesas.
 - Agrega otra posición a la lista, por ejemplo [0, 2.25, -2], y aparece una columna nueva.
*/

// (Los escalones de la izquierda los dejo fuera: estaban comentados en tu código y no se usaban)

// ============================================================
// 8. MESA / PEDESTAL
// ============================================================

const tableTop = createMesh(
  new THREE.BoxGeometry(3.0, 0.22, 1.25), // Tapa de la mesa: ancho x grosor x profundidad
  tableMaterial,
  [0, 1.05, 0.3], // Posición de la tapa
  [0, 0, 0],
  [1, 1, 1]
);

const legGeometry = new THREE.BoxGeometry(0.12, 1.05, 0.12); // Pata delgada y alta

const legPositions = [ // Las 4 esquinas de la mesa
  [-1.25, 0.525, -0.12],
  [1.25, 0.525, -0.12],
  [-1.25, 0.525, 0.72],
  [1.25, 0.525, 0.72]
];

for (const position of legPositions) { // Creo una pata en cada esquina
  createMesh(legGeometry, tableMaterial, position);
}

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - BoxGeometry(3.0, 0.22, 1.25) -> (6.0, 0.22, 2.5): una mesa gigante (mueve las patas también).
 - Posición de la tapa [0, 1.05, 0.3] -> [0, 3, 0.3]: la mesa flota (las patas quedan cortas).
*/

// ============================================================
// 9. PELOTA 3D
// ============================================================

const ballGeometry = new THREE.SphereGeometry(0.55, 32, 32); // Esfera: radio 0.55, 32 segmentos de ancho y alto (más = más lisa)

const ball = new THREE.Mesh(ballGeometry, ballMaterial); // Creo la pelota juntando la esfera con su material dorado

ball.position.set(0, state.ballBaseY, 0.3); // La pongo en el centro, a la altura base, un poco hacia adelante
ball.rotation.set(0, 0, 0); // Sin rotación inicial
ball.scale.set(1, 1, 1); // Tamaño normal

ball.castShadow = true; // La pelota proyecta sombra
ball.receiveShadow = true; // La pelota recibe sombra

ball.userData.isInteractive = true; // Etiqueta mía: "esto se puede tocar"
ball.userData.name = 'pelota'; // Etiqueta mía: nombre del objeto

scene.add(ball); // La agrego a la escena (sin esto no se vería)

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - SphereGeometry(0.55, ...) -> (1.2, ...): pelota enorme.
 - SphereGeometry(0.55, 32, 32) -> (0.55, 6, 6): pelota "de baja resolución" con caras visibles.
 - Cambia THREE.SphereGeometry por THREE.BoxGeometry(1, 1, 1) y ya no es pelota, es cubo.
*/

// ============================================================
// 10. OTROS OBJETOS DECORATIVOS
// ============================================================

// Panel de fondo con material básico (no le afecta la luz)
const backPanel = createMesh(
  new THREE.PlaneGeometry(2.2, 2.8), // Rectángulo plano de 2.2 x 2.8
  basicMaterial,
  [4.8, 2.3, -2.83], // Pegado a la pared de atrás, a la derecha
  [0, 0, 0]
);

// Cubo pequeño con material phong (brillante)
const smallPedestal = createMesh(
  new THREE.BoxGeometry(0.9, 0.9, 0.9),
  phongMaterial,
  [-4.3, 0.45, -1.0]
);

// Cono hexagonal con material toon (caricatura). Tiene 6 lados por eso se ve facetado
const decorativeCone = createMesh(
  new THREE.ConeGeometry(0.45, 1.5, 6), // Radio, altura, número de lados
  toonMaterial,
  [4.7, 0.75, 0.7]
);

// ============================================================
// 11. LUCES
// ============================================================

// Luz ambiental: ilumina todo por igual, evita zonas totalmente negras
const ambientLight = new THREE.AmbientLight(0xffd9a0, 1.5); // Color cálido, intensidad 1.5
scene.add(ambientLight);

// Luz del techo: como un foco colgando arriba
const ceilingLight = new THREE.PointLight(0xffc45a, 80, 20); // Color, intensidad, alcance
ceilingLight.position.set(0, 5.5, 0.5); // Justo debajo del techo
ceilingLight.castShadow = true; // Esta luz genera sombras
ceilingLight.shadow.mapSize.set(512, 512); // Calidad de la sombra (más alto = más nítida pero más pesado)
scene.add(ceilingLight);

// Luz frontal: viene desde el frente del escaparate
const frontLight = new THREE.PointLight(0xffe0b0, 35, 15);
frontLight.position.set(0, 3.5, 5);
frontLight.castShadow = true;
frontLight.shadow.mapSize.set(512, 512);
scene.add(frontLight);

// Luz lateral: color naranja desde la izquierda
const sideLight = new THREE.PointLight(0xff9b55, 25, 12);
sideLight.position.set(-5, 3, 2);
scene.add(sideLight);

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - ambientLight intensidad 1.5 -> 0.1 (casi todo en penumbra, las luces de punto destacan).
 - ceilingLight color 0xffc45a -> 0x00aaff (luz azul, cambia todo el ambiente).
 - ceilingLight intensidad 80 -> 300 (muy brillante) o 0 (apagada).
 - sideLight posición (-5, 3, 2) -> (5, 3, 2): la luz naranja pasa al otro lado.
 - shadow.mapSize 512 -> 2048 (sombras más definidas).
*/

// ============================================================
// 12. RAYCASTER: DETECTAR HOVER Y CLICK EN LA PELOTA
// ============================================================

const raycaster = new THREE.Raycaster(); // Lanza un "rayo invisible" desde la cámara hacia donde apunta el mouse
const pointer = new THREE.Vector2(); // Guarda la posición del mouse convertida a coordenadas de Three.js (-1 a 1)

function updatePointer(event) { // Actualiza dónde está el mouse
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1; // Convierte píxeles a rango -1 (izq) a 1 (der)
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1; // Igual pero vertical (invertido porque en pantalla Y crece hacia abajo)
}

function getBallIntersection() { // Responde: ¿el mouse está sobre la pelota?
  raycaster.setFromCamera(pointer, camera); // Lanzo el rayo desde la cámara hacia el mouse
  const intersections = raycaster.intersectObject(ball); // Veo si el rayo toca la pelota
  return intersections.length > 0; // true si la toca, false si no
}

// Qué pasa cuando el mouse ENTRA a la pelota
function setBallHover() {
  state.ballHovered = true; // Guardo que está encima
  document.body.style.cursor = 'pointer'; // El cursor se vuelve manita

  ball.scale.set(1.18, 1.18, 1.18); // La pelota crece un 18%
  ball.material.emissive.set(0x3d2500); // La pelota "brilla" con un tono naranja oscuro
  ball.material.emissiveIntensity = 0.5; // Fuerza de ese brillo

  updateStatus('hover: pelota seleccionable'); // Muestro mensaje en pantalla
}

// Qué pasa cuando el mouse SALE de la pelota
function setBallRest() {
  state.ballHovered = false; // Ya no está encima
  document.body.style.cursor = 'default'; // Cursor normal

  ball.scale.set(1, 1, 1); // Tamaño normal
  ball.material.emissive.set(0x000000); // Sin brillo
  ball.material.emissiveIntensity = 0;

  updateStatus('reposo');
}

// Qué pasa al hacer CLICK en la pelota
function onBallClick() {
  state.ballActive = !state.ballActive; // Cambia de activa a no activa y viceversa

  if (state.ballActive) {
    ballMaterial.color.set(0xf2c14e); // Pelota amarilla brillante
    updateStatus('click: pelota activa');
  } else {
    ballMaterial.color.set(0xd49a3a); // Vuelve al dorado original
    updateStatus('click: pelota en reposo');
  }
}

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - ball.scale.set(1.18, ...) -> (1.8, 1.8, 1.8): al pasar el mouse la pelota crece MUCHO.
 - emissive 0x3d2500 -> 0xff0000 y emissiveIntensity 0.5 -> 1: la pelota brilla roja al pasar el mouse.
 - Color al click 0xf2c14e -> 0x00ff88 (verde): el cambio al click es obvio.
 - cursor 'pointer' -> 'crosshair' o 'grab' para otro tipo de cursor.
*/

// ============================================================
// 13. EVENTOS DEL MOUSE
// ============================================================

window.addEventListener('pointermove', (event) => { // Cada vez que el mouse se mueve...
  updatePointer(event); // ...actualizo su posición

  const isOverBall = getBallIntersection(); // ...y reviso si está sobre la pelota

  if (isOverBall && !state.ballHovered) { // Si entró y antes no estaba
    setBallHover();
  }

  if (!isOverBall && state.ballHovered) { // Si salió y antes estaba
    setBallRest();
  }
});

window.addEventListener('click', () => { // Cada vez que hago click...
  if (getBallIntersection()) { // ...si fue sobre la pelota
    onBallClick();
  }
});

// ============================================================
// 14. EVENTOS DEL TECLADO
// ============================================================

window.addEventListener('keydown', (event) => { // Cada vez que presiono una tecla...
  const movement = 0.25; // Cuánto se mueve la pelota por cada pulsación

  if (event.key === 'ArrowLeft') { // Flecha izquierda
    ball.position.x -= movement;
  }

  if (event.key === 'ArrowRight') { // Flecha derecha
    ball.position.x += movement;
  }

  if (event.key === 'ArrowUp') { // Flecha arriba: la pelota se va hacia el fondo
    ball.position.z -= movement;
  }

  if (event.key === 'ArrowDown') { // Flecha abajo: la pelota viene hacia mí
    ball.position.z += movement;
  }

  if (event.code === 'Space') { // Barra espaciadora
    event.preventDefault(); // Evito que la página haga scroll
    state.ballMoving = !state.ballMoving; // Pausa o reanuda el sube y baja
    updateStatus(state.ballMoving ? 'movimiento: activo' : 'movimiento: pausado');
  }

  if (event.key.toLowerCase() === 'r') { // Tecla R (mayúscula o minúscula)
    ball.position.x = 0; // Regreso al centro en X
    ball.position.z = 0.3; // Regreso a su Z inicial
    state.ballBaseY = 2.15; // Regreso a su altura inicial
    updateStatus('reposo: pelota reiniciada');
  }
});

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - movement: 0.25 -> 1: la pelota salta de a un metro por tecla (se nota muchísimo).
 - Agrega otra tecla, por ejemplo: if (event.key === 'w') { state.ballBaseY += 0.3; } para subirla.
*/

// ============================================================
// 15. FUNCIÓN DE ESTADO / RESPUESTA VISUAL
// ============================================================

function updateStatus(message) { // Escribe un mensaje de estado en la página
  const status = document.querySelector('#status'); // Busca un elemento con id="status" en tu HTML

  if (status) { // Solo si existe (si no existe, no pasa nada y no da error)
    status.textContent = `Estado: ${message}`;
  }
}

// ============================================================
// ★ PASO 2: CÁMARA CONTROLADA CON EL MOUSE
// (Ya con la pelota funcionando. Si no la quieres, borra este bloque
//  y también la línea "controls.update()" dentro de animate)
// ============================================================

const controls = new OrbitControls(camera, renderer.domElement); // Conecto la cámara con el mouse sobre el canvas
controls.target.set(0, 2.2, 0); // El punto alrededor del cual gira la cámara (la zona de la pelota)
controls.enableDamping = true; // Movimiento suave, con inercia
controls.dampingFactor = 0.08; // Qué tanta inercia (más bajo = se desliza más tiempo)
controls.minDistance = 4; // Lo más cerca que puedo hacer zoom
controls.maxDistance = 18; // Lo más lejos que puedo hacer zoom
controls.maxPolarAngle = Math.PI / 2 - 0.05; // No dejo que la cámara se meta debajo del piso
controls.update(); // Aplico la configuración inicial

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - Click izquierdo + arrastrar = girar | rueda = zoom | click derecho + arrastrar = mover.
 - minDistance 4 -> 0.5 y maxDistance 18 -> 60: zoom casi sin límites.
 - dampingFactor 0.08 -> 0.01: la cámara se desliza mucho tiempo, efecto "flotante".
 - controls.autoRotate = true; y controls.autoRotateSpeed = 4; (añádelas): la cámara gira sola.
 - controls.enablePan = false; para bloquear el movimiento con click derecho.
*/

// ============================================================
// 16. LOOP DE ANIMACIÓN (se repite ~60 veces por segundo)
// ============================================================

function animate() {
  requestAnimationFrame(animate); // Pido que esta función se vuelva a llamar en el siguiente cuadro

  const elapsed = clock.getElapsedTime(); // Segundos que han pasado desde que inició la página

  if (state.ballMoving) { // Solo si el movimiento está activo
    // Seno da un vaivén entre -1 y 1; lo multiplico por la amplitud para saber cuánto sube/baja
    const oscillation = Math.sin(elapsed * state.ballSpeed) * state.ballAmplitude;

    ball.position.y = state.ballBaseY + oscillation; // Altura final = base + vaivén

    ball.rotation.y += 0.02; // La pelota gira un poquito en cada cuadro
  }

  // Límites para que la pelota no se salga del escaparate
  ball.position.x = THREE.MathUtils.clamp(ball.position.x, -4.5, 4.5); // Izquierda-derecha
  ball.position.z = THREE.MathUtils.clamp(ball.position.z, -2.5, 2.5); // Fondo-frente (nuevo: antes podía salirse por delante/atrás)

  controls.update(); // Actualiza la cámara según el mouse (necesario por el damping)

  renderer.render(scene, camera); // Dibujo la escena vista desde la cámara
}

animate(); // Arranco la animación

/*
 ★★★ QUÉ PUEDES MODIFICAR AQUÍ ★★★
 - ball.rotation.y += 0.02 -> 0.3: la pelota gira como trompo.
 - Agrega: ball.rotation.x += 0.05; para que gire también en otro eje.
 - Límites -4.5 / 4.5 -> -1 / 1: la pelota queda atrapada en un espacio pequeño.
*/

// ============================================================
// 17. RESPONSIVE (adaptarse al tamaño de la ventana)
// ============================================================

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight; // Recalculo la proporción de la pantalla
  camera.updateProjectionMatrix(); // Aplico ese cambio a la cámara

  renderer.setSize(window.innerWidth, window.innerHeight); // Ajusto el canvas al nuevo tamaño
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onWindowResize); // Cuando cambie el tamaño de la ventana, ejecuta lo de arriba

// Mensajes en la consola del navegador (F12) para verificar que todo cargó
console.log('Escaparate iniciado');
console.log('Objetos interactivos:', ball.userData.name);
console.log('Materiales usados:', [
  'MeshBasicMaterial',
  'MeshMatcapMaterial',
  'MeshPhongMaterial',
  'MeshToonMaterial',
  'MeshStandardMaterial'
]);
import * as THREE from "three";
import { FBXLoader } from "jsm/loaders/FBXLoader.js";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getLayer from "./libs/getLayer.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const manager = new THREE.LoadingManager();
const loader = new FBXLoader(manager);
const textureLoader = new THREE.TextureLoader();
const path = "./assets/Y Bot.fbx";
let character;
const sceneData = {
  character: null,
  animations: [],
};
loader.load(path, (fbx) => {

  function getMaterial() {
    const material = new THREE.MeshMatcapMaterial({
      
      matcap: textureLoader.load("./assets/fire-edge-blue.jpg"),
    });
    return material;
  }

  function initCharacter(fbx) {
    const char = fbx;
    char.scale.setScalar(0.02);
    char.position.set(0, -1.5, 0);
    char.traverse((c) => {
      if (c.isMesh) {
        if (c.material.name === "Alpha_Body_MAT") {
          // c.material.color = new THREE.Color(0x994400);
          c.material = getMaterial();
        }
        c.castShadow = true;
      }
    });
    const mixer = new THREE.AnimationMixer(char);
    const update = (t) => {
      mixer.update(0.02);
    };
    char.userData = { mixer, update };
    return char;
  }

  character = initCharacter(fbx);
  sceneData.character = character;
});

//
const animations = [
  "Being Electrocuted",
  "Drunk Walk",
  "Floating",
  "Idle",
  "Joyful Jump",
  "Kneeling Pointing",
  "Low Crawl",
  "Male Dance Pose",
  "Neutral Idle",
  "Reaction",
  "Spat In Face",
  "Stand To Roll",
  "Standard Walk",
  "Swimming",
  "Thriller Part 3",
  "Treading Water",
  "Walking",
  "Waving",
];
const apath = "./assets/animations/";
manager.onLoad = () => initScene(sceneData);
animations.forEach((name) => {
  loader.load(`${apath}${name}.fbx`, (fbx) => {
    let anim = fbx.animations[0];
    anim.name = name;
    sceneData.animations.push(anim);
  });
});

function setupActions(character, animations) {
  const actions = [];
  animations.forEach((anim) => {
    let action = character.userData.mixer.clipAction(anim);
    actions.push(action);
  });
  return actions;
}

function initScene(sceneData) {
  const { character, animations } = sceneData;
  const actions = setupActions(character, animations);
  scene.add(character);

  const radius = 10;
  const geometry = new THREE.CircleGeometry(radius, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0x001020,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = Math.PI * -0.5;
  plane.receiveShadow = true;
  plane.position.y = -1.5;
  scene.add(plane);

  const sunLight = new THREE.DirectionalLight(0xffffff, 5);
  sunLight.position.set(2, 4, 3);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  // scene.add(hemiLight);

  // Sprites BG
  const sprites = getLayer({
    hue: 0.58,
    numSprites: 8,
    opacity: 0.2,
    radius: 10,
    size: 24,
    z: -10.5,
  });
  scene.add(sprites);

  let timeElapsed = 0;
  function animate(t = 0) {
    timeElapsed += 0.01;
    requestAnimationFrame(animate);

    character?.userData.update(timeElapsed);
    renderer.render(scene, camera);
    controls.update();
  }
  let index = 2;
  let previousAction;
  playRandomAnimationClip();
  animate();

  function handleWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", handleWindowResize, false);

  function playRandomAnimationClip() {

    const action = actions[index];
    if (action !== previousAction) {
      previousAction?.fadeOut(1);
      action.reset();
      action.fadeIn(1);
      action.play();
      previousAction = action;
    }
    // index += 1;
    // if (index >= actions.length) {
    //   index = 0;
    // }
   index = Math.floor(Math.random() * actions.length);
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      playRandomAnimationClip();
    }
  });
}

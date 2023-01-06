// Option 1: Import the entire three.js core library.
import './style.css'
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'lil-gui';
import gsap from 'gsap';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js'
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader";

/**
 * Base
 */
	// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

let exportedCamera
let controls

/**
 * Models
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const textureLoader = new THREE.TextureLoader();

let mixer = null;

const options = {
	cameraPosition: {
		x: 200,
		y: 200,
		z: 200,
	},
	fov: 75,
	near: 1,
	far: 1000,
	enableSwoopingCamera: false,
	enableRotation: true,
	transmission: 1,
	thickness: 0,
	roughness: 1,
	envMapIntensity: 0.863,
	clearcoat: 0.237,
	clearcoatRoughness: 0.507,
	normalScale: 1,
	clearcoatNormalScale: 1.3,
	normalRepeat: 1,
	reflectivity: 0.427,
	metalness: 0,
	ior: 1.5,
	toggleAnimation: function() {
		playAnimations()
	}
};

const animations = []
let animationsRunning = false

const playAnimations = () => {
	animations.forEach(action => {
		if (animationsRunning) {
			// action.stop()
		} else {
			action.play();
		}
	})
	animationsRunning = !animationsRunning
}

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

const normalMapTexture = textureLoader.load("textures/normal.png", (texture) => {

});
normalMapTexture.wrapS = THREE.RepeatWrapping;
normalMapTexture.wrapT = THREE.RepeatWrapping;
normalMapTexture.repeat.set(1, 1);


const hdrEquirect = new RGBELoader().load(
	"textures/studio_small_01_4k.hdr",
	() => {
		hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
	}
);

const material = new THREE.MeshPhysicalMaterial({
	reflectivity: options.reflectivity,
	metalness: options.metalness,
	transmission: options.transmission,
	ior: options.ior,
	thickness: options.thickness,
	roughness: options.roughness,
	envMap: hdrEquirect,
	opacity: 1,
	envMapIntensity: options.envMapIntensity,
	clearcoat: options.clearcoat,
	clearcoatRoughness: options.clearcoatRoughness,
	normalScale: new THREE.Vector2(options.normalScale),
	normalMap: normalMapTexture,
	clearcoatNormalMap: normalMapTexture,
	clearcoatNormalScale: new THREE.Vector2(options.clearcoatNormalScale),
	depthTest: false,
	specularColor: 0xB011F3,
});

const geometry = new THREE.PlaneGeometry(1, 1);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

gltfLoader.load('models/struct_scene.glb', (gltf) => {
	const model = gltf.scene

	scene.add(model);

	exportedCamera = gltf.cameras[0]
	exportedCamera.aspect = sizes.width / sizes.height;
	exportedCamera.near = 1;
	exportedCamera.far = 1000;
	exportedCamera.updateProjectionMatrix();
	scene.add(exportedCamera)

	console.log('exportedCamera', exportedCamera)

	// Controls
	controls = new OrbitControls(exportedCamera, canvas);
	controls.target.set(0, 0.75, 0);
	controls.enableDamping = true;

	scene.traverse((child) => {
		if (child.isMesh) {
			child.material = material
		}
	})

	mixer = new THREE.AnimationMixer(gltf.scene);
	gltf.animations.forEach((animation) => {
		const action = mixer.clipAction(animation);
		animations.push(action)
		// console.log(action)
		// action.play();
	})

	// Animation


});


/**
 * Lights
 */
function onColorChange(value) {
	spotLight.color = new THREE.Color(value)
}

gui.add(options, 'toggleAnimation')


const spotLight = new THREE.SpotLight(0x281533, 208, 400, 1, 0.127, 0)
spotLight.position.set(0, 254.8, 0)
scene.add(spotLight)

const spotLightFolder = gui.addFolder("spotLight")

spotLightFolder.add(spotLight, 'intensity').min(0).max(10).step(0.001)
spotLightFolder.add(spotLight, 'distance').min(0).max(10).step(0.001)
spotLightFolder.add(spotLight, 'angle').min(0).max(1).step(0.001)
spotLightFolder.add(spotLight, 'penumbra').min(0).max(1).step(0.001)
spotLightFolder.add(spotLight, 'decay').min(0).max(10).step(0.001)
spotLightFolder.addColor(spotLight, 'color').onChange(onColorChange)

const positionFolder = spotLightFolder.addFolder('position')

positionFolder.add(spotLight.position, 'x').min(-10).max(10).step(0.001)
positionFolder.add(spotLight.position, 'y').min(-10).max(10).step(0.001)
positionFolder.add(spotLight.position, 'z').min(-10).max(10).step(0.001)

const materialFolder = gui.addFolder("material")

materialFolder.add(options, "ior").min(1).max(2.333).step(0.001).onChange(() => onMaterialChange("ior"))
materialFolder.add(options, "metalness").min(0).max(1).step(0.001).onChange(() => onMaterialChange("metalness"))
materialFolder.add(options, "reflectivity").min(0).max(1).step(0.001).onChange(() => onMaterialChange("reflectivity"))
materialFolder.add(options, "transmission").min(0).max(1).step(0.001).onChange(() => onMaterialChange("transmission"))
materialFolder.add(options, "thickness").min(0).max(5).step(0.001).onFinishChange(() => onMaterialChange("thickness"))
materialFolder.add(options, "roughness").min(0).max(1).step(0.001).onChange(() => onMaterialChange("roughness"))
materialFolder.add(options, "envMapIntensity").min(0).max(5).step(0.001).onChange(() => onMaterialChange("envMapIntensity"))
materialFolder.add(options, "clearcoat").min(0).max(1).step(0.001).onChange(() => onMaterialChange("clearcoat"))
materialFolder.add(options, "clearcoatRoughness").min(0).max(1).step(0.001).onChange(() => onMaterialChange("clearcoatRoughness"))
materialFolder.add(options, "normalScale").min(0).max(20).step(0.001).onChange(() => {
	material.normalScale = new THREE.Vector2(options.normalScale)
	material.needsUpdate
})
materialFolder.add(options, "clearcoatNormalScale").min(0).max(1).step(0.001).onFinishChange(() => onMaterialChange("clearcoatNormalScale"))

const onMaterialChange = (option) => {
	material[option] = options[option]
	material.needsUpdate
}

// helper
const spotLightHelper = new THREE.SpotLightHelper(spotLight)
scene.add(spotLightHelper)

/**
 * Sizes
 */

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	if (exportedCamera) {
		exportedCamera.aspect = sizes.width / sizes.height;
		exportedCamera.updateProjectionMatrix();
	}

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
	// Base camera
const camera = new THREE.PerspectiveCamera(options.fov, sizes.width / sizes.height, options.near, options.far);
camera.position.set(options.cameraPosition.x, options.cameraPosition.y, options.cameraPosition.z);
// scene.add(camera);

const cameraFolder = gui.addFolder("camera")

const updateCameraView = (option) => {
	camera[option] = options[option]
	camera.updateProjectionMatrix()
}

cameraFolder.add(camera, 'fov').min(0).max(120).step(1).onChange(updateCameraView)
cameraFolder.add(camera, 'near').min(0.01).max(10).step(1).onChange(updateCameraView)
cameraFolder.add(camera, 'far').min(20).max(1000).step(1).onChange(updateCameraView)

const cameraPositionFolder = cameraFolder.addFolder('position')
const updateCameraPosition = (option) => {
	camera.position[option] = options.cameraPosition[option]
	camera.updateWorldMatrix()
}

cameraPositionFolder.add(camera.position, 'x').min(-10).max(10).step(0.001).onChange(updateCameraPosition)
cameraPositionFolder.add(camera.position, 'y').min(-10).max(10).step(0.001).onChange(updateCameraPosition)
cameraPositionFolder.add(camera.position, 'z').min(-10).max(10).step(0.001).onChange(updateCameraPosition)



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	alpha: true
});
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x000000, 0)

renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
	const elapsedTime = clock.getElapsedTime();
	const deltaTime = elapsedTime - previousTime;
	previousTime = elapsedTime;

	// Model animation
	if (mixer && animationsRunning) {
		mixer.update(deltaTime);
	}

	spotLightHelper.update()

	// Update controls
	if (controls) {
		controls.update();
	}




	// Render
	if(exportedCamera) {
		console.log('animation', exportedCamera)
		renderer.render(scene, exportedCamera);
	}


	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();

// initPin();

// function initPin() {
//     gsap.timeline({
//         scrollTrigger: {
//             trigger: '.js-scene',
//             start: `top top`,
//             scrub: true,
//             end: '400%',
//             pin: true,
//             pinType: 'transform',
//         },
//     });

//     gsap.to(camera.position, {
//         scrollTrigger: {
//             trigger: element,
//             start: 'top top',
//             end: '400%',
//             scrub: true,
//         },

//         y: -10,
//     });

//     // gsap.to(camera.position,

//     //     {
//     //         scrollTrigger: {
//     //             trigger: '.js-scene',
//     //             start: `top top`,
//     //             scrub: true,
//     //             end: `100%`, //to fix overlay on mobile

//     //         },
//     //         y: previouslyCreatedSmoother.scrollTop
//     //     })
// }
// Three.js Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 800 / 450, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(800, 450);
document.getElementById('threejs-scene').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Detailed Models
const loader = new THREE.GLTFLoader();
loader.load('models/study_room.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
}, undefined, (error) => {
    console.error(error);
});

camera.position.z = 10;

const animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();

// Pomodoro Timer
let workTime = 25 * 60;
let breakTime = 5 * 60;
let timer;
let isWorkTime = true;
let isRunning = false;

document.getElementById('start').addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        startTimer();
    }
});

document.getElementById('stop').addEventListener('click', () => {
    clearInterval(timer);
    isRunning = false;
});

document.getElementById('reset').addEventListener('click', () => {
    clearInterval(timer);
    isRunning = false;
    isWorkTime = true;
    updateDisplay(workTime);
});

document.getElementById('work-time').addEventListener('change', (e) => {
    workTime = e.target.value * 60;
    if (isWorkTime) updateDisplay(workTime);
});

document.getElementById('break-time').addEventListener('change', (e) => {
    breakTime = e.target.value * 60;
    if (!isWorkTime) updateDisplay(breakTime);
});

function startTimer() {
    let time = isWorkTime ? workTime : breakTime;
    timer = setInterval(() => {
        if (time <= 0) {
            isWorkTime = !isWorkTime;
            clearInterval(timer);
            startTimer();
        } else {
            time--;
            updateDisplay(time);
        }
    }, 1000);
}

function updateDisplay(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    document.getElementById('timer-display').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Todo Tracker
document.getElementById('add-todo').addEventListener('click', () => {
    const newTodo = document.getElementById('new-todo').value;
    if (newTodo.trim() !== '') {
        const li = document.createElement('li');
        li.textContent = newTodo;
        document.getElementById('todo-list').appendChild(li);
        document.getElementById('new-todo').value = '';
    }
});

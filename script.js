import * as THREE from 'three';

// Wait for the DOM to be fully loaded before running script logic
document.addEventListener('DOMContentLoaded', () => {

    // --- Get Element References ---
    const countdownButton = document.getElementById('countdown-button');
    const messageDiv = document.getElementById('message');
    const changeCountButton = document.getElementById('change-count-button');
    const balloonContainer = document.getElementById('balloon-container');

    // Modal elements
    const modalOverlay = document.getElementById('modal-overlay');
    const modalInput = document.getElementById('modal-input');
    const modalSubmit = document.getElementById('modal-submit');
    const modalCancel = document.getElementById('modal-cancel');
    const modalError = document.getElementById('modal-error');

    // Array of sound paths
    const clapSounds = [
        'assets/clap-1.mp3',
        'assets/clap-2.mp3',
        'assets/clap-3.mp3',
        'assets/clap-4.mp3',
        'assets/clap-5.mp3',
        'assets/clap-6.mp3'
    ];
    const balloonPopSounds = [
        'assets/balloon-1.mp3',
        'assets/balloon-2.mp3'
    ];

    // --- Config ---
    const pastelColors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5'];
    const speedFactor = 0.8; // Base speed for balloon movement (Reduced from 1.5)

    // --- Cookie Helper Functions ---
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    // --- End Cookie Helper Functions ---

    let count = parseInt(getCookie('countdownCount')) || 10;

    // --- Global Variables ---
    let scene, camera, renderer;
    let balloons = []; // Array to hold balloon meshes and data
    const clock = new THREE.Clock();

    // --- Event Listeners Setup ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // --- Initialization ---
    function init() {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x333333); // Dark grey background

        // Camera
        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 100;
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.z = 15; // Adjust distance as needed

        // Renderer
        const canvas = document.getElementById('webgl-canvas');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Get DOM Elements
        countdownButton = document.getElementById('countdown-button');
        messageDiv = document.getElementById('message');
        changeCountButton = document.getElementById('change-count-button');
        modalOverlay = document.getElementById('modal-overlay');
        modalInput = document.getElementById('modal-input');
        modalSubmit = document.getElementById('modal-submit');
        modalCancel = document.getElementById('modal-cancel');
        modalError = document.getElementById('modal-error');

        // Initial Setup
        // Store initial count for confetti calculation
        setCookie('initialCountForIntensity', count, 7);
        updateDisplay(); // Update counter, create initial balloons
        addEventListeners(); // Setup UI interactions

        // Start Animation Loop
        animate();
    }

    // --- Balloon Creation ---
    // Define geometry and materials outside the function for reuse
    const balloonGeometry = new THREE.SphereGeometry(1, 32, 16); // Radius 1, adjust segments as needed
    balloonGeometry.scale(1, 1.2, 1); // Scale vertically for balloon shape

    const balloonMaterials = pastelColors.map(color => new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.4, // Adjust for shininess
        metalness: 0.1 // Low metalness for plastic/rubber look
    }));

    function createBalloons() {
        // Clear existing balloons from scene and array
        balloons.forEach(b => {
            scene.remove(b.mesh);
            // Optional: Dispose geometry/material if memory becomes an issue
            // b.mesh.geometry.dispose();
            // b.mesh.material.dispose();
        });
        balloons = [];

        // Determine view boundaries (approximate based on camera Z and FOV)
        const vFov = THREE.MathUtils.degToRad(camera.fov); // Vertical FOV in radians
        const height = 2 * Math.tan(vFov / 2) * camera.position.z;
        const width = height * camera.aspect;
        const spawnArea = {
            x: width * 0.8, // Spawn within 80% of view width
            y: height * 0.8, // Spawn within 80% of view height
            z: 5 // Spawn slightly in front of the background
        };

        for (let i = 0; i < count; i++) {
            const material = balloonMaterials[i % balloonMaterials.length]; // Cycle through materials
            const balloonMesh = new THREE.Mesh(balloonGeometry, material);

            // Random initial position
            balloonMesh.position.x = (Math.random() - 0.5) * spawnArea.x;
            balloonMesh.position.y = (Math.random() - 0.5) * spawnArea.y;
            balloonMesh.position.z = (Math.random() - 0.5) * spawnArea.z;

            // Add user data for velocity, etc.
            balloonMesh.userData = {
                id: i,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5, // Reduced initial speed
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.1 // Less Z movement
                ),
                isPopped: false
            };

            // Assign a name for easier identification during raycasting/popping
            balloonMesh.name = `balloon_${i}`;

            balloons.push({ mesh: balloonMesh, data: balloonMesh.userData });
            scene.add(balloonMesh);
        }
    }

    // --- Update Display / UI ---
    function updateDisplay() {
        if (countdownButton) {
            countdownButton.textContent = count;
            countdownButton.style.display = count > 0 ? 'inline-block' : 'none';
        }
        if (messageDiv) {
             messageDiv.style.display = count <= 0 ? 'block' : 'none';
             if (count <= 0) messageDiv.textContent = 'You did it! 🎉';
        }

        // Trigger balloon creation/re-creation
        createBalloons();
    }

    // --- Animation Loop ---
    function animate() {
        requestAnimationFrame(animate);

        const deltaTime = clock.getDelta();

        // Calculate view boundaries for bouncing
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const viewHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
        const viewWidth = viewHeight * camera.aspect;
        const bounds = {
            x: viewWidth / 2,
            y: viewHeight / 2,
            z: 5 // Match approximate spawn depth limit
        };

        // Animate balloons
        balloons.forEach(balloonData => {
            const mesh = balloonData.mesh;
            const velocity = balloonData.data.velocity;

            if (balloonData.data.isPopped) return; // Skip popped balloons

            // Update position
            mesh.position.x += velocity.x * deltaTime * 50; // Scale velocity by time and factor
            mesh.position.y += velocity.y * deltaTime * 50;
            mesh.position.z += velocity.z * deltaTime * 50;

            // Bounce off boundaries
            const radius = mesh.geometry.parameters.radius * mesh.scale.y; // Approximate radius considering scale
            // X bounds
            if (Math.abs(mesh.position.x) + radius > bounds.x) {
                velocity.x *= -1;
                mesh.position.x = Math.sign(mesh.position.x) * (bounds.x - radius); // Prevent sticking
            }
            // Y bounds
            if (Math.abs(mesh.position.y) + radius > bounds.y) {
                velocity.y *= -1;
                 mesh.position.y = Math.sign(mesh.position.y) * (bounds.y - radius); // Prevent sticking
            }
            // Z bounds (simple bounce, less critical)
            if (Math.abs(mesh.position.z) > bounds.z) { // Z bounce is simpler
                velocity.z *= -1;
                mesh.position.z = Math.sign(mesh.position.z) * bounds.z;
            }

             // Add slight random nudge over time (optional, can be refined)
             const nudgeFactor = 0.01;
             velocity.x += (Math.random() - 0.5) * nudgeFactor * deltaTime;
             velocity.y += (Math.random() - 0.5) * nudgeFactor * deltaTime;
             // Keep velocity reasonable
             velocity.clampLength(0.1, 1.0); // Min/Max speed

        });

        renderer.render(scene, camera);
    }

    // --- Event Listeners (Placeholders/Basic Setup) ---
    function addEventListeners() {
        // Window Resize
        window.addEventListener('resize', onWindowResize, false);

        // Canvas Click (Balloon Pop)
        if (renderer && renderer.domElement) {
            renderer.domElement.addEventListener('click', onCanvasClick, false);
        } else {
            console.error("Renderer or canvas not ready for click listener.");
        }

        // Central Counter Click (Random Pop)
        if (countdownButton) {
            countdownButton.addEventListener('click', onCounterClick, false);
        }

        // Modal Interactions
        if (changeCountButton && modalOverlay && modalInput && modalCancel && modalSubmit && modalError) {
            changeCountButton.addEventListener('click', () => {
                modalInput.value = count > 0 ? count : 10;
                modalError.textContent = '';
                modalOverlay.classList.remove('hidden');
                modalInput.focus();
            });
            modalCancel.addEventListener('click', () => {
                modalOverlay.classList.add('hidden');
            });
            modalSubmit.addEventListener('click', () => {
                const newCountStr = modalInput.value;
                const newCount = parseInt(newCountStr);
                if (isNaN(newCount) || newCount <= 0 || !Number.isInteger(newCount)) {
                    modalError.textContent = 'Please enter a positive whole number.';
                    modalInput.focus();
                } else {
                    count = newCount;
                    setCookie('countdownCount', count, 7);
                    setCookie('initialCountForIntensity', count, 7);
                    updateDisplay();
                    modalOverlay.classList.add('hidden');
                    // Note: Background color is now handled by scene background
                }
            });
            modalOverlay.addEventListener('click', (event) => {
                if (event.target === modalOverlay) {
                    modalOverlay.classList.add('hidden');
                }
            });
            modalInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    modalSubmit.click();
                }
            });
        } else {
            console.error("Modal elements not found!");
        }
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // --- Click Handling ---
    // ... onCanvasClick ...
    // ... onCounterClick ...

    // --- Pop Logic Implementation ---
    function popBalloon(balloonData) {
         if (!balloonData || balloonData.data.isPopped) return; // Check if already popped or invalid

         balloonData.data.isPopped = true; // Mark as popped immediately
         const mesh = balloonData.mesh;

         // --- Sounds ---
         if (balloonPopSounds.length > 0) {
             const randomPopIndex = Math.floor(Math.random() * balloonPopSounds.length);
             const selectedPopSound = balloonPopSounds[randomPopIndex];
             try {
                 const audio = new Audio(selectedPopSound);
                 audio.play().catch(error => console.error(`Balloon pop sound failed: ${selectedPopSound}`, error));
             } catch (error) {
                 console.error(`Failed to create audio for ${selectedPopSound}:`, error);
             }
         }
         setTimeout(() => {
             if (clapSounds.length > 0) {
                 const randomClapIndex = Math.floor(Math.random() * clapSounds.length);
                 const selectedClapSound = clapSounds[randomClapIndex];
                 try {
                     const audio = new Audio(selectedClapSound);
                     audio.play().catch(error => console.error(`Clap sound failed: ${selectedClapSound}`, error));
                 } catch (error) {
                     console.error(`Failed to create audio for ${selectedClapSound}:`, error);
                 }
             }
         }, 50); // 50ms delay
         // --- End Sounds ---

         // --- Visual Effects ---
         // Confetti
         const initialCount = parseInt(getCookie('initialCountForIntensity')) || 10;
         const intensity = Math.max(0, 1 - ((count - 1) / initialCount)); // Ensure intensity doesn't go below 0
         const particleCount = 50 + Math.floor(intensity * 250);
         const spread = 70 + Math.floor(intensity * 80);
         if (typeof confetti === 'function') {
             confetti({ particleCount: particleCount / 2, angle: 60, spread: spread, origin: { x: 0 } });
             confetti({ particleCount: particleCount / 2, angle: 120, spread: spread, origin: { x: 1 } });
         }

         // Simple Pop Animation: Scale down
         let scale = 1.0;
         const scaleFactor = mesh.scale.y / mesh.scale.x; // Preserve original aspect ratio
         const popInterval = setInterval(() => {
             scale -= 0.08; // Speed of pop animation
             if (scale <= 0) {
                 clearInterval(popInterval);
                 scene.remove(mesh);
             } else {
                 mesh.scale.set(scale, scale * scaleFactor, scale);
             }
         }, 16); // ~60fps
         // --- End Visual Effects & Animation ---

         // --- Update State ---
         count--;
         setCookie('countdownCount', count, 7);

         if (countdownButton) {
             countdownButton.textContent = count;
         }

         if (count <= 0) {
             if (messageDiv) {
                 messageDiv.textContent = 'You did it! 🎉';
                 messageDiv.style.display = 'block';
             }
             if (countdownButton) countdownButton.style.display = 'none';
             if (typeof confetti === 'function') {
                 confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
                 confetti({ particleCount: 150, spread: 120, origin: { y: 0.8 }, angle: 90 });
             }
             // Optional: Change scene background on finish?
             // scene.background = new THREE.Color(0xffffff);
         }
    }

    // --- Start --- 
    // Use DOMContentLoaded to ensure canvas and UI elements are ready
    init();

    // --- Animation Loop ---
    let lastNudgeTime = 0;
    const nudgeInterval = 2000; // Nudge direction every 2 seconds

    function animateBalloons() {
        if (!balloonContainer) return;
        const balloons = balloonContainer.querySelectorAll('.balloon:not(.popped)');
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const currentTime = Date.now();

        balloons.forEach(balloon => {
            let dx = parseFloat(balloon.dataset.dx) || 0;
            let dy = parseFloat(balloon.dataset.dy) || 0;
            let left = parseFloat(balloon.style.left) || 0;
            let top = parseFloat(balloon.style.top) || 0;

            // Update position
            left += dx;
            top += dy;

            // Bounce off edges (consider balloon dimensions)
            const balloonWidth = parseFloat(balloon.style.width) || 80;
            const balloonHeight = parseFloat(balloon.style.height) || 105;

            // Left edge
            if (left < 0) {
                left = 0;
                dx = Math.abs(dx); // Reverse horizontal direction
            }
            // Right edge
            if (left + balloonWidth > vw) {
                left = vw - balloonWidth;
                dx = -Math.abs(dx); // Reverse horizontal direction
            }
            // Top edge
            if (top < 0) {
                top = 0;
                dy = Math.abs(dy); // Reverse vertical direction
            }
            // Bottom edge (consider string visually, but maybe bounce balloon body)
            if (top + balloonHeight > vh) { // Bounce based on balloon body, not string
                top = vh - balloonHeight;
                dy = -Math.abs(dy); // Reverse vertical direction
            }

            // Occasional random nudge
            if (currentTime - lastNudgeTime > nudgeInterval) {
                 const nudgeFactor = 0.1;
                 dx += (Math.random() - 0.5) * nudgeFactor;
                 dy += (Math.random() - 0.5) * nudgeFactor;
                 // Clamp speed slightly (speedFactor is now in scope)
                 const maxSpeed = 1 * speedFactor;
                 dx = Math.max(-maxSpeed, Math.min(maxSpeed, dx));
                 dy = Math.max(-maxSpeed, Math.min(maxSpeed, dy));
            }

            // Update element style and data
            balloon.style.left = `${left}px`;
            balloon.style.top = `${top}px`;
            balloon.dataset.dx = dx;
            balloon.dataset.dy = dy;
        });

        // Update last nudge time for the next frame check
        if (currentTime - lastNudgeTime > nudgeInterval) {
            lastNudgeTime = currentTime;
        }

        // Loop animation
        requestAnimationFrame(animateBalloons);
    }

    // Start the animation loop
    requestAnimationFrame(animateBalloons);

    // --- Event Listeners ---

    // Listener for the central counter (pops a random balloon)
    if (countdownButton) {
        countdownButton.addEventListener('click', () => {
            if (count <= 0) return; // Nothing to pop

            const balloons = balloonContainer.querySelectorAll('.balloon:not(.popped)');
            if (balloons.length > 0) {
                const randomIndex = Math.floor(Math.random() * balloons.length);
                popBalloon(balloons[randomIndex], true); // popBalloon now handles all effects
            }
            // Removed old direct sound/confetti/flash logic from here
        });
    }

    // Listeners for Modal
    if (changeCountButton && modalOverlay && modalInput && modalCancel && modalSubmit && modalError) {
        // Open modal
        changeCountButton.addEventListener('click', () => {
            modalInput.value = count > 0 ? count : 10; // Default/current balloon count
            modalError.textContent = '';
            modalOverlay.classList.remove('hidden');
            modalInput.focus();
        });

        // Cancel modal
        modalCancel.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });

        // Submit modal
        modalSubmit.addEventListener('click', () => {
            const newCountStr = modalInput.value;
            const newCount = parseInt(newCountStr);
            if (isNaN(newCount) || newCount <= 0 || !Number.isInteger(newCount)) {
                modalError.textContent = 'Please enter a positive whole number.';
                modalInput.focus();
            } else {
                count = newCount;
                setCookie('countdownCount', count, 7);
                setCookie('initialCountForIntensity', count, 7); // Update initial count for intensity calc
                updateDisplay();
                modalOverlay.classList.add('hidden');
                document.body.style.backgroundColor = '#333';
            }
        });

        // Close modal on overlay click
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });

        // Submit modal on Enter key
        modalInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                modalSubmit.click();
            }
        });
    } else {
        console.error("Modal elements not found! Check HTML IDs and script timing.");
    }

}); // End of DOMContentLoaded listener
// Wait for the DOM to be fully loaded before running script logic
document.addEventListener('DOMContentLoaded', () => {

    // --- Get Element References ---
    const countdownButton = document.getElementById('countdown-button');
    const messageDiv = document.getElementById('message');
    const changeCountButton = document.getElementById('change-count-button');
    const balloonContainer = document.getElementById('balloon-container');
    const paperFallArea = document.getElementById('paper-fall-area');
    const landedPapersContainer = document.getElementById('landed-papers-container');

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

    // Messages for Papers
    const paperMessages = [
        "You got this!", "Shine and soar!", "Believe in yourself.", "Enjoy the journey.",
        "Create your happiness.", "Embrace new possibilities.", "Dreams do come true.", "Always stay hopeful!",
        "Celebrate small victories.", "Keep smiling bright.", "You're doing great!", "Strive for growth.",
        "Think happy thoughts.", "Be your best.", "Trust the process.", "Radiate good vibes.",
        "Stay wonderfully curious.", "Inspire and be inspired.", "Choose joy daily.", "Feel the sunshine.",
        "Grow with grace.", "Keep moving forward.", "Make today count.", "Shine your light.",
        "Focus on goodness.", "Positive vibes only.", "Stay bright-hearted.", "Believe and achieve.",
        "Stay fearless, friend.", "Follow your bliss.", "Bloom where planted.", "Smile every day.",
        "Progress over perfection.", "Believe in miracles.", "Radiate positivity now.", "Chase your dreams.",
        "Reflect, then rise.", "You have sparkle!", "Dare to glow.", "Stay open-minded always.",
        "You are enough.", "Keep your sparkle.", "Let joy in.", "Seize the day!",
        "You can do it!", "Embrace your power.", "Nurture your passion.", "Thrive on optimism.",
        "Miracles happen daily.", "Celebrate your uniqueness."
    ];

    // --- Storage Keys ---
    const countCookieKey = 'countdownCount';
    const initialCountIntensityCookieKey = 'initialCountForIntensity';
    const initialTotalAssessmentsCookieKey = 'initialTotalAssessments';
    const landedPapersStorageKey = 'landedPapersData'; // Using localStorage now

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

    let count = parseInt(getCookie(countCookieKey)) || 25;
    let initialCountForIntensity = parseInt(getCookie(initialCountIntensityCookieKey)) || count;

    // --- Balloon Logic ---
    function checkOverlap(newBalloonRect) {
        // Check overlap with central counter
        if (countdownButton) {
            const counterRect = countdownButton.getBoundingClientRect();
            if (
                newBalloonRect.left < counterRect.right &&
                newBalloonRect.right > counterRect.left &&
                newBalloonRect.top < counterRect.bottom &&
                newBalloonRect.bottom > counterRect.top
            ) {
                return true; // Overlaps with counter
            }
        }

        // Check overlap with existing balloons
        const existingBalloons = balloonContainer.querySelectorAll('.balloon');
        for (const existing of existingBalloons) {
            const existingRect = existing.getBoundingClientRect();
             if (
                newBalloonRect.left < existingRect.right &&
                newBalloonRect.right > existingRect.left &&
                newBalloonRect.top < existingRect.bottom &&
                newBalloonRect.bottom > existingRect.top
            ) {
                return true; // Overlaps with another balloon
            }
        }

        return false; // No overlap found
    }

    function createBalloon(id) {
        if (!balloonContainer) return;

        const balloon = document.createElement('div');
        balloon.classList.add('balloon');
        balloon.dataset.id = id;

        // Assign random pastel color
        const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
        balloon.classList.add(randomColor);

        // Get balloon dimensions (approximated from CSS for initial check)
        // Update dimensions to match new CSS
        const balloonWidth = 80;
        const balloonHeight = 105;
        const totalHeight = balloonHeight + 30; // Include string space for initial placement
        const margin = 10;

        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

        let attempts = 0;
        const maxAttempts = 50;
        let overlaps = true;
        let finalX = 0, finalY = 0;

        while (overlaps && attempts < maxAttempts) {
            attempts++;
            // Random initial position
            // Ensure position allows for balloon dimensions + margin + string within viewport
            const startX = Math.random() * (vw - balloonWidth - margin * 2) + margin;
            const startY = Math.random() * (vh - totalHeight - margin * 2) + margin;

            // Calculate potential bounding box (using balloon dimensions only for collision)
            const potentialRect = {
                left: startX,
                top: startY,
                right: startX + balloonWidth,
                bottom: startY + balloonHeight // Collision check ignores the string
            };

            // Check for overlaps
            overlaps = checkOverlap(potentialRect);

            if (!overlaps) {
                finalX = startX;
                finalY = startY;
            }
        }

        if (attempts >= maxAttempts) {
            console.warn("Could not find non-overlapping position for balloon, placing randomly.");
            finalX = Math.random() * (vw - balloonWidth - margin * 2) + margin;
            finalY = Math.random() * (vh - totalHeight - margin * 2) + margin;
        }

        balloon.style.left = `${finalX}px`;
        balloon.style.top = `${finalY}px`;

        // Initialize random velocity for animation
        balloon.dataset.dx = (Math.random() - 0.5) * 2 * speedFactor;
        balloon.dataset.dy = (Math.random() - 0.5) * 2 * speedFactor;

        balloon.addEventListener('click', () => popBalloon(balloon));
        balloonContainer.appendChild(balloon);
    }

    function renderBalloons() {
        if (!balloonContainer) return;
        balloonContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            createBalloon(i);
        }
        if (countdownButton) {
            countdownButton.textContent = count;
        }
    }

    function popBalloon(balloonElement, isRandom = false) {
        if (!balloonElement || balloonElement.classList.contains('popped')) return;

        // --- Calculate message index BEFORE decrementing count ---
        const totalInitialCount = parseInt(getCookie(initialTotalAssessmentsCookieKey)) || 25;
        const absolutePapersDropped = totalInitialCount - count;
        const messageIndex = absolutePapersDropped % paperMessages.length;
        const message = paperMessages[messageIndex];

        // --- Play Sounds ---
        // Play random balloon pop sound immediately
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

        // Play random clap sound slightly delayed
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
        // Background Flash (only if count > 1 before popping)
        if (count > 1) {
             document.body.style.backgroundColor = '#fff';
             setTimeout(() => {
                 // Check count hasn't hit zero during the flash
                 if (count > 0) {
                    document.body.style.backgroundColor = '#333';
                 }
             }, 200);
        }

        // Confetti
        const intensity = 1 - ((count -1) / (parseInt(getCookie(initialCountIntensityCookieKey)) || 10)); // Intensity based on initial count
        const particleCount = 50 + Math.floor(intensity * 250);
        const spread = 70 + Math.floor(intensity * 80);
        confetti({ particleCount: particleCount / 2, angle: 60, spread: spread, origin: { x: 0 } });
        confetti({ particleCount: particleCount / 2, angle: 120, spread: spread, origin: { x: 1 } });

        // Add popped class for animation
        balloonElement.classList.add('popped');
        // --- End Visual Effects ---

        // --- Handle Paper Drop ---
        // Play paper sound
        try {
            const paperAudio = new Audio('assets/paper-1.mp3');
            paperAudio.play().catch(error => console.error("Paper sound failed:", error));
        } catch (error) {
            console.error("Failed to create audio for paper sound:", error);
        }

        // Create the FALLING paper element
        const fallingPaper = document.createElement('div');
        fallingPaper.classList.add('paper');
        // ... add message span to fallingPaper ...
        const messageSpan = document.createElement('span');
        messageSpan.classList.add('paper-message');
        messageSpan.textContent = message;
        fallingPaper.appendChild(messageSpan);
        
        // Set horizontal position for falling paper
        const startX = Math.random() * (window.innerWidth - 50);
        fallingPaper.style.left = `${startX}px`; 

        // Add to fall area and start animation
        if (paperFallArea) {
            paperFallArea.appendChild(fallingPaper);
        }
        fallingPaper.classList.add('falling');

        // --- Create LANDED paper (initially hidden) --- 
        const landedPaper = fallingPaper.cloneNode(true); // Clone includes message
        landedPaper.classList.remove('falling');
        landedPaper.style.animation = 'none';
        landedPaper.style.position = 'absolute'; // Needed for bottom/left positioning
        landedPaper.style.top = 'auto'; // Make sure 'top' isn't interfering

        // Calculate final resting place
        const containerWidth = landedPapersContainer.offsetWidth;
        const paperWidth = 50;
        const landX = Math.random() * (containerWidth - paperWidth);
        const landRotation = (Math.random() - 0.5) * 30;
        const finalBottom = Math.random() * 20 - 10; // Final vertical offset

        // Set final horizontal position and rotation
        landedPaper.style.left = `${landX}px`;
        landedPaper.style.transform = `rotate(${landRotation}deg)`;
        // CSS rule #landed-papers-container .paper sets initial bottom/opacity

        // Add landed paper to its container (it starts hidden below)
        if (landedPapersContainer) {
            landedPapersContainer.appendChild(landedPaper);
        }

        // Listener for FALLING paper animation end
        fallingPaper.addEventListener('animationend', () => {
            // Clean up the falling paper element
            if (fallingPaper.parentNode) {
                fallingPaper.parentNode.removeChild(fallingPaper);
            }

            // --- Save and Display Landed Paper --- 
            // 1. Prepare data for the new paper
            const newLandedPaperData = {
                message: message, // Message calculated earlier
                left: landX,      // Final X calculated earlier
                bottom: finalBottom, // Final Bottom calculated earlier
                rotation: landRotation // Final rotation calculated earlier
            };

            // 2. Load existing, add new, save back to localStorage
            let savedPapers = [];
            const savedPapersJSON = localStorage.getItem(landedPapersStorageKey);
            if (savedPapersJSON) {
                try {
                    savedPapers = JSON.parse(savedPapersJSON);
                } catch (e) {
                    console.error("Error parsing saved paper data before saving:", e);
                    savedPapers = []; // Start fresh if data is corrupt
                }
            }
            savedPapers.push(newLandedPaperData);
            localStorage.setItem(landedPapersStorageKey, JSON.stringify(savedPapers));

            // 3. Create and display the visual element for the new paper
            const landedPaper = document.createElement('div');
            landedPaper.classList.add('paper');
            const msgSpan = document.createElement('span');
            msgSpan.classList.add('paper-message');
            msgSpan.textContent = newLandedPaperData.message;
            landedPaper.appendChild(msgSpan);

            // Set final position/rotation (starts hidden by CSS)
            landedPaper.style.position = 'absolute'; 
            landedPaper.style.left = `${newLandedPaperData.left}px`;
            landedPaper.style.transform = `rotate(${newLandedPaperData.rotation}deg)`;
            landedPaper.style.top = 'auto';
            // Initial bottom/opacity set by #landed-papers-container .paper CSS
            
            if (landedPapersContainer) {
                landedPapersContainer.appendChild(landedPaper);
            }

            // Trigger the LANDED paper animation IN (slide up/fade in)
             setTimeout(() => {
                landedPaper.style.bottom = `${newLandedPaperData.bottom}px`;
                landedPaper.style.opacity = 1;
             }, 10); 
            // --- End Save and Display --- 

        }, { once: true });
        // --- End Handle Paper Drop --- 

        // --- Update State (after balloon animation timeout) ---
        setTimeout(() => {
            count--;
            setCookie(countCookieKey, count, 7);

            if (countdownButton) {
                countdownButton.textContent = count;
            }
            if (balloonElement.parentNode) {
                balloonElement.parentNode.removeChild(balloonElement);
            }

            if (count <= 0) {
                if (messageDiv) {
                    messageDiv.textContent = 'You did it! 🎉';
                    messageDiv.style.display = 'block';
                }
                if (countdownButton) countdownButton.style.display = 'none';
                document.body.style.backgroundColor = '#fff';
                if (balloonContainer) balloonContainer.innerHTML = '';
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
                confetti({ particleCount: 150, spread: 120, origin: { y: 0.8 }, angle: 90 });
            }
        }, 200);
    }

    function updateDisplay() {
        if (!countdownButton || !messageDiv) return;
        renderBalloons();
        if (count <= 0) {
            countdownButton.style.display = 'none';
            messageDiv.textContent = 'You did it! 🎉';
            messageDiv.style.display = 'block';
            document.body.style.backgroundColor = '#fff';
            if (balloonContainer) balloonContainer.innerHTML = '';
        } else {
            countdownButton.textContent = count;
            countdownButton.style.display = 'inline-block';
            messageDiv.style.display = 'none';
            document.body.style.backgroundColor = '#333';
        }
    }

    function initializeState() {
        // Load counts
        count = parseInt(getCookie(countCookieKey)) || 25;
        initialCountForIntensity = parseInt(getCookie(initialCountIntensityCookieKey)) || count;
        
        // Store the absolute initial count if not already set
        if (!getCookie(initialTotalAssessmentsCookieKey)) {
            setCookie(initialTotalAssessmentsCookieKey, count, 365);
        }

        // --- Load and Display Landed Papers --- 
        if (landedPapersContainer) {
            landedPapersContainer.innerHTML = ''; // Clear any existing papers visually
            const savedPapersJSON = localStorage.getItem(landedPapersStorageKey);
            if (savedPapersJSON) {
                try {
                    const savedPapers = JSON.parse(savedPapersJSON);
                    savedPapers.forEach(paperData => {
                        // Create the paper element
                        const paper = document.createElement('div');
                        paper.classList.add('paper');
                        
                        // Add message span
                        const messageSpan = document.createElement('span');
                        messageSpan.classList.add('paper-message');
                        messageSpan.textContent = paperData.message;
                        paper.appendChild(messageSpan);

                        // Apply saved styles directly (override transition start state)
                        paper.style.position = 'absolute';
                        paper.style.left = `${paperData.left}px`;
                        paper.style.bottom = `${paperData.bottom}px`;
                        paper.style.top = 'auto'; // Add this again to override base .paper top style
                        paper.style.transform = `rotate(${paperData.rotation}deg)`;
                        paper.style.opacity = 1; // Make visible immediately
                        paper.style.transition = 'none'; // Prevent initial transition

                        landedPapersContainer.appendChild(paper);
                    });
                } catch (e) {
                    console.error("Error parsing saved paper data:", e);
                    localStorage.removeItem(landedPapersStorageKey); // Clear corrupted data
                }
            }
        }
        // --- End Load Landed Papers ---

        updateDisplay();
    }
    
    initializeState();

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
            modalInput.value = count > 0 ? count : 25; // Default/current balloon count
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
                initialCountForIntensity = count;
                setCookie(countCookieKey, count, 7);
                setCookie(initialCountIntensityCookieKey, initialCountForIntensity, 7);
                setCookie(initialTotalAssessmentsCookieKey, count, 365);
                // Clear saved papers when resetting count
                localStorage.removeItem(landedPapersStorageKey);
                initializeState(); // Re-initialize state (will clear visual papers)
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
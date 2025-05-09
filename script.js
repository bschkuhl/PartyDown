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
    const speedFactor = 0.8;
    const baseBalloonWidth = 80; // Base size from CSS
    const baseBalloonHeight = 105; // Base size from CSS

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

    // --- Sound Limiting ---
    let activeSoundCount = 0;
    const maxActiveSounds = 3;
    // --- End Sound Limiting ---

    let count = parseInt(getCookie(countCookieKey)) || 30;
    let initialCountForIntensity = parseInt(getCookie(initialCountIntensityCookieKey)) || count;

    // --- Sound Playing Helper ---
    function playSound(src) {
        if (activeSoundCount >= maxActiveSounds) {
            // console.log("Max sound limit reached, skipping:", src); // Optional debug log
            return; // Skip playing if limit reached
        }

        activeSoundCount++;
        // console.log("Playing sound, active count:", activeSoundCount); // Optional debug log

        try {
            const audio = new Audio(src);

            // Decrement count when sound ends or if error occurs
            const onEndOrError = () => {
                activeSoundCount = Math.max(0, activeSoundCount - 1); // Ensure count doesn't go below 0
                // console.log("Sound ended/error, active count:", activeSoundCount); // Optional debug log
                // Remove listeners to prevent memory leaks
                audio.removeEventListener('ended', onEndOrError);
                audio.removeEventListener('error', onEndOrError);
            };

            audio.addEventListener('ended', onEndOrError);
            audio.addEventListener('error', onEndOrError); // Also decrement on load/decode error

            audio.play().catch(error => {
                console.error(`Sound playback failed for ${src}:`, error);
                onEndOrError(); // Decrement count if play() promise rejects
            });

        } catch (error) {
            console.error(`Failed to create or play audio for ${src}:`, error);
            // Decrement count if 'new Audio()' or initial setup fails
             activeSoundCount = Math.max(0, activeSoundCount - 1);
             // console.log("Sound creation error, active count:", activeSoundCount); // Optional debug log
        }
    }
    // --- End Sound Playing Helper ---

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

        // --- Size Variation ---
        const scaleVariation = 0.10; // +/- 10% (Increased from 0.05)
        const randomScaleFactor = 1 + (Math.random() - 0.5) * 2 * scaleVariation; // Range: 0.90 to 1.10
        const currentWidth = baseBalloonWidth * randomScaleFactor;
        const currentHeight = baseBalloonHeight * randomScaleFactor;

        // Apply and store size
        balloon.style.width = `${currentWidth}px`;
        balloon.style.height = `${currentHeight}px`;
        balloon.dataset.width = currentWidth;
        balloon.dataset.height = currentHeight;
        // --- End Size Variation ---

        const totalHeight = currentHeight + 30; // Include string space for initial placement
        const margin = 10;

        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

        let attempts = 0;
        const maxAttempts = 50;
        let overlaps = true;
        let finalX = 0, finalY = 0;

        while (overlaps && attempts < maxAttempts) {
            attempts++;
            // Use CURRENT size for placement calculation
            const startX = Math.random() * (vw - currentWidth - margin * 2) + margin;
            const startY = Math.random() * (vh - totalHeight - margin * 2) + margin;

            // Use CURRENT size for collision check bounding box
            const potentialRect = {
                left: startX,
                top: startY,
                right: startX + currentWidth,
                bottom: startY + currentHeight // Collision check uses actual balloon body height
            };

            overlaps = checkOverlap(potentialRect);

            if (!overlaps) {
                finalX = startX;
                finalY = startY;
            }
        }

        if (attempts >= maxAttempts) {
            console.warn("Could not find non-overlapping position for balloon, placing randomly.");
            // Use CURRENT size for fallback placement
            finalX = Math.random() * (vw - currentWidth - margin * 2) + margin;
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

        // --- Play Sounds (using helper) ---
        // Play random balloon pop sound immediately
        if (balloonPopSounds.length > 0) {
            const randomPopIndex = Math.floor(Math.random() * balloonPopSounds.length);
            const selectedPopSound = balloonPopSounds[randomPopIndex];
            playSound(selectedPopSound); // Use helper
        }
        // Play random clap sound slightly delayed
        setTimeout(() => {
            if (clapSounds.length > 0) {
                 const randomClapIndex = Math.floor(Math.random() * clapSounds.length);
                 const selectedClapSound = clapSounds[randomClapIndex];
                 playSound(selectedClapSound); // Use helper
            }
        }, 50);
        // Play paper sound (moved from paper drop section to group sounds)
        playSound('assets/paper-1.mp3'); // Use helper
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
        const initialCount = parseInt(getCookie(initialCountIntensityCookieKey)) || 30;
        const intensity = Math.max(0, 1 - ((count - 1) / initialCount));
        const particleCount = 80 + Math.floor(intensity * 220);
        const spread = 70 + Math.floor(intensity * 80);

        // ***** ADD LOGS FOR DEBUGGING *****
        console.log(`Confetti Debug: count=${count}, initial=${initialCount}, intensity=${intensity.toFixed(2)}, particleCount=${particleCount}, spread=${spread}`);
        // ***** END LOGS *****

        // Check if confetti function exists before calling
        if (typeof confetti === 'function') {
            confetti({ particleCount: Math.ceil(particleCount / 2), angle: 60, spread: spread, origin: { x: 0 } });
            confetti({ particleCount: Math.floor(particleCount / 2), angle: 120, spread: spread, origin: { x: 1 } });
            console.log("Called confetti() functions."); // Confirm calls happened
        } else {
            console.log("Confetti function not found!");
        }

        // Add popped class for animation
        balloonElement.classList.add('popped');
        // --- End Visual Effects ---

        // --- Handle Paper Drop ---
        // Create the FALLING paper element
        const fallingPaper = document.createElement('div');
        fallingPaper.classList.add('paper');
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

        // --- Create LANDED paper (initially hidden) based on a clone ---
        const landedPaper = fallingPaper.cloneNode(true); // Clone includes message
        landedPaper.classList.remove('falling');
        landedPaper.style.animation = 'none';
        landedPaper.style.position = 'absolute';
        landedPaper.style.top = 'auto';

        // Calculate final resting place
        const containerWidth = landedPapersContainer.offsetWidth;
        const paperWidth = 50;
        const landX = Math.random() * (containerWidth - paperWidth);
        const landRotation = (Math.random() - 0.5) * 30;
        const finalBottom = Math.random() * 20 - 10;

        // Set final horizontal position and rotation on the clone
        landedPaper.style.left = `${landX}px`;
        landedPaper.style.transform = `rotate(${landRotation}deg)`;
        // CSS rule #landed-papers-container .paper sets initial bottom/opacity

        // Add landed paper clone to its container (it starts hidden below)
        if (landedPapersContainer) {
            landedPapersContainer.appendChild(landedPaper);
        }

        // Listener for FALLING paper animation end
        fallingPaper.addEventListener('animationend', () => {
            // Clean up the falling paper element
            if (fallingPaper.parentNode) {
                fallingPaper.parentNode.removeChild(fallingPaper);
            }

            if (count > 0) {
                // --- Save Landed Paper Data ---
                const newLandedPaperData = {
                    message: message, 
                    left: landX, 
                    bottom: finalBottom,
                    rotation: landRotation
                };
                let savedPapers = [];
                const savedPapersJSON = localStorage.getItem(landedPapersStorageKey);
                if (savedPapersJSON) {
                    try { savedPapers = JSON.parse(savedPapersJSON); } catch (e) { savedPapers = []; }
                }
                savedPapers.push(newLandedPaperData);
                localStorage.setItem(landedPapersStorageKey, JSON.stringify(savedPapers));

                // --- Trigger Entrance Animation for the Existing Clone ---
                // const landedPaper = ... // NO need to recreate!
                // const msgSpan = ... // NO need to recreate!
                // landedPaper.appendChild(msgSpan); // NO need!
                // landedPaper.style.position = ... // Styles already set!
                // landedPaper.style.left = ...
                // landedPaper.style.transform = ...
                // landedPaper.style.top = ...
                // if (landedPapersContainer) { // Already appended!
                //    landedPapersContainer.appendChild(landedPaper);
                // }

                // Just trigger the animation
                 setTimeout(() => {
                    landedPaper.style.bottom = `${finalBottom}px`; // Apply final bottom
                    landedPaper.style.opacity = 1;
                 }, 10); 
                // --- End Trigger Animation ---
            }

        }, { once: true });
        // --- End Handle Paper Drop --- 

        // --- Check for Final Pop & Clear Storage ---
        const isFinalPop = (count === 1);
        if (isFinalPop) {
            // ***** ADD LOG BEFORE *****
            
            localStorage.removeItem(landedPapersStorageKey);
            // ***** ADD LOG AFTER *****
            
            
        }

        // --- Update State & UI (after balloon animation timeout) ---
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
        // Load count
        count = parseInt(getCookie(countCookieKey)) || 30; // Default to 30

        // Reset count if finished last session
        let sessionStartCount = count;
        if (count <= 0) {
            count = 30; // Reset count to 30
            sessionStartCount = count;
            setCookie(countCookieKey, count, 7);
        }
        
        // Always reset/set the absolute total assessments based on the effective start count
        setCookie(initialTotalAssessmentsCookieKey, sessionStartCount, 365);
        initialCountForIntensity = parseInt(getCookie(initialCountIntensityCookieKey)) || sessionStartCount; // Use effective start for intensity too
        setCookie(initialCountIntensityCookieKey, initialCountForIntensity, 7); // Ensure intensity cookie is also correct

        // --- Load and Display Landed Papers --- 
        if (landedPapersContainer) {
            landedPapersContainer.innerHTML = ''; 
            
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

                        // Apply final styles BEFORE appending
                        paper.style.position = 'absolute';
                        paper.style.left = `${paperData.left}px`;
                        paper.style.bottom = `${paperData.bottom}px`; // Set final bottom
                        paper.style.top = 'auto'; 
                        paper.style.transform = `rotate(${paperData.rotation}deg)`;
                        paper.style.opacity = 1; // Set final opacity
                        // paper.style.transition = 'none'; // Keep this removed for now

                        // Append AFTER styling
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

            // Bounce off edges - Use stored dimensions from dataset
            const balloonWidth = parseFloat(balloon.dataset.width) || baseBalloonWidth; // Fallback to base
            const balloonHeight = parseFloat(balloon.dataset.height) || baseBalloonHeight; // Fallback to base

            // Left edge
            if (left < 0) {
                left = 0;
                dx = Math.abs(dx);
            }
            // Right edge
            if (left + balloonWidth > vw) {
                left = vw - balloonWidth;
                dx = -Math.abs(dx);
            }
            // Top edge
            if (top < 0) {
                top = 0;
                dy = Math.abs(dy);
            }
            // Bottom edge
            if (top + balloonHeight > vh) {
                top = vh - balloonHeight;
                dy = -Math.abs(dy);
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
            modalInput.value = count > 0 ? count : 30; // Default/current count (fallback 30)
            modalInput.max = "100"; 
            const inputLabel = modalOverlay.querySelector('p');
            if(inputLabel) inputLabel.textContent = "Enter a new number (1-100):";

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
            // Add check for > 100
            if (isNaN(newCount) || newCount <= 0 || newCount > 100 || !Number.isInteger(newCount)) {
                modalError.textContent = 'Please enter a whole number between 1 and 100.';
                modalInput.focus();
            } else {
                count = newCount;
                initialCountForIntensity = count; // Update intensity base
                setCookie(countCookieKey, count, 7);
                setCookie(initialCountIntensityCookieKey, initialCountForIntensity, 7);
                setCookie(initialTotalAssessmentsCookieKey, count, 365);
                localStorage.removeItem(landedPapersStorageKey);
                
                initializeState();
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
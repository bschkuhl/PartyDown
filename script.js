// Wait for the DOM to be fully loaded before running script logic
document.addEventListener('DOMContentLoaded', () => {

    // --- Get Element References ---
    const countdownButton = document.getElementById('countdown-button');
    const messageDiv = document.getElementById('message');
    const changeCountButton = document.getElementById('change-count-button');

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

    let count = parseInt(getCookie('countdownCount')) || 30;

    function updateDisplay() {
        // Check if elements exist before trying to modify them
        if (!countdownButton || !messageDiv) return;

        if (count <= 0) {
            countdownButton.style.display = 'none';
            messageDiv.textContent = 'You did it! 🎉';
            messageDiv.style.display = 'block';
            document.body.style.backgroundColor = '#fff';
        } else {
            countdownButton.textContent = count;
            countdownButton.style.display = 'inline-block';
            messageDiv.style.display = 'none';
            document.body.style.backgroundColor = '#333';
        }
    }

    // Initialize display on load
    updateDisplay();

    // --- Event Listeners ---

    // Make sure elements exist before adding listeners
    if (countdownButton) {
        countdownButton.addEventListener('click', () => {
            if (count <= 0) return;

            // Play a random sound
            const randomIndex = Math.floor(Math.random() * clapSounds.length);
            const selectedSound = clapSounds[randomIndex];
            try {
                const audio = new Audio(selectedSound);
                audio.play().catch(error => {
                    console.error(`Audio play failed for ${selectedSound}:`, error);
                });
            } catch (error) {
                console.error(`Failed to create Audio object for ${selectedSound}:`, error);
            }

            count--;
            setCookie('countdownCount', count, 7);
            updateDisplay();

            // Light up screen temporarily only if count > 0
            if (count > 0) {
                document.body.style.backgroundColor = '#fff';
                setTimeout(() => {
                    if (count > 0) {
                        document.body.style.backgroundColor = '#333';
                    }
                }, 200);
            }

            // Confetti
            const intensity = 1 - (count / 30);
            const particleCount = 50 + Math.floor(intensity * 250);
            const spread = 70 + Math.floor(intensity * 80);
            confetti({ particleCount: particleCount / 2, angle: 60, spread: spread, origin: { x: 0 } });
            confetti({ particleCount: particleCount / 2, angle: 120, spread: spread, origin: { x: 1 } });

            // Final blast
            if (count === 0) {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
                confetti({ particleCount: 150, spread: 120, origin: { y: 0.8 }, angle: 90 });
            }
        });
    }

    if (changeCountButton && modalOverlay && modalInput && modalCancel && modalSubmit && modalError) {
        // Listener for the change count button (opens modal)
        changeCountButton.addEventListener('click', () => {
            modalInput.value = count > 0 ? count : 30;
            modalError.textContent = '';
            modalOverlay.classList.remove('hidden');
            modalInput.focus();
        });

        // Listener for modal cancel button
        modalCancel.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });

        // Listener for modal submit button
        modalSubmit.addEventListener('click', () => {
            const newCountStr = modalInput.value;
            const newCount = parseInt(newCountStr);
            if (isNaN(newCount) || newCount <= 0 || !Number.isInteger(newCount)) {
                modalError.textContent = 'Please enter a positive whole number.';
                modalInput.focus();
            } else {
                count = newCount;
                setCookie('countdownCount', count, 7);
                updateDisplay();
                modalOverlay.classList.add('hidden');
                document.body.style.backgroundColor = '#333';
            }
        });

        // Optional: Close modal if clicking outside
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });

        // Optional: Allow submitting with Enter key
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
const countdownButton = document.getElementById('countdown-button');
const messageDiv = document.getElementById('message');

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

let count = parseInt(getCookie('countdownCount')) || 30; // Load count from cookie or default to 30
// let timerId = null; // No longer needed

function updateDisplay() {
    if (count <= 0) {
        countdownButton.style.display = 'none'; // Hide button
        messageDiv.textContent = 'You did it! 🎉';
        messageDiv.style.display = 'block'; // Show message
        document.body.style.backgroundColor = '#fff'; // Ensure background is white
    } else {
        countdownButton.textContent = count;
        countdownButton.style.display = 'inline-block'; // Ensure button is visible
        messageDiv.style.display = 'none'; // Hide message
         // Keep dark background unless count is 0
        document.body.style.backgroundColor = '#333';
    }
}

// Initialize display on load
updateDisplay();

// function startCountdown() { // No longer needed
//     if (timerId) return; // Prevent multiple timers

//     timerId = setInterval(() => {
//         count--;
//         countdownButton.textContent = count;

//         if (count <= 0) {
//             clearInterval(timerId);
//             countdownButton.style.display = 'none'; // Hide button
//             messageDiv.textContent = 'You did it! 🎉';
//             messageDiv.style.display = 'block'; // Show message
//             // Final big confetti blast
//             confetti({
//                 particleCount: 200,
//                 spread: 100,
//                 origin: { y: 0.6 }
//             });
//              confetti({
//                 particleCount: 150,
//                 spread: 120,
//                 origin: { y: 0.8 },
//                 angle: 90
//             });
//             document.body.style.backgroundColor = '#fff'; // Ensure background is white
//         }
//     }, 1000);
// }

countdownButton.addEventListener('click', () => {
    if (count <= 0) return; // Do nothing if already finished

    count--;
    setCookie('countdownCount', count, 7); // Save count to cookie for 7 days
    updateDisplay();

    // Light up screen temporarily only if count > 0 after decrementing
    if (count > 0) {
        document.body.style.backgroundColor = '#fff';
        setTimeout(() => {
            // Check again in case multiple rapid clicks brought count to 0
            if(count > 0) {
                 document.body.style.backgroundColor = '#333';
            }
        }, 200);
    }

    // Calculate confetti intensity based on proximity to zero
    const intensity = 1 - (count / 30); // Normalize count (0 to 1)
    const particleCount = 50 + Math.floor(intensity * 250); // More particles as count decreases (Increased multiplier)
    const spread = 70 + Math.floor(intensity * 80); // Wider spread as count decreases (Increased multiplier)

    // Confetti from the left
    confetti({
        particleCount: particleCount / 2,
        angle: 60,
        spread: spread,
        origin: { x: 0 }
    });
    // Confetti from the right
    confetti({
        particleCount: particleCount / 2,
        angle: 120,
        spread: spread,
        origin: { x: 1 }
    });

    // Special blast if count hits 0 on this click
    if (count === 0) {
         // Final big confetti blast
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 }
        });
            confetti({
            particleCount: 150,
            spread: 120,
            origin: { y: 0.8 },
            angle: 90
        });
    }
}); 
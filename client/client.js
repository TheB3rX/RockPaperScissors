// Establish a connection to the server using Socket.io
const sock = io();
var messageBody = document.getElementById('events');

/**
 * Write a text message to the element with ID 'message'.
 * @param {string} text - The text message to be displayed.
 */
const writeEvent = (text) => {
    const el = document.querySelector('#message');
    el.innerHTML = text;
}

/**
 * Set the inner HTML of a specified element.
 * @param {string} el - The CSS selector of the element.
 * @param {string} text - The text to be set as inner HTML.
 */
const setElement = (el, text) => {
    document.querySelector(el).innerHTML = text;
}

/**
 * Update the score for a specified player.
 * @param {number} score - The new score to display.
 * @param {number} idx - The index of the player (used in the element ID).
 */
const addPoint = (score, idx) => {
    
    const el = document.querySelector('#player' + idx + ' > .score');
    el.innerHTML = score;
}

/**
 * Update the streak score for a specified player.
 * @param {number} player - The player number.
 * @param {number} score - The streak score to display.
 */
const updateStreak = (player, score) => {
    const el = document.querySelector('#player' + player + ' > .streak > .streak-score');
    el.innerHTML = score;
}

/**
 * Event handler for 'ready' button submission.
 * Prevents the default form submission, sends a 'playerReady' event via socket,
 * and visually updates the interface to show readiness.
 * @param {Event} e - The event object.
 */
const onReadySubmitted = (e) => {
    e.preventDefault();

    const input = document.querySelector('#player-name');
    const playerName = input.value;
    input.value = '';

    var el = document.querySelector('.ready-wrapper');
    el.classList.add('player-ready');
    setTimeout(() => {
        document.querySelector('.ready-wrapper').classList.add('d-none');
        sock.emit('playerReady', playerName);
    }, 800)
}

/**
 * Start a countdown before the game starts and display it using writeEvent.
 */
const startCountdown = () => {
    let countdown = 3;
    writeEvent(`El juego comenzara en ${countdown} segundos`)
    const intervalId = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
            clearInterval(intervalId);
            writeEvent("Tiempo!")
        } else {
            writeEvent(`El juego comenzara en ${countdown} segundos`)
        }
    }, 1000);
}

/**
 * Add click event listeners to rock, paper, scissors buttons.
 * On click, it emits a 'turn' event via socket.
 */
const addButtonListeners = () => {
    ['rock', 'paper', 'scissors'].forEach((id) => {
        const button = document.getElementById(id);
        button.addEventListener('click', () => {
            clickBtn(button);
            sock.emit('turn', id);
        })
    });
}


/**
 * Handles the visual update when a button is clicked and starts the countdown.
 * @param {Element} btn - The button that was clicked.
 */
const clickBtn = (btn) => {
    let rps = ['rock', 'paper', 'scissors'];

    if (!btn.classList.contains('active')) {
        const idx = rps.indexOf(btn.id);
            rps.splice(idx, 1);
            rps.forEach((id) => {
                document.getElementById(id).classList.remove('active');
                btn.classList.add('active');
                sock.emit('startTimer')
                startCountdown()
            });
    }
}

/**
 * Prepare for the next round of the game by resetting the UI elements.
 */
const nextRound = () => {
    document.querySelector('.next-round-listener').classList.remove('underline');
    document.querySelector('#next-round').classList.remove('la-redo-alt');
    document.querySelector('#announcement').innerHTML = "";
    document.querySelector('.player-btns').classList.remove('player-loading');
    document.querySelector('.shoot-btns').classList.remove('choice-active');

    let el1 = document.querySelector('#p1-choice > i');
    let el2 = document.querySelector('#p2-choice > i');

    const prefix = "la-hand-";
    const classes1 = el1.className.split(" ").filter(c => !c.startsWith(prefix));
    const classes2 = el2.className.split(" ").filter(c => !c.startsWith(prefix));
    el1.className = classes1.join(" ").trim();
    el2.className = classes2.join(" ").trim();

    

    let rps = ['rock', 'paper', 'scissors'];
    rps.forEach((id) => {
        document.getElementById(id).classList.remove('active');
    });

    writeEvent("Escoge la opción");
}

// Socket.io event listeners for various game events
sock.on('message', writeEvent);
sock.on('setEl', setElement);
sock.on('addPoint', addPoint);
sock.on('updateStreak', updateStreak);
sock.on('startTimer', startCountdown)
sock.on('startNextRound', nextRound)


sock.on('winMessage', (text, p1, p2) => {

    document.querySelector('#p1-choice > i').classList.add('la-hand-' + p1);
    document.querySelector('#p2-choice > i').classList.add('la-hand-' + p2);
    
    document.querySelector('.player-btns').classList.add('player-loading');
    document.querySelector('.shoot-btns').classList.add('choice-active');


        document.querySelector('#announcement').innerHTML = text;
        document.querySelector('#message').innerHTML = "Siguiente ronda";
        document.querySelector('#next-round').classList.add('la-redo-alt');
        setTimeout(() => {
            document.querySelector('.next-round-listener').classList.add('underline');
            document.querySelector('.next-round-listener').addEventListener('click', nextRound);
            sock.emit('nextRoundInitiated')
        }, 3000);
});

sock.on('gameStarts', () => {
    document.querySelector('.game-wrapper').classList.remove('player-loading');
    writeEvent("Elige tu jugada");
})

sock.on('disconnect', () => {
    alert('Has sido desconectado, el numero de clientes maximo ha sido alcanzado, espera y vuelve a intentarlo mas tarde');
    window.close()
})

sock.on('refreshClients', () => {
    window.location.reload()
})
sock.on('winByDefault', () => {
    writeEvent("Ganaste la ronda porque tu oponente no respondió a tiempo.");
    setTimeout( () => {
        nextRound()
    },2000);
});

sock.on('loseByDefault', () => {
    writeEvent("Perdiste la ronda por no responder a tiempo.");
    setTimeout ( () => {
        nextRound()
    }, 2000);
});

sock.on('startCountdownClient', () => {
    startCountdown();
});
// Add event listener for the 'ready' form submission
document.querySelector('#ready-form').addEventListener('submit', onReadySubmitted);

// Call function to add button listeners
addButtonListeners();
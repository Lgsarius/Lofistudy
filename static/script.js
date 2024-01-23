document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.fas.fa-music, .fas.fa-clock, .far.fa-calendar-alt, .fas.fa-sticky-note, .fas.fa-cog').forEach(icon => {
        icon.addEventListener('click', function() {
            // Get the corresponding window
            var windowId = this.dataset.window;
            var window = document.getElementById(windowId);


            
            // Check if the window was found
            if (!window) {
                console.error('Could not find window with ID:', windowId);
                return;
            }

            // Show the window
            window.style.display = 'block';

            // Add a click event listener to the close button
            var closeButton = window.querySelector('.close-window');
            
            // Check if the close button was found
            if (!closeButton) {
                console.error('Could not find close button in window with ID:', windowId);
                return;
            }

            closeButton.addEventListener('click', function() {
                // Hide the window
                window.style.display = 'none';
            });

            // Get the window header
            var windowHeader = window.querySelector('.window-header');

            // Make the window draggable by the header
            // Get the window header
            windowHeader.addEventListener('mousedown', function(e) {
                var offsetX = e.clientX - window.getBoundingClientRect().left;
                var offsetY = e.clientY - window.getBoundingClientRect().top;
            
                function mouseMoveHandler(e) {
                    var newTop = e.clientY - offsetY;
                    var newLeft = e.clientX - offsetX;
                
            
                    // Überprüfen Sie die Grenzen und passen Sie die Position an, wenn das Fenster versucht, außerhalb des Viewports zu gehen
                    if (newLeft < 0) newLeft = 0;
                    if (newTop < 0) newTop = 0;
                    if (newLeft + window.getBoundingClientRect().width > document.documentElement.clientWidth) newLeft = document.documentElement.clientWidth - window.getBoundingClientRect().width;
                    if (newTop + window.getBoundingClientRect().height > document.documentElement.clientHeight) newTop = document.documentElement.clientHeight - window.getBoundingClientRect().height;
                
                    window.style.top = newTop + 'px';
                    window.style.left = newLeft + 'px';
                }
            
                document.addEventListener('mousemove', mouseMoveHandler);
            
                document.addEventListener('mouseup', function() {
                    document.removeEventListener('mousemove', mouseMoveHandler);
                }, { once: true });
            });
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth'
    });

    calendar.render();
});



const timer = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  sessions: 0,
};
document.addEventListener('DOMContentLoaded', (event) => {
let interval;

const buttonSoundPath = document.getElementById('button-sound-path').textContent;
const buttonSound = new Audio(buttonSoundPath);
const mainButton = document.getElementById('js-btn');
mainButton.addEventListener('click', () => {
  buttonSound.play();
  const { action } = mainButton.dataset;
  if (action === 'start') {
    startTimer();
  } else {
    stopTimer();
  }
});

const modeButtons = document.querySelector('#js-mode-buttons');
modeButtons.addEventListener('click', handleMode);

function getRemainingTime(endTime) {
  const currentTime = Date.parse(new Date());
  const difference = endTime - currentTime;

  const total = Number.parseInt(difference / 1000, 10);
  const minutes = Number.parseInt((total / 60) % 60, 10);
  const seconds = Number.parseInt(total % 60, 10);

  return {
    total,
    minutes,
    seconds,
  };
}

function startTimer() {
  let { total } = timer.remainingTime;
  const endTime = Date.parse(new Date()) + total * 1000;

  if (timer.mode === 'pomodoro') timer.sessions++;

  mainButton.dataset.action = 'stop';
  mainButton.textContent = 'stop';
  mainButton.classList.add('active');

  interval = setInterval(function() {
    timer.remainingTime = getRemainingTime(endTime);
    updateClock();

    total = timer.remainingTime.total;
    if (total <= 0) {
      console.log('ZEITENDE', total);
      clearInterval(interval);

      switch (timer.mode) {
        case 'pomodoro':
          if (timer.sessions % timer.longBreakInterval === 0) {
            switchMode('longBreak');
          } else {
            switchMode('shortBreak');
          }
          break;
        default:
          switchMode('pomodoro');
      }

      if (Notification.permission === 'granted') {
        const text =
          timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
        new Notification(text);
      }

      document.querySelector(`[data-sound="${timer.mode}"]`).play();

      startTimer();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);

  mainButton.dataset.action = 'start';
  mainButton.textContent = 'start';
  mainButton.classList.remove('active');
}

function updateClock() {
  const { remainingTime } = timer;
  const minutes = `${remainingTime.minutes}`.padStart(2, '0');
  const seconds = `${remainingTime.seconds}`.padStart(2, '0');

  const min = document.getElementById('js-minutes');
  const sec = document.getElementById('js-seconds');
  min.textContent = minutes;
  sec.textContent = seconds;

  const text =
    timer.mode === 'pomodoro' ? 'Get back to work!' : 'Take a break!';
  document.title = `${minutes}:${seconds} — ${text}`;

  const progress = document.getElementById('js-progress');
  progress.value = timer[timer.mode] * 60 - timer.remainingTime.total;
}

function switchMode(mode) {
  timer.mode = mode;
  timer.remainingTime = {
    total: timer[mode] * 60,
    minutes: timer[mode],
    seconds: 0,
  };

  document
    .querySelectorAll('button[data-mode]')
    .forEach(e => e.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  document.body.style.backgroundColor = `var(--${mode})`;
  document
    .getElementById('js-progress')
    .setAttribute('max', timer.remainingTime.total);

  updateClock();
}

function handleMode(event) {
  const { mode } = event.target.dataset;

  if (!mode) return;

  switchMode(mode);
  stopTimer();
}


  if ('Notification' in window) {
    if (
      Notification.permission !== 'granted' &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
          new Notification(
            'Awesome! You will be notified at the start of each session'
          );
        }
      });
    }
  }

  switchMode('pomodoro');
});
var editor;
document.addEventListener('DOMContentLoaded', function() {
    var editor = new EditorJS({
        holder: 'sticky-note-editorjs',
        tools: {
            header: {
                class: Header,
                inlineToolbar: ['link'],
                config: {
                    placeholder: 'Enter a header',
                    levels: [1, 2, 3, 4],
                    defaultLevel: 3
                },
                shortcut: 'CMD+SHIFT+H'
            },
            list: {
                class: List,
                inlineToolbar: true,
                shortcut: 'CMD+SHIFT+L'
            },
            quote: {
                class: Quote,
                inlineToolbar: true,
                config: {
                    quotePlaceholder: 'Enter a quote',
                    captionPlaceholder: 'Quote\'s author',
                },
                shortcut: 'CMD+SHIFT+O'
            },
            marker: {
                class: Marker,
                shortcut: 'CMD+SHIFT+M'
            },
            code: {
                class: CodeTool,
                shortcut: 'CMD+SHIFT+C'
            },
            checklist: {
                class: Checklist,
                inlineToolbar: true,
            },
          
        },
    });
});

function updateClock() {
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  if (hours < 10) hours = "0" + hours;
  if (minutes < 10) minutes = "0" + minutes;
  if (seconds < 10) seconds = "0" + seconds;
  document.getElementById('clockgroß').textContent = hours + ":" + minutes + ":" + seconds;
}

setInterval(updateClock, 1000);
document.addEventListener('DOMContentLoaded', function() {
  var videoSource = document.getElementById('video-source');
  var backgroundVideo = document.getElementById('background-video');
  var nextButton = document.getElementById('next-button');

  var videos = videoFiles;  // Use the videoFiles array passed from the template

  var currentVideoIndex = 0;

  nextButton.addEventListener('click', function() {
      currentVideoIndex = (currentVideoIndex + 1) % videos.length;  // Cycle through the videos
      videoSource.src = videos[currentVideoIndex];
      backgroundVideo.load();  // Load the new video
  });
});


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
            windowHeader.addEventListener('mousedown', handleDragStart);
windowHeader.addEventListener('touchstart', handleDragStart);

function handleDragStart(e) {
    var clientX = e.clientX || e.touches[0].clientX;
    var clientY = e.clientY || e.touches[0].clientY;

    var offsetX = clientX - window.getBoundingClientRect().left;
    var offsetY = clientY - window.getBoundingClientRect().top;

    function handleDragMove(e) {
        var clientX = e.clientX || e.touches[0].clientX;
        var clientY = e.clientY || e.touches[0].clientY;

        var newTop = clientY - offsetY;
        var newLeft = clientX - offsetX;

        // Überprüfen Sie die Grenzen und passen Sie die Position an, wenn das Fenster versucht, außerhalb des Viewports zu gehen
        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft + window.getBoundingClientRect().width > document.documentElement.clientWidth) newLeft = document.documentElement.clientWidth - window.getBoundingClientRect().width;
        if (newTop + window.getBoundingClientRect().height > document.documentElement.clientHeight) newTop = document.documentElement.clientHeight - window.getBoundingClientRect().height;

        window.style.top = newTop + 'px';
        window.style.left = newLeft + 'px';
    }

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);

    function handleDragEnd() {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('touchmove', handleDragMove);
    }

    document.addEventListener('mouseup', handleDragEnd, { once: true });
    document.addEventListener('touchend', handleDragEnd, { once: true });

            };
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
var sounds = [];

window.onload = function() {
  var songList = document.getElementById('song-list');
  for (let i = 0; i < musicFiles.length; i++) {
      var listItem = document.createElement('li');
      
      var pathname =  musicFiles[i];
      var filename = pathname.replace('/static/lofi/', '').replace('/static/chillbeat/', '').replace('.mp3', '');
      var decodedFilename;
      try {
          decodedFilename = decodeURIComponent(filename);
      } catch (e) {
          console.error('URIError: Failed to decode filename: ', filename);
          decodedFilename = filename; // Use the original filename if decoding fails
      }
      
      var songName = decodedFilename.replace(/\.mp3$/, ""); // Remove .mp3 extension
      
      listItem.textContent = songName;
      listItem.addEventListener('click', function() {
          sounds[currentSoundIndex].stop(); // Stop the current song
          currentSoundIndex = i; // Update the current song index to the selected song
          sounds[currentSoundIndex].play(); // Start playing the selected song
      });
      songList.appendChild(listItem);
  }
  sounds = musicFiles.map(function(file, index) {
    var sound = new Howl({
        src: [file],
        onend: function() {
            if (isShuffleEnabled) {
                // Select a random song
                currentSoundIndex = Math.floor(Math.random() * sounds.length);
            } else {
                // Play the next song
                currentSoundIndex = (index + 1) % sounds.length;
            }
            sounds[currentSoundIndex].play();
        }
    });
    return sound;
});


  var currentSoundIndex = 0;

  

  document.getElementById('music_next').addEventListener('click', function() {
    sounds[currentSoundIndex].stop();
    currentSoundIndex = (currentSoundIndex + 1) % sounds.length;
    sounds[currentSoundIndex].play();
});

  document.getElementById('music_prev').addEventListener('click', function() {
    sounds[currentSoundIndex].stop();
    currentSoundIndex = (currentSoundIndex - 1 + sounds.length) % sounds.length;
    sounds[currentSoundIndex].play();
});

  
  document.getElementById('volume_slider').addEventListener('input', function() {
    var volume = this.value;
    sounds.forEach(function(sound) {
        sound.volume(volume);
    });
});
var shuffleButton = document.getElementById('music_shuffle');
var isShuffleEnabled = false;

shuffleButton.addEventListener('click', function() {
    isShuffleEnabled = !isShuffleEnabled; // Toggle shuffle
    shuffleButton.classList.toggle('shuffle-enabled', isShuffleEnabled); // Toggle class

    if (isShuffleEnabled) {
        for (let i = sounds.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [sounds[i], sounds[j]] = [sounds[j], sounds[i]]; // Swap sounds[i] and sounds[j]
        }
    }
});
var progressSlider = document.getElementById('progress_slider');

sounds.forEach(function(sound) {
    sound.on('play', function() {
        progressSlider.max = sound.duration();
    });
});

progressSlider.addEventListener('input', function() {
    var seek = this.value;
    sounds[currentSoundIndex].seek(seek);
});

setInterval(function() {
    if (sounds[currentSoundIndex].playing()) {
        progressSlider.value = sounds[currentSoundIndex].seek();
    }
}, 1000);
var currentTimeElement = document.getElementById('current_time');
var totalTimeElement = document.getElementById('total_time');

sounds.forEach(function(sound) {
    sound.on('play', function() {
        progressSlider.max = sound.duration();
        var totalMinutes = Math.floor(sound.duration() / 60);
        var totalSeconds = Math.floor(sound.duration() % 60);
        if (totalSeconds < 10) totalSeconds = '0' + totalSeconds;
        totalTimeElement.textContent = totalMinutes + ':' + totalSeconds;
    });
});

setInterval(function() {
    if (sounds[currentSoundIndex].playing()) {
        progressSlider.value = sounds[currentSoundIndex].seek();
        var currentMinutes = Math.floor(sounds[currentSoundIndex].seek() / 60);
        var currentSeconds = Math.floor(sounds[currentSoundIndex].seek() % 60);
        if (currentSeconds < 10) currentSeconds = '0' + currentSeconds;
        currentTimeElement.textContent = currentMinutes + ':' + currentSeconds;
    }
}, 1000);
var trackNameElement = document.getElementById('track_name');

sounds.forEach(function(sound, index) {
  sound.on('play', function() {
      var pathname =  musicFiles[index];
      var filename = pathname.replace('/static/lofi/', '').replace('/static/chillbeat/', '').replace(/&/g, '').replace('.mp3', '').replace('%', '').replace('20', '');
      var decodedFilename = decodeURIComponent(filename);
      var songName = decodedFilename.replace(/\.mp3$/, ""); // Remove .mp3 extension
      trackNameElement.textContent = songName;
  });
});




var playPauseButton = document.getElementById('music_play_pause');
playPauseButton.addEventListener('click', function() {
    if (sounds[currentSoundIndex].playing()) {
        sounds[currentSoundIndex].pause();
        playPauseButton.innerHTML = '<i class="fas fa-play"></i>';  // Change button content to play icon
    } else {
        sounds[currentSoundIndex].play();
        playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';  // Change button content to pause icon
    }
});
document.getElementById('music_play').addEventListener('click', function() {
  sounds[currentSoundIndex].play();
});
document.getElementById('music_pause').addEventListener('click', function() {
  sounds[currentSoundIndex].pause();
});

};

document.addEventListener('DOMContentLoaded', (event) => {
  var modal = document.getElementById("loginModal");
  var span = document.getElementsByClassName("close")[0];

  span.onclick = function() {
      modal.style.display = "none";
  }
});



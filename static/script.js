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

document.addEventListener('DOMContentLoaded', function() {
  var backgroundVideo = document.getElementById('background-video');
  var wallpaperSelection = document.querySelectorAll('.wallaper-selection-image');

  wallpaperSelection.forEach(function(video) {
    video.addEventListener('click', function() {
      var newWallpaper = video.querySelector('source').src;

      // Setze die Opazität auf 0
      backgroundVideo.style.opacity = 0;

      // Warte auf das Ende der Übergangsanimation
      backgroundVideo.addEventListener('transitionend', function() {
        // Ändere das Video und lade es
        backgroundVideo.querySelector('source').src = newWallpaper;
        backgroundVideo.load();

        // Warte bis das Video geladen ist
        backgroundVideo.onloadeddata = function() {
          // Setze die Opazität zurück auf 1
          backgroundVideo.style.opacity = 1;
        };
      }, { once: true });
    });
  });
});



document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.fas.fa-music, .fas.fa-clock, .far.fa-calendar-alt, .fas.fa-sticky-note, .fas.fa-cog, .fas.fa-volume-up, .fas.fa-video, .fas.fa-link, .fas.fa-image').forEach(icon => {
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
  if (window.id === 'wallpaper-window') {
    return;
}
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
      initialView: 'dayGridMonth',
      events: '/calendar_events'  // Add this line
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
            'Awesome! You will be notified at the start of each Pomodoro session'
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

    var saveTimeout;
    editor.isReady.then(() => {
      editor.blocks.subscribe('change', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            editor.save().then((outputData) => {
                fetch('/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(outputData),
                })
            }).catch((error) => {
                console.log('Saving failed: ', error)
            });
        }, 2000);  // Save after 2 seconds of inactivity
    });
    fetch('/load', {
      method: 'GET',
  }).then(response => response.json()).then(data => {
      editor.render(data);
  }).catch((error) => {
      console.log('Loading failed: ', error)
  });
  });
} );

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
          decodedFilename = filename; // Use the original filename if decoding fails
      }
      
      var songName = decodedFilename.replace(/\.mp3$/, ""); // Remove .mp3 extension
      
      listItem.textContent = songName;
      listItem.addEventListener('click', function() {
          sounds[currentSoundIndex].stop(); // Stop the current song
          currentSoundIndex = i; // Update the current song index to the selected song
          sounds[currentSoundIndex].play(); // Start playing the selected song
          playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
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
window.addEventListener('DOMContentLoaded', (event) => {
  document.getElementById('music_play').addEventListener('click', function() {
      sounds[currentSoundIndex].play();
  });
});
window.addEventListener('DOMContentLoaded', (event) => {
document.getElementById('music_pause').addEventListener('click', function() {
  sounds[currentSoundIndex].pause();
});
});

};

document.addEventListener('DOMContentLoaded', (event) => {
  var modal = document.getElementById("loginModal");
  var span = document.getElementsByClassName("close")[0];
  var span = document.getElementById('mySpan'); 
  span.onclick = function() {
      modal.style.display = "none";
  }
});

document.addEventListener('DOMContentLoaded', (event) => {
  var youtubeUrlElement = document.getElementById('youtube-url');
  if (youtubeUrlElement) {
      youtubeUrlElement.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              var url = this.value;
              var videoId = url.split('v=')[1];
              var embedUrl = 'https://www.youtube.com/embed/' + videoId;
              document.getElementById('youtube-video').innerHTML = '<iframe width="560" height="315" src="' + embedUrl + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
          }
      });
  }
});


document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('url-input').addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
          var url = new URL(this.value);
          var faviconUrl = 'https://s2.googleusercontent.com/s2/favicons?domain=' + url.hostname;
          var urlList = document.getElementById('url-list');
          var urlItem = document.createElement('div');
          urlItem.className = 'url-item';
          urlItem.innerHTML = '<img src="' + faviconUrl + '" style="width: 32px; height: 32px; padding-right: 10px;"><a href="' + url.href + '" target="_blank">' + url.hostname + '</a><br><span>' + url.href + '</span>';
          urlList.appendChild(urlItem);
          this.value = '';
      }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  // Für das erste Icon
  document.getElementById('street-sound-icon').addEventListener('click', function() {
      const audioElement = document.getElementById('street-audio');
      audioElement.loop = true; // Set loop to true
      const imgElement = this.querySelector('img');
      if (audioElement.paused) {
          audioElement.play();
          imgElement.style.filter = 'brightness(0) invert(1)'; // Make SVG white
      } else {
          audioElement.pause();
          imgElement.style.filter = ''; // Reset SVG color
      }
  });

  // Für das zweite Icon
  document.getElementById('rain-sound-icon').addEventListener('click', function() {
      const audioElement = document.getElementById('rain-audio');
      audioElement.loop = true; // Set loop to true
      const imgElement = this.querySelector('img');
      if (audioElement.paused) {
          audioElement.play();
          imgElement.style.filter = 'brightness(0) invert(1)'; // Make SVG white
      } else {
          audioElement.pause();
          imgElement.style.filter = ''; // Reset SVG color
      }
  });

  // Für das dritte Icon
  document.getElementById('snow-sound-icon').addEventListener('click', function() {
      const audioElement = document.getElementById('snow-audio');
      audioElement.loop = true; // Set loop to true
      const imgElement = this.querySelector('img');
      if (audioElement.paused) {
          audioElement.play();
          imgElement.style.filter = 'brightness(0) invert(1)'; // Make SVG white
      } else {
          audioElement.pause();
          imgElement.style.filter = ''; // Reset SVG color
      }
  });

document.querySelectorAll('.win10-thumb').forEach(slider => {
  slider.addEventListener('input', function() {
      const audioElement = document.getElementById(this.id.replace('volume', 'audio'));
      audioElement.volume = this.value;
  });
});
});
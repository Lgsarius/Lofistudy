document.addEventListener("DOMContentLoaded", function () {
  function updateClock() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;
    document.getElementById("clockgroß").textContent =
      hours + ":" + minutes + ":" + seconds;
  }

  // Call the function once to display the time initially
  updateClock();

  // Then call the function every second to update the time
  setInterval(updateClock, 1000);
});

document.addEventListener("DOMContentLoaded", function () {
  var backgroundVideo = document.getElementById("background-video");
  var wallpaperSelection = document.querySelectorAll(
    ".wallaper-selection-image"
  );

  wallpaperSelection.forEach(function (video) {
    video.addEventListener("click", function () {
      var newWallpaper = video.querySelector("source").src;
      var newWallpapersave = video.querySelector("source").src.split("/").pop();

      // Save the selected wallpaper for the logged-in user
      fetch("/set_wallpaper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallpaper: newWallpapersave }),
      });

      // Set the opacity to 0
      backgroundVideo.style.opacity = 0;

      // Wait for the end of the transition animation
      backgroundVideo.addEventListener(
        "transitionend",
        function () {
          // Change the video and load it
          backgroundVideo.querySelector("source").src = newWallpaper;
          backgroundVideo.load();

          // Wait until the video is loaded
          backgroundVideo.onloadeddata = function () {
            // Set the opacity back to 1
            backgroundVideo.style.opacity = 1;
          };
        },
        { once: true }
      );
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelectorAll(
      ".fas.fa-music, .fas.fa-clock, .fas.fa-clipboard, .far.fa-calendar-alt, .fas.fa-sticky-note, .fas.fa-cog, .fas.fa-volume-up, .fas.fa-video, .fas.fa-link, .fas.fa-image, .fab.fa-soundcloud, .fas.fa-comments, .fas.fa-user-circle"
    )
    .forEach((icon) => {
      icon.addEventListener("click", function () {
        // Get the corresponding window
        var windowId = this.dataset.window;
        var window = document.getElementById(windowId);

        // Check if the window was found
        if (!window) {
          console.error("Could not find window with ID:", windowId);
          return;
        }

        // Show the window
        window.style.display = "block";

        // Add a click event listener to the close button
        var closeButton = window.querySelector(".close-window");

        // Check if the close button was found
        if (!closeButton) {
          console.error(
            "Could not find close button in window with ID:",
            windowId
          );
          return;
        }

        closeButton.addEventListener("click", function () {
          // Hide the window
          window.style.display = "none";
        });

        // Get the window header
        var windowHeader = window.querySelector(".window-header");

        // Make the window draggable by the header
        // Get the window header
        windowHeader.addEventListener("mousedown", handleDragStart);
        windowHeader.addEventListener("touchstart", handleDragStart);

        function handleDragStart(e) {
          if (window.id === "wallpaper-window") {
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
            if (
              newLeft + window.getBoundingClientRect().width >
              document.documentElement.clientWidth
            )
              newLeft =
                document.documentElement.clientWidth -
                window.getBoundingClientRect().width;
            if (
              newTop + window.getBoundingClientRect().height >
              document.documentElement.clientHeight
            )
              newTop =
                document.documentElement.clientHeight -
                window.getBoundingClientRect().height;

            window.style.top = newTop + "px";
            window.style.left = newLeft + "px";
          }

          document.addEventListener("mousemove", handleDragMove);
          document.addEventListener("touchmove", handleDragMove);

          function handleDragEnd() {
            document.removeEventListener("mousemove", handleDragMove);
            document.removeEventListener("touchmove", handleDragMove);
          }

          document.addEventListener("mouseup", handleDragEnd, { once: true });
          document.addEventListener("touchend", handleDragEnd, { once: true });
        }
      });
    });
});

const timer = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  sessions: 0,
};
document.addEventListener("DOMContentLoaded", (event) => {
  let interval;

  const buttonSoundPath =
    document.getElementById("button-sound-path").textContent;
  const buttonSound = new Audio(buttonSoundPath);
  const mainButton = document.getElementById("js-btn");
  mainButton.addEventListener("click", () => {
    buttonSound.play();
    const { action } = mainButton.dataset;
    if (action === "start") {
      startTimer();
    } else {
      stopTimer();
    }
  });

  const modeButtons = document.querySelector("#js-mode-buttons");
  modeButtons.addEventListener("click", handleMode);

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

    if (timer.mode === "pomodoro") timer.sessions++;
    mainButton.dataset.action = "stop";
    mainButton.textContent = "stop";
    mainButton.classList.add("active");

    interval = setInterval(function () {
      timer.remainingTime = getRemainingTime(endTime);
      updateClock();

      total = timer.remainingTime.total;
      if (total <= 0) {
        console.log("ZEITENDE", total);
        clearInterval(interval);

       

        switch (timer.mode) {
          case "pomodoro":
            timer.completedPomodoros++;
            if (timer.sessions % timer.longBreakInterval === 0) {
              switchMode("longBreak");
            } else {
              switchMode("shortBreak");
             
            }
            break;
          default:
            switchMode("pomodoro");
        }

        if (Notification.permission === "granted") {
          const text =
            timer.mode === "pomodoro" ? "Get back to work!" : "Take a break!";
          new Notification(text);
        }

        document.querySelector(`[data-sound="${timer.mode}"]`).play();

        startTimer();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(interval);

    mainButton.dataset.action = "start";
    mainButton.textContent = "start";
    mainButton.classList.remove("active");
  }

  function updateClock() {
    const { remainingTime } = timer;
    const minutes = `${remainingTime.minutes}`.padStart(2, "0");
    const seconds = `${remainingTime.seconds}`.padStart(2, "0");

    const min = document.getElementById("js-minutes");
    const sec = document.getElementById("js-seconds");
    min.textContent = minutes;
    sec.textContent = seconds;

    const text =
      timer.mode === "pomodoro" ? "Get back to work!" : "Take a break!";
    document.title = `${minutes}:${seconds} — ${text}`;

    const progress = document.getElementById("js-progress");
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
      .querySelectorAll("button[data-mode]")
      .forEach((e) => e.classList.remove("active"));
    document.querySelector(`[data-mode="${mode}"]`).classList.add("active");
    document.body.style.backgroundColor = `var(--${mode})`;
    document
      .getElementById("js-progress")
      .setAttribute("max", timer.remainingTime.total);

    updateClock();
  }

  function handleMode(event) {
    const { mode } = event.target.dataset;

    if (!mode) return;

    switchMode(mode);
    stopTimer();
  }

  if ("Notification" in window) {
    if (
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          new Notification(
            "Awesome! You will be notified at the start of each Pomodoro session"
          );
        }
      });
    }
  }

  switchMode("pomodoro");
});
var editor;
document.addEventListener("DOMContentLoaded", function () {
  editor = new EditorJS({
    holder: "sticky-note-editorjs",
    tools: {
      header: {
        class: Header,
        inlineToolbar: ["link"],
        config: {
          placeholder: "Enter a header",
          levels: [1, 2, 3, 4],
          defaultLevel: 3,
        },
        shortcut: "CMD+SHIFT+H",
      },
      list: {
        class: List,
        inlineToolbar: true,
        shortcut: "CMD+SHIFT+L",
      },
      quote: {
        class: Quote,
        inlineToolbar: true,
        config: {
          quotePlaceholder: "Enter a quote",
          captionPlaceholder: "Quote's author",
        },
        shortcut: "CMD+SHIFT+O",
      },
      marker: {
        class: Marker,
        shortcut: "CMD+SHIFT+M",
      },
      code: {
        class: CodeTool,
        shortcut: "CMD+SHIFT+C",
      },
      checklist: {
        class: Checklist,
        inlineToolbar: true,
      },
    },
  });
});

// Function to save the editor data
function saveEditorData() {
  editor
    .save()
    .then((outputData) => {
      fetch("/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(outputData),
      })
        .then(() => {
          console.log("Data saved");
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    })
    .catch((error) => {
      console.error("Saving failed: ", error);
    });
}
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("load-button").addEventListener("click", function () {
    fetch("/load", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        editor.isReady.then(() => {
          editor.render(data);
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("save-button")
    .addEventListener("click", saveEditorData);
});

document.addEventListener("DOMContentLoaded", (event) => {
  var youtubeUrlElement = document.getElementById("youtube-url");
  if (youtubeUrlElement) {
    youtubeUrlElement.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        var url = this.value;
        var videoId = url.split("v=")[1];
        var embedUrl = "https://www.youtube.com/embed/" + videoId;
        document.getElementById("youtube-video").innerHTML =
          '<iframe width="560" height="315" src="' +
          embedUrl +
          '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("url-input")
    .addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        var inputValue = this.value;
        if (
          !inputValue.startsWith("http://") &&
          !inputValue.startsWith("https://")
        ) {
          inputValue = "http://" + inputValue;
        }
        var url = new URL(inputValue);
        var faviconUrl =
          "https://s2.googleusercontent.com/s2/favicons?domain=" + url.hostname;
        var urlList = document.getElementById("url-list");
        var urlItem = document.createElement("div");
        urlItem.className = "url-item";
        urlItem.innerHTML =
          '<img src="' +
          faviconUrl +
          '" style="width: 32px; height: 32px; padding-right: 10px;"><a href="' +
          url.href +
          '" target="_blank">' +
          url.hostname +
          "</a><br><span>" +
          url.href +
          "</span>";
        urlList.appendChild(urlItem);
        this.value = "";
      }
    });
});

document.addEventListener("DOMContentLoaded", function () {
  // Für das erste Icon
  document
    .getElementById("street-sound-icon")
    .addEventListener("click", function () {
      const audioElement = document.getElementById("street-audio");
      audioElement.loop = true; // Set loop to true
      const imgElement = this.querySelector("img");
      if (audioElement.paused) {
        audioElement.play();
        imgElement.style.filter = "brightness(0) invert(1)"; // Make SVG white
      } else {
        audioElement.pause();
        imgElement.style.filter = ""; // Reset SVG color
      }
    });

  // Für das zweite Icon
  document
    .getElementById("rain-sound-icon")
    .addEventListener("click", function () {
      const audioElement = document.getElementById("rain-audio");
      audioElement.loop = true; // Set loop to true
      const imgElement = this.querySelector("img");
      if (audioElement.paused) {
        audioElement.play();
        imgElement.style.filter = "brightness(0) invert(1)"; // Make SVG white
      } else {
        audioElement.pause();
        imgElement.style.filter = ""; // Reset SVG color
      }
    });

  // Für das dritte Icon
  document
    .getElementById("snow-sound-icon")
    .addEventListener("click", function () {
      const audioElement = document.getElementById("snow-audio");
      audioElement.loop = true; // Set loop to true
      const imgElement = this.querySelector("img");
      if (audioElement.paused) {
        audioElement.play();
        imgElement.style.filter = "brightness(0) invert(1)"; // Make SVG white
      } else {
        audioElement.pause();
        imgElement.style.filter = ""; // Reset SVG color
      }
    });

  document.querySelectorAll(".win10-thumb").forEach((slider) => {
    slider.addEventListener("input", function () {
      const audioElement = document.getElementById(
        this.id.replace("volume", "audio")
      );
      audioElement.volume = this.value;
    });
  });
});

window.addEventListener("DOMContentLoaded", (event) => {
  // Show the first iframe
  var firstIframe = document.getElementById("soundcloud-1");
  if (firstIframe) {
    firstIframe.style.display = "block";
  }

  // When the select value changes
  document
    .getElementById("soundcloud-select")
    .addEventListener("change", function () {
      // Hide all iframes
      var iframes = document.querySelectorAll(".window-content iframe");
      for (var i = 0; i < iframes.length; i++) {
        iframes[i].style.display = "none";
      }

      window.addEventListener("DOMContentLoaded", (event) => {
        // Hide all iframes
        var iframes = document.querySelectorAll(".window-content iframe");
        for (var i = 0; i < iframes.length; i++) {
          iframes[i].style.display = "none";
        }

        // Show the first iframe
        var firstIframe = document.getElementById("soundcloud-1");
        if (firstIframe) {
          firstIframe.style.display = "block";
        }
      }); // Show the selected iframe
      var selectedIframe = document.getElementById(this.value);
      if (selectedIframe) {
        selectedIframe.style.display = "block";
      }
    });
});

window.addEventListener("DOMContentLoaded", (event) => {
  var script = document.createElement("script");
  script.src = "https://w.soundcloud.com/player/api.js";
  document.body.appendChild(script);

  // Wait for the API script to load before using it
  window.onload = function () {
    // Get the volume input and the SoundCloud embeds
    var volumeInput = document.getElementById("volume");
    var soundcloudEmbeds = [
      SC.Widget(document.getElementById("soundcloud-1")),
      SC.Widget(document.getElementById("soundcloud-2")),
      SC.Widget(document.getElementById("soundcloud-3")),
    ];

    // Function to set the volume of the SoundCloud embeds
    function setVolume() {
      var volume = parseInt(volumeInput.value, 10); // Convert to a number between 0 and 100
      soundcloudEmbeds.forEach(function (embed) {
        embed.setVolume(volume);
      });
    }

    // Set the volume when the input changes
    volumeInput.addEventListener("input", setVolume);

    // Set the initial volume
    setVolume();
  };
});

document.addEventListener("DOMContentLoaded", function() {
document.getElementById('chat-form').addEventListener('submit', function(event) {
  event.preventDefault();
  var userInput = document.getElementById('user-input').value;
  fetch('/chat', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({message: userInput}),
  })
  .then(response => response.json())
  .then(data => {
      var chatOutput = document.getElementById('chat-output');
      chatOutput.innerHTML += '<p>User: ' + userInput + '</p>';
      chatOutput.innerHTML += '<p>ChatGPT: ' + data.response + '</p>';
  })
  .catch((error) => {
      console.error('Error:', error);
  });
});
});


document.addEventListener('DOMContentLoaded', (event) => {
  const deleteAccountForm = document.querySelector('form[data-url="{{ url_for(\'delete_account\') }}"]');
  if (deleteAccountForm) {
      const deleteAccountButton = deleteAccountForm.querySelector('button[type="submit"]');
      deleteAccountButton.addEventListener('click', function(event) {
          event.preventDefault();
          Swal.fire({
              title: 'Are you sure?',
              text: "You won't be able to revert this!",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Yes, delete it!'
          }).then((result) => {
              if (result.isConfirmed) {
                  deleteAccountForm.submit();
              }
          })
      });
  }
});
var tasks = [];
document.addEventListener("DOMContentLoaded", function() {
document.getElementById('add-task-btn').addEventListener('click', function() {
  document.getElementById('task-form').style.display = 'block';
});

document.getElementById('save-task-btn').addEventListener('click', function() {
  var taskName = document.getElementById('task-name').value;
  var pomodoroCount = document.getElementById('pomodoro-count').value;
  

  // Add the new task to the tasks array
  tasks.push({
    name: taskName,
    totalPomodoros: pomodoroCount,
    completedPomodoros: 0,
  });

  // Clear the tasks list
  document.getElementById('tasks-list').innerHTML = '';

  // Re-render the tasks
  tasks.forEach(function(task, index) {
    var taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.dataset.index = index;
    taskElement.innerHTML = `
      <span>${task.name} - ${task.completedPomodoros}/${task.totalPomodoros}</span>
      <div class="task-menu">...</div>
    `;

    document.getElementById('tasks-list').appendChild(taskElement);
  });

  document.getElementById('task-form').style.display = 'none';
  document.getElementById('task-name').value = '';
  document.getElementById('pomodoro-count').value = '';
});

document.addEventListener('click', function(e) {
  if (e.target && e.target.className == 'task-menu') {
    var index = parseInt(e.target.parentNode.dataset.index);
    var task = tasks[index];

    var taskName = prompt('Edit Task Name', task.name);
    var pomodoroCount = prompt('Edit Pomodoro Count', task.totalPomodoros);

    task.name = taskName;
    task.totalPomodoros = parseInt(pomodoroCount);

    e.target.previousSibling.textContent = `${taskName} - ${task.completedPomodoros}/${pomodoroCount}`;
  }
});
});

document.addEventListener("DOMContentLoaded", function() {
document.getElementById('fullscreen-btn').addEventListener('click', function() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen(); 
    }
  }
});
});
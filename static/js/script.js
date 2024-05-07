document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    document.getElementById("loadingScreen").style.display = "none";
  }, 5000);
});
document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('.wallaper-selection');
  var leftArrow = document.querySelector('.scroll-arrow.left');
  var rightArrow = document.querySelector('.scroll-arrow.right');

  container.addEventListener('wheel', function(e) {
      if (e.deltaY != 0) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
      }
  });

  leftArrow.addEventListener('click', function() {
      container.scrollLeft -= 400; // Adjust this value as needed
  });

  rightArrow.addEventListener('click', function() {
      container.scrollLeft += 400; // Adjust this value as needed
  });
});

document.addEventListener('DOMContentLoaded', function() {
  var container = document.querySelector('.wallaper-selection');
  var startX, scrollLeft;

  container.addEventListener('mousedown', function(e) {
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.classList.add('active');
      e.preventDefault();
  });

  container.addEventListener('mouseleave', function() {
      container.classList.remove('active');
  });

  container.addEventListener('mouseup', function() {
      container.classList.remove('active');
  });


  876
  container.addEventListener('mousemove', function(e) {
      if (!container.classList.contains('active')) return;
      var x = e.pageX - container.offsetLeft;
      var walk = (x - startX) * 1; //scroll-fast
      container.scrollLeft = scrollLeft - walk;
  });
});

document.addEventListener("DOMContentLoaded", function () {
  var backgroundVideo = document.getElementById("background-video");
  var wallpaperSelection = document.querySelectorAll(
    ".wallaper-selection-image"
  );
  var checkbox = document.getElementById("backgroundSwitch");

  function showVideoBackground() {
    backgroundVideo.style.display = "block";
    wallpaperSelection.forEach(function (wallpaper) {
      wallpaper.style.display = "none";
    });
  }

  function showWallpapers() {
    backgroundVideo.style.display = "none";
    wallpaperSelection.forEach(function (wallpaper) {
      wallpaper.style.display = "block";
    });
  }

  checkbox.addEventListener("change", function () {
    if (checkbox.checked) {
      showVideoBackground();
    } else {
      showWallpapers();
    }
  });

  // Initially set the background based on the checkbox state
  if (checkbox.checked) {
    showVideoBackground();
  } else {
    showWallpapers();
  }

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


var highestZIndex = 0;
document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelectorAll(
      ".fas.fa-music, .fas.fa-clock, .fas.fa-clipboard, .far.fa-calendar-alt, .fas.fa-sticky-note, .fas.fa-cog, .fas.fa-trophy, .fas.fa-volume-up, .fas.fa-video, .fas.fa-link, .fas.fa-image, .fab.fa-soundcloud, .fas.fa-comments, .fas.fa-user-circle"
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
        highestZIndex++;
        window.style.zIndex = highestZIndex;
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
          highestZIndex++;
          window.style.zIndex = highestZIndex;
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
            // Send a POST request to the Flask server
            fetch("/update_pomodoros", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}), // No need to send any data
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  console.log("Pomodoros updated successfully!");
                } else {
                  console.log("Failed to update pomodoros.");
                }
              });
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
          '<iframe style="clear: both; display: block" width="560" height="515" src="' +
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
    document
    .getElementById("wind2-icon")
    .addEventListener("click", function () {
      const audioElement = document.getElementById("wind2-audio");
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

    document
    .getElementById("ocean-icon")
    .addEventListener("click", function () {
      const audioElement = document.getElementById("ocean-audio");
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

  window.onload = function () {
    var volumeInput = document.getElementById("volume");
    var soundcloudEmbeds = [
      SC.Widget(document.getElementById("soundcloud-1")),
      SC.Widget(document.getElementById("soundcloud-2")),
      SC.Widget(document.getElementById("soundcloud-3")),
      SC.Widget(document.getElementById("soundcloud-4")),
      SC.Widget(document.getElementById("soundcloud-5")),
      SC.Widget(document.getElementById("soundcloud-6")),
      SC.Widget(document.getElementById("soundcloud-7")),
      SC.Widget(document.getElementById("soundcloud-8")),
      SC.Widget(document.getElementById("soundcloud-9")),
      SC.Widget(document.getElementById("soundcloud-10")),
    ];

    var currentIndex = 0; // Keep track of the current embed

    function setVolume() {
      var volume = parseInt(volumeInput.value, 10);
      soundcloudEmbeds.forEach(function (embed) {
        embed.setVolume(volume);
      });
    }

    function next() {
      soundcloudEmbeds[currentIndex].isPaused((isPaused) => {
        if (!isPaused) {
          soundcloudEmbeds[currentIndex].next();
        } else {
          currentIndex = (currentIndex + 1) % soundcloudEmbeds.length;
          soundcloudEmbeds[currentIndex].play();
        }
      });
    }

    volumeInput.addEventListener("input", setVolume);

    setVolume();
  };
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("chat-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      var userInput = document.getElementById("user-input").value;
      fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userInput }),
      })
        .then((response) => response.json())
        .then((data) => {
          var chatOutput = document.getElementById("chat-output");
          chatOutput.innerHTML += "<p>User: " + userInput + "</p>";
          chatOutput.innerHTML += "<p>ChatGPT: " + data.response + "</p>";
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
});

function confirmDelete() {
  Swal.fire({
    title: "Are you sure?",
    text: "Are you sure you want to delete your Lofi Study account? This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete my Lofi Study account!",
    customClass: {
      popup: "my-popup",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      fetch("/delete_account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          // Wenn die Antwort eine Umleitung ist, leiten Sie die Seite zu der neuen URL um
          if (response.redirected) {
            window.location.href = response.url;
          }
        })
        .catch((error) => {
          console.error(
            "There has been a problem with your fetch operation:",
            error
          );
        });
    }
  });
}
var tasks = [];

document.addEventListener("DOMContentLoaded", function () {
  function fetchTasks() {
    fetch("/get-tasks")
      .then((response) => response.json())
      .then((data) => {
        console.log(data.tasks); // Debug line
        tasks = data.tasks.map((task) => ({
          id: task.id,
          name: task.name,
          completed: task.completed,
        }));
        renderTasks();
      });
  }
  fetchTasks();

  document
    .getElementById("add-task-btn")
    .addEventListener("click", function () {
      document.getElementById("task-form").style.display = "block";
    });

  document
    .getElementById("save-task-btn")
    .addEventListener("click", function () {
      var taskName = document.getElementById("task-name").value;
      var pomodoroCount = document.getElementById("pomodoro-count").value;
      var username = document.getElementById("username").value;

      fetch("/add-task", {
        method: "POST",
        body: JSON.stringify({
          name: taskName,
          totalPomodoros: pomodoroCount,
          user_username: username,
        }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            tasks.push({
              id: data.id,
              name: taskName,
              totalPomodoros: pomodoroCount,
              completedPomodoros: 0,
            });

            document.getElementById("tasks-list").innerHTML = "";
            renderTasks();
          }
        });

      document.getElementById("task-form").style.display = "none";
      document.getElementById("task-name").value = "";
      document.getElementById("pomodoro-count").value = "";
    });

  function renderTasks() {
    console.log(tasks); // Debug line
    tasks.forEach(function (task) {
      var taskElement = document.createElement("div");
      taskElement.className = "task";
      taskElement.dataset.id = task.id;

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = task.completed;
      console.log(`Initial completed status: ${task.completed}`); // Debug line
      checkbox.addEventListener("change", function () {
        taskElement.querySelector(".task-name").style.textDecoration = this
          .checked
          ? "line-through"
          : "none";
//
        var id = parseInt(taskElement.dataset.id);
        fetch(`/edit-task/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            completed: this.checked,
          }),
          headers: { "Content-Type": "application/json" },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              var task = tasks.find((task) => task.id === id);
              task.completed = this.checked;
              console.log(`Updated completed status: ${task.completed}`); // Debug line
            }
          });
      });

      var taskName = document.createElement("span");
      taskName.className = "task-name";
      taskName.textContent = task.name;
      taskName.style.textDecoration = task.completed ? "line-through" : "none";

      var taskMenu = document.createElement("div");
      taskMenu.className = "task-menu";
      taskMenu.textContent = "...";
      var trashCan = document.createElement("span");
      trashCan.className = "task-delete";
      trashCan.textContent = "🗑️";
      trashCan.addEventListener("click", function () {
        var id = Number(this.parentNode.dataset.id); // Convert id to a number
        fetch(`/delete-task/${id}`, { method: "DELETE" })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              tasks = tasks.filter((task) => task.id !== id);
              document.getElementById("tasks-list").innerHTML = "";
              renderTasks();
            }
          });
      });

      taskElement.appendChild(checkbox);
      taskElement.appendChild(trashCan);
      taskElement.appendChild(taskName);
      taskElement.appendChild(taskMenu);

      document.getElementById("tasks-list").appendChild(taskElement);
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target && e.target.className == "task-menu") {
      var id = parseInt(e.target.parentNode.dataset.id);
      var task = tasks.find((task) => task.id === id);

      var taskName = prompt("Edit Task Name", task.name);

      if (taskName !== null) {
        fetch(`/edit-task/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: taskName,
          }),
          headers: { "Content-Type": "application/json" },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              task.name = taskName;
              e.target.previousSibling.textContent = `${taskName} `;
            }
          });
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("fullscreen-btn")
    .addEventListener("click", function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector(".dropdown-button")
    .addEventListener("click", function () {
      var dropdownMenu = this.nextElementSibling;
      dropdownMenu.classList.toggle("active");
    });
});

document.addEventListener("DOMContentLoaded", (event) => {
  document
    .querySelector('a[href="/about"]')
    .addEventListener("click", function (event) {
      event.preventDefault();
      document.getElementById("about-us").classList.add("active");
    });
});

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("close-button")
    .addEventListener("click", function () {
      document.getElementById("about-us").classList.remove("active");
    });
});
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("twitter-box").addEventListener("click", function () {
    window.open("https://twitter.com/lofistudy", "_blank");
  });
});
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("instagram-box")
    .addEventListener("click", function () {
      window.open("https://instagram.com/lofistudy", "_blank");
    });
});
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("email-box").addEventListener("click", function () {
    window.location.href = "mailto:support@mousewerk.de";
  });
});
document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector("#leaderboard-window")
    .addEventListener("click", function () {
      fetch("/api/leaderboard")
        .then((response) => response.json())
        .then((data) => {
          let leaderboardHTML = "";
          data.forEach((user, index) => {
            if (index === 0) {
              // If the user is the first in the list
              leaderboardHTML += `<li><i class="fas fa-crown"></i><span class="first-place">${user.charactername} </span>: ${user.pomodoro_time_count}</li>`;
            } else if (index === 1) {
              leaderboardHTML += `<li><span class="second-place">${user.charactername} </span>: ${user.pomodoro_time_count}</li>`;
            } else if (index === 2) {
              leaderboardHTML += `<li><span class="third-place">${user.charactername} </span>: ${user.pomodoro_time_count}</li>`;
            } else {
              leaderboardHTML += `<li>${user.charactername}: ${user.pomodoro_time_count}</li>`;
            }
          });
          document.querySelector(
            "#leaderboard-window .window-content ul"
          ).innerHTML = leaderboardHTML;
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
  function changeAudioSource(selectElement) {
    var audioElements = ["pomodoroAudio", "shortBreakAudio", "longBreakAudio"];
    audioElements.forEach(function (id) {
      var audioElement = document.getElementById(id);
      audioElement.src =
        "{{ url_for('static', filename='" + selectElement.value + "') }}";
    });
  }
});



  document.addEventListener("DOMContentLoaded", function () {

    fetch('/pomo_data')
      .then(response => response.json())
      .then(data => {
        // Get the context of the canvas element we want to select
        var ctxBar = document.getElementById('PomodorChart').getContext('2d');
        var ctxPie = document.getElementById('PomodorPieChart').getContext('2d');
    
        // Check if data is empty, if so, provide example data
        var labels = data.months.length > 0 ? data.months : ['January', 'February', 'March', 'April', 'May'];
        var pomodors = data.pomodors.length > 0 ? data.pomodors : [83, 100, 23, 45, 52];
    
        // Create the bar chart
        var myBarChart = new Chart(ctxBar, {
          type: 'bar',
          data: {
            labels: labels, // Months from your data
            datasets: [{
              label: '# of Pomodors',
              data: pomodors, // Pomodors from your data
              backgroundColor: '#F3A953',
              borderColor: '#F3A953',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: 'white' // changes the color of the scale text
                }
              },
              x: {
                ticks: {
                  color: 'white' // changes the color of the scale text
                }
              }
            },
            plugins: {
              legend: {
                display: false // hides the legend
              }
            }
          }
        });
    
        // Create the pie chart
        var myPieChart = new Chart(ctxPie, {
          type: 'pie',
          data: {
            labels: ['Data 1', 'Data 2', 'Data 3', 'Data 4'], // Your four data strings
            datasets: [{
              data: [25, 25, 25, 25], // Each data string is 25% of the pie
              backgroundColor: ['#F3A953', '#4BC0C0', '#FFCE56', '#E7E9ED'], // Four different colors
              borderColor: ['#F3A953', '#4BC0C0', '#FFCE56', '#E7E9ED'], // Same as the background colors
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: 'white' // changes the color of the legend text
                }
              }
            }
          }
        });
      });
    });
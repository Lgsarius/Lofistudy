document.addEventListener('DOMContentLoaded', function() {
  setupWatchCheckbox();
  setupBigClock();
  setupLoadingScreen();
  setupWallpaperSelection();
  setupDraggableWindows();
  setupVideoToggle();
  setupVolumeToggle();
  setupIconClickHandlers();
  setupSoundcloudIframes();
  setupChatForm();
  setupConfirmDelete();
  setupTasks();
  setupFullscreenButton();
  setupDropdownMenu();
  setupAboutUsModal();
  setupSocialLinks();
  setupLeaderboard();
  setupAudioSourceChange();
});

function setupWatchCheckbox() {
  document.getElementById('watchCheckbox').addEventListener('change', function() {
      var bigClock = document.getElementById('bigclock');
      bigClock.style.display = this.checked ? 'block' : 'none';
  });
}

function setupBigClock() {
  function updateBIGClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeString = `${hours}:${minutes}:${seconds}`;
      document.getElementById('bigclock').textContent = timeString;
  }

  updateBIGClock(); // Initial update
  setInterval(updateBIGClock, 1000); // Update every second
}

function setupLoadingScreen() {
  setTimeout(function() {
      document.getElementById("loadingScreen").style.display = "none";
  }, 5000);
}

function setupWallpaperSelection() {
  const container = document.querySelector('.wallaper-selection');
  const leftArrow = document.querySelector('.scroll-arrow.left');
  const rightArrow = document.querySelector('.scroll-arrow.right');

  container.addEventListener('wheel', function(e) {
      if (e.deltaY != 0) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
      }
  });

  leftArrow.addEventListener('click', function() {
      container.scrollLeft -= 400;
  });

  rightArrow.addEventListener('click', function() {
      container.scrollLeft += 400;
  });

  let startX, scrollLeft;

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

  container.addEventListener('mousemove', function(e) {
      if (!container.classList.contains('active')) return;
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX);
      container.scrollLeft = scrollLeft - walk;
  });

  const backgroundVideo = document.getElementById("background-video");
  document.querySelectorAll(".wallaper-selection-image").forEach(function(video) {
      video.addEventListener("click", function() {
          const newWallpaper = video.querySelector("source").src;
          const newWallpapersave = video.querySelector("source").src.split("/").pop();

          fetch("/set_wallpaper", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ wallpaper: newWallpapersave }),
          });

          backgroundVideo.style.transition = "opacity 0.5s";
          backgroundVideo.style.opacity = 0;

          backgroundVideo.addEventListener("transitionend", function() {
              const source = backgroundVideo.querySelector("source");
              source.src = newWallpaper;
              backgroundVideo.load();

              backgroundVideo.onloadeddata = function() {
                  backgroundVideo.style.opacity = 1;
              };

              backgroundVideo.onerror = function() {
                  console.error("Error loading the new video:", source.src);
              };
          }, { once: true });
      });
  });
}

function setupDraggableWindows() {
  let highestZIndex = 0;

  document.querySelectorAll(
      ".fas.fa-music, .fas.fa-clock, .fas.fa-clipboard, .far.fa-calendar-alt, .fas.fa-sticky-note, .fas.fa-cog, .fas.fa-trophy, .fas.fa-volume-up, .fas.fa-video, .fas.fa-link, .fas.fa-image, .fas.fa-chart-bar, .fab.fa-soundcloud, .fas.fa-comments, .fas.fa-user-circle, .fas.fa-info-circle"
  ).forEach((icon) => {
      icon.addEventListener("click", function() {
          const windowId = this.dataset.window;
          const window = document.getElementById(windowId);

          if (!window) {
              console.error("Could not find window with ID:", windowId);
              return;
          }

          window.style.display = "block";
          highestZIndex++;
          window.style.zIndex = highestZIndex;

          const closeButton = window.querySelector(".close-window");

          if (!closeButton) {
              console.error("Could not find close button in window with ID:", windowId);
              return;
          }

          closeButton.addEventListener("click", function() {
              window.style.display = "none";
          });

          const windowHeader = window.querySelector(".window-header");

          windowHeader.addEventListener("mousedown", handleDragStart);
          windowHeader.addEventListener("touchstart", handleDragStart);

          function handleDragStart(e) {
              if (window.id === "wallpaper-window") {
                  return;
              }
              highestZIndex++;
              window.style.zIndex = highestZIndex;
              const clientX = e.clientX || e.touches[0].clientX;
              const clientY = e.clientY || e.touches[0].clientY;

              const offsetX = clientX - window.getBoundingClientRect().left;
              const offsetY = clientY - window.getBoundingClientRect().top;

              function handleDragMove(e) {
                  const clientX = e.clientX || e.touches[0].clientX;
                  const clientY = e.clientY || e.touches[0].clientY;

                  let newTop = clientY - offsetY;
                  let newLeft = clientX - offsetX;

                  if (newLeft < 0) newLeft = 0;
                  if (newTop < 0) newTop = 0;
                  if (newLeft + window.getBoundingClientRect().width > document.documentElement.clientWidth)
                      newLeft = document.documentElement.clientWidth - window.getBoundingClientRect().width;
                  if (newTop + window.getBoundingClientRect().height > document.documentElement.clientHeight)
                      newTop = document.documentElement.clientHeight - window.getBoundingClientRect().height;

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
}

function setupVideoToggle() {
  document.getElementById("video-switch").addEventListener("change", toggleVideo);
}

function toggleVideo() {
  const checkbox = document.getElementById("video-switch");
  const localVideo = document.getElementById("background-video");
  const youtubeVideo = document.getElementById("youtube-bg-video");

  if (checkbox.checked) {
      localVideo.style.display = "none";
      youtubeVideo.style.display = "block";
  } else {
      localVideo.style.display = "block";
      youtubeVideo.style.display = "none";
  }
}

function setupVolumeToggle() {
  document.getElementById("volumeToggle").addEventListener("change", toggleVolume);
}

function toggleVolume() {
  const video = document.getElementById("youtube-bg-video");
  const volumeToggle = document.getElementById("volumeToggle");

  if (volumeToggle.checked) {
      video.src = video.src.replace("&mute=1", ""); // Remove mute parameter
  } else {
      video.src += "&mute=1"; // Add mute parameter
  }
}

function adjustVolume(volume) {
  const iframe = document.getElementById("youtube-bg-video");
  const player = new YT.Player(iframe, {
      events: {
          'onReady': function(event) {
              event.target.setVolume(volume);
          }
      }
  });
}

function setupIconClickHandlers() {
  document.querySelectorAll(".win10-thumb").forEach((slider) => {
      slider.addEventListener("input", function() {
          const audioElement = document.getElementById(this.id.replace("volume", "audio"));
          audioElement.volume = this.value;
      });
  });

  setupSoundIcon("street-sound-icon", "street-audio");
  setupSoundIcon("rain-sound-icon", "rain-audio");
  setupSoundIcon("snow-sound-icon", "snow-audio");
  setupSoundIcon("wind2-icon", "wind2-audio");
  setupSoundIcon("ocean-icon", "ocean-audio");
}

function setupSoundIcon(iconId, audioId) {
  document.getElementById(iconId).addEventListener("click", function() {
      const audioElement = document.getElementById(audioId);
      audioElement.loop = true;
      const imgElement = this.querySelector("img");
      if (audioElement.paused) {
          audioElement.play();
          imgElement.style.filter = "brightness(0) invert(1)";
      } else {
          audioElement.pause();
          imgElement.style.filter = "";
      }
  });
}

function setupSoundcloudIframes() {
  const soundcloudSelect = document.getElementById("soundcloud-select");
  if (soundcloudSelect) {
      soundcloudSelect.addEventListener("change", function() {
          document.querySelectorAll(".window-content iframe").forEach(iframe => iframe.style.display = "none");
          const selectedIframe = document.getElementById(this.value);
          if (selectedIframe) selectedIframe.style.display = "block";
      });
  }
}

function setupChatForm() {
  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
      chatForm.addEventListener("submit", function(event) {
          event.preventDefault();
          const userInput = document.getElementById("user-input").value;
          fetch("/chat", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ message: userInput }),
          })
          .then((response) => response.json())
          .then((data) => {
              const chatOutput = document.getElementById("chat-output");
              chatOutput.innerHTML += `<p>User: ${userInput}</p><p>ChatGPT: ${data.response}</p>`;
          })
          .catch((error) => console.error("Error:", error));
      });
  }
}

function setupConfirmDelete() {
  document.getElementById("delete-account-btn").addEventListener("click", confirmDelete);
}

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
              if (!response.ok) throw new Error("Network response was not ok");
              if (response.redirected) window.location.href = response.url;
          })
          .catch((error) => console.error("There has been a problem with your fetch operation:", error));
      }
  });
}

function setupTasks() {
  fetchTasks();

  document.getElementById("add-task-btn").addEventListener("click", function() {
      document.getElementById("task-form").style.display = "block";
  });

  document.getElementById("save-task-btn").addEventListener("click", function() {
      const taskName = document.getElementById("task-name").value;
      const pomodoroCount = document.getElementById("pomodoro-count").value;
      const username = document.getElementById("username").value;

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

  document.addEventListener("click", function(e) {
      if (e.target && e.target.className === "task-menu") {
          const id = parseInt(e.target.parentNode.dataset.id);
          const task = tasks.find((task) => task.id === id);

          const taskName = prompt("Edit Task Name", task.name);

          if (taskName !== null) {
              fetch(`/edit-task/${id}`, {
                  method: "PUT",
                  body: JSON.stringify({ name: taskName }),
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
}

function fetchTasks() {
  fetch("/get-tasks")
  .then((response) => response.json())
  .then((data) => {
      tasks = data.tasks.map((task) => ({
          id: task.id,
          name: task.name,
          completed: task.completed,
      }));
      renderTasks();
  });
}

function renderTasks() {
  tasks.forEach(function(task) {
      const taskElement = document.createElement("div");
      taskElement.className = "task";
      taskElement.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", function() {
          taskElement.querySelector(".task-name").style.textDecoration = this.checked ? "line-through" : "none";
          const id = parseInt(taskElement.dataset.id);
          fetch(`/edit-task/${id}`, {
              method: "PUT",
              body: JSON.stringify({ completed: this.checked }),
              headers: { "Content-Type": "application/json" },
          })
          .then((response) => response.json())
          .then((data) => {
              if (data.success) {
                  const task = tasks.find((task) => task.id === id);
                  task.completed = this.checked;
              }
          });
      });

      const taskName = document.createElement("span");
      taskName.className = "task-name";
      taskName.textContent = task.name;
      taskName.style.textDecoration = task.completed ? "line-through" : "none";

      const taskMenu = document.createElement("div");
      taskMenu.className = "task-menu";
      taskMenu.textContent = "...";
      const trashCan = document.createElement("span");
      trashCan.className = "task-delete";
      trashCan.textContent = "🗑️";
      trashCan.addEventListener("click", function() {
          const id = Number(this.parentNode.dataset.id);
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

function setupFullscreenButton() {
  document.getElementById("fullscreen-btn").addEventListener("click", function() {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
          }
      }
  });
}

function setupDropdownMenu() {
  document.querySelector(".dropdown-button").addEventListener("click", function() {
      const dropdownMenu = this.nextElementSibling;
      dropdownMenu.classList.toggle("active");
  });
}

function setupAboutUsModal() {
  document.querySelector('a[href="/about"]').addEventListener("click", function(event) {
      event.preventDefault();
      document.getElementById("about-us").classList.add("active");
  });

  document.getElementById("close-button").addEventListener("click", function() {
      document.getElementById("about-us").classList.remove("active");
  });
}

function setupSocialLinks() {
  document.getElementById("twitter-box").addEventListener("click", function() {
      window.open("https://twitter.com/lofistudy", "_blank");
  });

  document.getElementById("instagram-box").addEventListener("click", function() {
      window.open("https://instagram.com/lofistudy", "_blank");
  });

  document.getElementById("email-box").addEventListener("click", function() {
      window.location.href = "mailto:support@mousewerk.de";
  });
}

function setupLeaderboard() {
  document.querySelector("#leaderboard-window").addEventListener("click", function() {
      fetch("/api/leaderboard")
      .then((response) => response.json())
      .then((data) => {
          let leaderboardHTML = "";
          data.forEach((user, index) => {
              if (index === 0) {
                  leaderboardHTML += `<li><i class="fas fa-crown"></i><span class="first-place">${user.charactername} </span>: ${user.pomodoro_time_count}</li>`;
              } else if (index === 1) {
                  leaderboardHTML += `<li><span class="second-place">${user.charactername} </span>: ${user.pomodoro_time_count}</li>`;
              } else if (index === 2) {
                  leaderboardHTML += `<li><span class="third-place">${user.charactername} </span>: ${user.pomodoro_time_count}</li>`;
              } else {
                  leaderboardHTML += `<li>${user.charactername}: ${user.pomodoro_time_count}</li>`;
              }
          });
          document.querySelector("#leaderboard-window .window-content ul").innerHTML = leaderboardHTML;
      });
  });
}

function setupAudioSourceChange() {
  document.getElementById("audio-source-select").addEventListener("change", function() {
      changeAudioSource(this);
  });
}

function changeAudioSource(selectElement) {
  const audioElements = ["pomodoroAudio", "shortBreakAudio", "longBreakAudio"];
  audioElements.forEach(function(id) {
      const audioElement = document.getElementById(id);
      audioElement.src = `/static/audio/${selectElement.value}`;
  });
}


// Ensure to include this script in your main JS file or script section

document.addEventListener("DOMContentLoaded", function () {
    const dailyGoalsContainer = document.getElementById('daily-goals-container');
    const toggleButton = document.getElementById('toggle-daily-goals');
    const closeButton = dailyGoalsContainer.querySelector('.close-window');

    toggleButton.addEventListener('click', function () {
        if (dailyGoalsContainer.style.right === '0px') {
            dailyGoalsContainer.style.right = '-300px';
        } else {
            dailyGoalsContainer.style.right = '0px';
        }
    });

    closeButton.addEventListener('click', function () {
        dailyGoalsContainer.style.right = '-300px';
    });

    document.getElementById('add-goal-button').addEventListener('click', function () {
        const goalInput = document.getElementById('new-goal-input');
        const goalList = document.getElementById('daily-goals-list');
        if (goalInput.value.trim() !== '') {
            const newGoal = document.createElement('li');
            newGoal.textContent = goalInput.value;
            goalList.appendChild(newGoal);
            goalInput.value = '';
        }
    });
});

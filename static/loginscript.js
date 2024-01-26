document.addEventListener("DOMContentLoaded", function() {
  const inputs = document.querySelectorAll(".inp input");

  inputs.forEach(input => {
    input.addEventListener("input", function() {
      const label = this.nextElementSibling;
      label.classList.toggle("up", this.value.trim() !== "");
    });
  });
});

function focusinp(inp) {
  if (inp == 'usr') {
    document.getElementById("username").focus();
  } else if (inp == 'pass') {
    document.getElementById("password").focus();
  } else {
    document.getElementById("username").focus();
  }
}


class Password {
  constructor(passwordDiv) {
      this.passwordDiv = document.querySelector(passwordDiv)
      this.passwordField = this.passwordDiv.querySelector("input")
      this.toggle = this.passwordDiv.querySelector("svg")
      this.toggle.addEventListener("click", this.showHide.bind(this, this.passwordField, this.toggle))
  }
  showHide(passwordField, toggle) {
    const eyePath = toggle.querySelector('.eye-path');
    if(passwordField.type == 'password') {
        passwordField.setAttribute("type", "text")
        eyePath.setAttribute("fill", "#38a4ef");  // Show color
    }else{
        passwordField.setAttribute("type", "password")
        eyePath.setAttribute("fill", "#808080");  // Hide color
    }
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
  new Password('.password-div1');
  new Password('.password-div2');
});

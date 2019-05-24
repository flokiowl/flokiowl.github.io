    var link = document.querySelector(".header__button");
    var popup = document.querySelector(".modal-login");
    var overlay = document.querySelector(".modal-overlay");
    var close = document.querySelector(".modal-close");
    var login = popup.querySelector("[name=login]");
    var password = popup.querySelector("[name=password]")
    var form = popup.querySelector("form");
    var storage = localStorage.getItem("login");

    link.addEventListener("click", function (evt) {
      evt.preventDefault();
      popup.classList.add("modal-show");
      overlay.classList.add("modal-show");
      login.focus();
      if (storage) {
        login.value = storage;
        password.focus();
      } else {
        login.focus();
      }
    });
    close.addEventListener("click", function (evt) {
      evt.preventDefault();
      popup.classList.remove("modal-show");
      overlay.classList.remove("modal-show");
      popup.classList.remove("modal-error");
    });
    form.addEventListener("submit", function (evt) {
      if (!login.value || !password.value) {
        evt.preventDefault();
        popup.classList.add("modal-error");
      } else {
        if (isStorageSupport) {
        localStorage.setItem("login", login.value);
        }
      }
    }); 

    var isStorageSupport = true;
    var storage = "";

    try {
      storage = localStorage.getItem("login");
    } catch (err) {
      isStorageSupport = false;
    }

    window.addEventListener("keydown", function(evt) {
      if (evt.keyCode === 27) {
        evt.preventDefault();

        if (popup.classList.contains("modal-show")) {
          popup.classList.remove("modal-show");
          overlay.classList.remove("modal-show");
          popup.classList.remove("modal-error"); 
        }
      }
    });

    overlay.addEventListener("click", function(evt) {
      popup.classList.remove("modal-show");
      overlay.classList.remove("modal-show");
    })
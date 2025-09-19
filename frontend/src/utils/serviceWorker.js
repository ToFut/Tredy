// Service Worker registration utilities

export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = "/service-worker.js";

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New content available, show update prompt
                showUpdatePrompt();
              }
            });
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    });
  }
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

function showUpdatePrompt() {
  const updateBanner = document.createElement("div");
  updateBanner.className =
    "fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 app-slide-in-bottom";
  updateBanner.innerHTML = `
    <div class="flex justify-between items-center">
      <div>
        <p class="font-semibold">Update Available!</p>
        <p class="text-sm opacity-90">A new version of Tredy is ready.</p>
      </div>
      <button onclick="window.location.reload()" class="ml-4 px-4 py-2 bg-white text-blue-500 rounded-lg font-semibold">
        Update
      </button>
    </div>
  `;

  document.body.appendChild(updateBanner);

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    updateBanner.remove();
  }, 10000);
}

// Check if app can be installed
export function checkInstallable() {
  let deferredPrompt;

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show install button
    showInstallButton(deferredPrompt);
  });

  window.addEventListener("appinstalled", () => {
    console.log("PWA was installed");
    hideInstallButton();
  });
}

function showInstallButton(deferredPrompt) {
  const installButton = document.createElement("button");
  installButton.id = "install-button";
  installButton.className =
    "fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg z-50 app-button flex items-center gap-2";
  installButton.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8l-8 8-8-8"></path>
    </svg>
    Install App
  `;

  installButton.addEventListener("click", async () => {
    // Hide the button
    installButton.style.display = "none";

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    deferredPrompt = null;
  });

  document.body.appendChild(installButton);
}

function hideInstallButton() {
  const button = document.getElementById("install-button");
  if (button) {
    button.remove();
  }
}

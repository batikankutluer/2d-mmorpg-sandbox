import Game from "./game.js";
import CONFIG from "./config.js";

// Oyunu başlat
window.onload = () => {
  // Canvas'ı tam ekran yap
  const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  resizeCanvas();

  // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
  window.addEventListener("resize", resizeCanvas);

  function resizeCanvas(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Oyunu başlat
  const game = new Game();
  game.init();
  game.start();

  // Sağ tıklama menüsünü engelle
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // Menü işlemleri
  const menuButton = document.getElementById("menuButton") as HTMLButtonElement;
  const gameMenu = document.getElementById("gameMenu") as HTMLDivElement;
  const closeMenu = document.getElementById("closeMenu") as HTMLButtonElement;

  // Menüyü aç/kapa
  menuButton.addEventListener("click", toggleMenu);
  closeMenu.addEventListener("click", toggleMenu);

  // ESC tuşu ile menüyü aç/kapa
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      toggleMenu();
    }
  });

  function toggleMenu(): void {
    gameMenu.classList.toggle("hidden");

    // Menü açıkken oyunu durdur, kapalıyken devam ettir
    if (!gameMenu.classList.contains("hidden")) {
      game.pause();
    } else {
      game.resume();
    }
  }

  // Tam ekran modu
  const toggleFullscreenButton = document.getElementById(
    "toggleFullscreen"
  ) as HTMLButtonElement;
  toggleFullscreenButton.addEventListener("click", toggleFullscreen);

  function toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Tam ekran hatası: ${err.message}`);
      });
      toggleFullscreenButton.textContent = "Tam Ekrandan Çık";
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        toggleFullscreenButton.textContent = "Tam Ekran";
      }
    }
  }

  // Web3 bağlantı butonu
  const connectButton = document.getElementById(
    "connectWallet"
  ) as HTMLButtonElement | null;
  if (connectButton) {
    connectButton.addEventListener("click", () => {
      game.connectWallet();
      alert("Cüzdan bağlandı: " + game.wallet);
    });
  }

  // Arazi oluştur butonu
  const mintLandButton = document.getElementById(
    "mintLand"
  ) as HTMLButtonElement | null;
  if (mintLandButton) {
    mintLandButton.addEventListener("click", () => {
      if (!game.isWalletConnected) {
        alert("Önce cüzdanınızı bağlamalısınız!");
        return;
      }

      // Oyuncunun etrafında bir arazi oluştur
      const x = Math.floor(game.player.x / game.blockSize);
      const y = Math.floor(game.player.y / game.blockSize);
      game.mintLand(x, y, 10, 10);
      alert(`Arazi başarıyla oluşturuldu! Konum: (${x}, ${y})`);
    });
  }

  // Envanter butonu
  const viewInventoryButton = document.getElementById(
    "viewInventory"
  ) as HTMLButtonElement | null;
  if (viewInventoryButton) {
    viewInventoryButton.addEventListener("click", () => {
      if (!game.isWalletConnected) {
        alert("Önce cüzdanınızı bağlamalısınız!");
        return;
      }

      let inventoryText = "Sahip olduğunuz araziler:\n";
      if (game.ownedLands.length === 0) {
        inventoryText += "Henüz bir araziniz yok.";
      } else {
        game.ownedLands.forEach((land) => {
          inventoryText += `ID: ${land.id}, Konum: (${land.x}, ${land.y}), Boyut: ${land.width}x${land.height}\n`;
        });
      }

      alert(inventoryText);
    });
  }

  // Debug modu butonu
  const toggleDebugButton = document.getElementById(
    "toggleDebug"
  ) as HTMLButtonElement | null;
  if (toggleDebugButton) {
    toggleDebugButton.addEventListener("click", () => {
      game.showDebug = !game.showDebug;
      toggleDebugButton.textContent = game.showDebug
        ? "Debug Kapat"
        : "Debug Modu";
    });
  }

  // Fare tekerleği ile zoom
  canvas.addEventListener("wheel", (e: WheelEvent) => {
    e.preventDefault();

    // Zoom yönünü belirle
    const zoomDirection = e.deltaY > 0 ? -1 : 1;

    // Önceki zoom seviyesini kaydet
    const oldZoom = game.camera.zoom;

    // Zoom seviyesini güncelle
    game.camera.zoom *= 1 + zoomDirection * CONFIG.ZOOM_SPEED * 0.5;

    // Zoom sınırlarını kontrol et
    game.camera.zoom = Math.max(
      CONFIG.MIN_ZOOM,
      Math.min(CONFIG.MAX_ZOOM, game.camera.zoom)
    );

    // Zoom değişmediyse işlemi sonlandır
    if (oldZoom === game.camera.zoom) return;

    // Kamerayı güncelle
    game.updateCamera(true);
  });
};

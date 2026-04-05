function updateTime() {
  const timeElement = document.getElementById('time');
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  timeElement.textContent = `${hours}:${minutes}`;
}

// Mettre à jour l'heure immédiatement
updateTime();

// Mettre à jour l'heure toutes les minutes
setInterval(updateTime, 60000);

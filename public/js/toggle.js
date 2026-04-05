// Fonction pour afficher ou masquer une section
function toggleSection(id) {
  const section = document.getElementById(id);
  if (section.style.display === "none") {
    section.style.display = "block";
  } else {
    section.style.display = "none";
  }
}

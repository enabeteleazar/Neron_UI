import Head from "next/head";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const scripts = [
      "/js/script.js",
      "/js/time.js",
      "/js/toggle.js"
    ];

    scripts.forEach((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    });
  }, []);

  return (
    <>
      <Head>
        <title>NeoFaceUI * AssistantAI</title>

        {/* CSS */}
        <link rel="stylesheet" href="/style.css" />

        {/* Leaflet */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet/dist/leaflet.css"
        />

        {/* Material Icons */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />

        {/* MapKit */}
        <script src="https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js"></script>

        {/* Leaflet JS */}
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      </Head>

      <main className="phone">

        {/* Barre de statut */}
        <section className="status-bar">
          <div className="time-weather">
            <div className="time" id="time">--:--</div>
            <div className="weather">26°C</div>
          </div>
        </section>

        {/* Infos + carte */}
        <section id="springboard" className="springboard">
          <button onClick={() => window.toggleSection && window.toggleSection('springboard')}>
            Afficher/Masquer la carte
          </button>

          <header id="flight-info" className="flight-info">
            <h1>Vol San Francisco → New York</h1>
            <p>🕒 21h25 - 4h30</p>
            <p>Terminal A, Porte A15</p>
          </header>
        </section>

        <section>
          <header></header>
        </section>

        {/* Assistant */}
        <section className="assistant-footer">
          <p>Comment puis-je vous aider ?</p>
        </section>

        {/* Icônes */}
        <nav className="icons" aria-label="Menu assistant">
          <button className="icon" aria-label="Téléphone"></button>
          <button className="icon" aria-label="Messages"></button>
          <button className="icon" aria-label="Profil"></button>
          <button className="icon" aria-label="Assistant IA"></button>
        </nav>

      </main>
    </>
  );
}


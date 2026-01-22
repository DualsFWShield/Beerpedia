export const GUIDE_HTML = `
<div class="guide-container fade-in">
    <header class="guide-header">
        <h1>Beerpedia</h1>
        <p class="subtitle">Comprendre, Choisir, Déguster.</p>
    </header>

    <section class="guide-section" id="beer-types">
        <h2>🍺 Les Grandes Familles de Bières</h2>
        <p class="intro-text">Le monde de la bière est vaste. Voici les principaux styles pour vous y retrouver.</p>

        <div class="beer-type-grid">
            <div class="type-card">
                <h3>Lager / Pilsner</h3>
                <div class="tags"><span class="tag">Rafraîchissante</span><span class="tag">Légère</span></div>
                <p>Les bières les plus répandues au monde. Fermentation basse, couleur dorée, goût croustillant et propre. C'est la bière "par défaut" (Jupiler, Stella...).</p>
                <a href="articles/lager.html" class="btn-small-outline" style="text-decoration:none; display:inline-block; text-align:center;">En savoir plus</a>
                <p class="food-pairing">🍽️ Idéal avec : Pizza, Burger, Salade.</p>
            </div>

            <div class="type-card">
                <h3>IPA (India Pale Ale)</h3>
                <div class="tags"><span class="tag">Amère</span><span class="tag">Aromatique</span></div>
                <p>Des bières fortement houblonnées. Elles offrent une amertume prononcée et des arômes d'agrumes, de fruits tropicaux ou de résine.</p>
                <a href="articles/ipa.html" class="btn-small-outline" style="text-decoration:none; display:inline-block; text-align:center;">En savoir plus</a>
                <p class="food-pairing">🍽️ Idéal avec : Plats épicés, Tacos, Curry.</p>
            </div>

            <div class="type-card">
                <h3>Stout / Porter</h3>
                <div class="tags"><span class="tag">Noire</span><span class="tag">Torréfiée</span></div>
                <p>Des bières sombres aux arômes de café, de cacao et de pain grillé. Souvent onctueuses (Stout) ou plus sèches (Porter).</p>
                <a href="articles/stout.html" class="btn-small-outline" style="text-decoration:none; display:inline-block; text-align:center;">En savoir plus</a>
                <p class="food-pairing">🍽️ Idéal avec : Desserts au chocolat, Huîtres, Ragoût.</p>
            </div>

            <div class="type-card">
                <h3>Abbaye / Trappiste</h3>
                <div class="tags"><span class="tag">Complexe</span><span class="tag">Maltée</span></div>
                <p>Bières de tradition belge, souvent fortes (Dubbel, Tripel, Quadrupel). Des goûts de fruits mûrs, de caramel et d'épices.</p>
                <a href="articles/trappist.html" class="btn-small-outline" style="text-decoration:none; display:inline-block; text-align:center;">En savoir plus</a>
                <p class="food-pairing">🍽️ Idéal avec : Fromages forts, Viandes rouges.</p>
            </div>

            <div class="type-card">
                <h3>Saison</h3>
                <div class="tags"><span class="tag">Sèche</span><span class="tag">Épicée</span></div>
                <p>Originaire de Wallonie. Bière fermière, désaltérante mais complexe, souvent avec des notes poivrées ou citronnées.</p>
                <a href="articles/saison.html" class="btn-small-outline" style="text-decoration:none; display:inline-block; text-align:center;">En savoir plus</a>
                <p class="food-pairing">🍽️ Idéal avec : Fruits de mer, Fromage de chèvre.</p>
            </div>

            <div class="type-card">
                <h3>Lambic / Sour</h3>
                <div class="tags"><span class="tag">Acide</span><span class="tag">Sauvage</span></div>
                <p>Fermentation spontanée (levures sauvages). Goût acidulé, parfois fruité (Kriek). Un style unique à Bruxelles et au Pajottenland.</p>
                <a href="articles/sour.html" class="btn-small-outline" style="text-decoration:none; display:inline-block; text-align:center;">En savoir plus</a>
                <p class="food-pairing">🍽️ Idéal avec : Moules-frites, Cheesecake.</p>
            </div>
        </div>
    </section>

    <div class="divider"></div>

    <section class="guide-section" id="how-to-choose">
        <h2>🤔 Comment Choisir ?</h2>
        <div class="choice-flow">
            <p>Vous ne savez pas quoi prendre ? Suivez le guide :</p>
            <ul class="choice-list">
                <li><strong>Il fait chaud, j'ai soif :</strong> Optez pour une <span class="highlight">Pilsner</span> ou une <span class="highlight">Blanche</span>.</li>
                <li><strong>J'aime l'amertume :</strong> Foncez sur une <span class="highlight">IPA</span> ou une <span class="highlight">Pale Ale</span>.</li>
                <li><strong>J'aime le sucré/fort :</strong> Une <span class="highlight">Triple</span> ou une <span class="highlight">Quadrupel</span> sera parfaite.</li>
                <li><strong>Je veux être surpris :</strong> Essayez une <span class="highlight">Sour</span> ou une <span class="highlight">Gueuze</span>.</li>
                <li><strong>J'aime le café :</strong> Un <span class="highlight">Stout</span> est fait pour vous.</li>
            </ul>
        </div>
    </section>

    <section class="guide-section" id="beer-style-map">
        <h2>🧭 La Carte des Styles</h2>
        <p class="intro-text">Les bières se classent souvent selon deux axes majeurs : l'intensité (Alcool/Corps) et la Balance (Douceur/Amertume).</p>

        <div class="style-map-container">
            <div class="map-label top">Fort / Intense</div>
            <div class="map-label bottom">Léger / Subtil</div>
            <div class="map-label left">Douceur / Malts</div>
            <div class="map-label right">Amertume / Houblons</div>

            <!-- Quadrants -->
            <div class="map-grid"></div>

            <!-- Beer Dots -->
            <div class="beer-dot" style="top: 20%; left: 80%;" data-label="Double IPA"></div>
            <div class="beer-dot" style="top: 30%; left: 20%;" data-label="Quadrupel"></div>
            <div class="beer-dot" style="top: 70%; left: 85%;" data-label="Pilsner"></div>
            <div class="beer-dot" style="top: 60%; left: 15%;" data-label="Bières Blanches"></div>
            <div class="beer-dot" style="top: 15%; left: 45%;" data-label="Imperial Stout"></div>
            <div class="beer-dot" style="top: 80%; left: 50%;" data-label="Lager"></div>
            <div class="beer-dot" style="top: 50%; left: 90%;" data-label="IPA"></div>
            <div class="beer-dot" style="top: 50%; left: 30%;" data-label="Dubbel"></div>
            <div class="beer-dot" style="top: 50%; left: 10%;" data-label="Stout"></div>
            <div class="beer-dot" style="top: 40%; left: 60%;" data-label="Saison"></div>
        </div>
        <p style="font-size:0.8rem; color:#888; text-align:center; margin-top:10px;">Cliquez sur un point pour voir le style.</p>
    </section>

    <div class="divider"></div>

    <section class="guide-section" id="beer-quiz">
        <h2>🎮 Quiz : Quelle bière êtes-vous ?</h2>
        <div id="quiz-container" class="quiz-box">
            <div id="quiz-start">
                <p>Répondez à 3 questions simples et nous trouverons votre bière idéale.</p>
                <button id="btn-quiz-start" class="btn-primary" style="margin-top:20px;">Commencer le Quiz</button>
            </div>
            <div id="quiz-question" class="hidden">
                <h3 id="q-text">Question...</h3>
                <div id="q-options" class="quiz-options"></div>
            </div>
            <div id="quiz-result" class="hidden">
                <div class="result-icon">🍺</div>
                <h3>Votre résultat : <span id="res-title" style="color:var(--accent-gold)"></span></h3>
                <p id="res-desc"></p>
                <button id="btn-quiz-reset" class="btn-primary" style="margin-top:20px; background:var(--bg-card); border:1px solid #444;">Recommencer</button>
            </div>
        </div>
    </section>

    <div class="divider"></div>

    <section class="guide-section" id="history">
        <h2>📜 Petite Histoire de la Bière</h2>
        <div class="timeline">
            <div class="timeline-item">
                <span class="date">-4000 av. J.C.</span>
                <p>Les Sumériens inventent le "pain liquide". La bière est née en Mésopotamie.</p>
            </div>
            <div class="timeline-item">
                <span class="date">Moyen Âge</span>
                <p>Les moines perfectionnent le brassage et introduisent le houblon pour la conservation.</p>
            </div>
            <div class="timeline-item">
                <span class="date">1800s</span>
                <p>Révolution industrielle. Naissance de la Pilsner dorée et limpide grâce au verre transparent.</p>
            </div>
            <div class="timeline-item">
                <span class="date">Années 1970+</span>
                <p>Révolution Craft (Artisanale) aux USA, puis retour en Europe. Diversité explosive.</p>
            </div>
        </div>
    </section>

    <div class="divider"></div>

    <section class="guide-section" id="about-beerdex">
        <h2>🦊 À propos de Beerdex</h2>
        <p>Beerdex est né d'une idée simple : pourquoi utiliser des applications lourdes, remplies de pubs et qui revendent vos données, juste pour se souvenir d'une bonne bière ?</p>

        <div class="features-list">
            <div class="feat-item">💸 <strong>100% Gratuit</strong> : Pas de version premium, pas de pubs.</div>
            <div class="feat-item">🔒 <strong>Privé</strong> : Vos données restent sur votre appareil (LocalStorage).</div>
            <div class="feat-item">⚡ <strong>Rapide</strong> : Construit avec le "0$ Stack" (HTML/CSS/JS pur).</div>
            <div class="feat-item">📱 <strong>Installable</strong> : Fonctionne hors-ligne comme une vraie app (PWA).</div>
        </div>

        <div class="article-signature">
            <p>Santé et bonne dégustation !</p>
            <div class="sign-block">
                <span class="sign-name">Antigravity</span>
                <span class="sign-role">Architecte Numérique & Assistant Brasseur</span>
            </div>
        </div>
    </section>

    <div style="height: 100px;"></div> <!-- Spacer for bottom nav -->
</div>
`;

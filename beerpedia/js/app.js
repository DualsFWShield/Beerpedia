import { GUIDE_HTML } from './guide_content.js';

const mainContent = document.getElementById('main-content');

// Init
function init() {
    // Check for first launch of Beerpedia
    if (!localStorage.getItem('beerpedia_intro_seen')) {
        localStorage.setItem('beerpedia_intro_seen', 'true');
        window.location.href = 'articles/intro.html';
        return;
    }

    renderGuide(mainContent);
}

// --- Guide Rendering & Logic (Extracted from old ui.js for isolation) ---

function renderGuide(container) {
    container.innerHTML = GUIDE_HTML;
    window.scrollTo(0, 0);

    // Initialize Interactive Elements
    setupQuiz();
    setupStyleMap();

    // Hook up article buttons to real links (if they are dynamic)
    // The static GUIDE_HTML should use <a href="articles/xyz.html"> now ideally, 
    // or we handle onclicks here if GUIDE_HTML uses button data-attributes.

    // Check if we need to fix links dynamically
    // In strict HTML mode, links should be <a href="articles/lager.html">
    // If GUIDE_HTML has javascript:void(0) or similar, we should fix it in guide_content.js
    // For now, let's assume guide_content.js generates valid HTML or we attach listeners.
}

function setupQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const startDiv = document.getElementById('quiz-start');
    const qDiv = document.getElementById('quiz-question');
    const resDiv = document.getElementById('quiz-result');
    const qText = document.getElementById('q-text');
    const qOpts = document.getElementById('q-options');

    const questions = [
        {
            id: 1,
            text: "C'est votre première fois ?",
            opts: [
                { text: "Oui, je débute", next: 2 },
                { text: "Non, je connais un peu", next: 3 }
            ]
        },
        {
            id: 2, // Beginner path
            text: "Vous préférez quoi comme goût ?",
            opts: [
                { text: "Léger et rafraîchissant", res: { title: "Lager / Pils", desc: "La valeur sûre. Fraîche, pétillante, sans prise de tête." } },
                { text: "Sucré et fruité", res: { title: "Blanche / Fruitée", desc: "Des notes d'agrumes ou de fruits rouges, peu d'amertume." } }
            ]
        },
        {
            id: 3, // Expert path
            text: "Votre position sur l'amertume ?",
            opts: [
                { text: "J'adore ça !", next: 4 },
                { text: "Pas trop mon truc", next: 5 }
            ]
        },
        {
            id: 4, // Bitter lover
            text: "Et la puissance ?",
            opts: [
                { text: "Plutôt léger (Session)", res: { title: "Session IPA", desc: "Tout le goût du houblon, mais léger en alcool." } },
                { text: "Fort et intense", res: { title: "Imperial IPA", desc: "Une explosion de saveurs et une bonne dose d'alcool." } }
            ]
        },
        {
            id: 5, // Malt lover
            text: "Café/Chocolat ou Caramel/Epices ?",
            opts: [
                { text: "Café / Noir", res: { title: "Stout / Porter", desc: "Des bières sombres, torréfiées, parfaites pour déguster." } },
                { text: "Caramel / Rondeur", res: { title: "Triple Belge", desc: "Ronde, chaleureuse, avec des notes de fruits mûrs." } }
            ]
        }
    ];

    const showQuestion = (id) => {
        const q = questions.find(x => x.id === id);
        if (!q) return;

        qText.innerText = q.text;
        qOpts.innerHTML = '';

        q.opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn-primary';
            btn.style.margin = '5px';
            btn.innerText = opt.text;
            btn.onclick = () => {
                if (opt.next) {
                    showQuestion(opt.next);
                } else if (opt.res) {
                    showResult(opt.res);
                }
            };
            qOpts.appendChild(btn);
        });

        startDiv.classList.add('hidden');
        qDiv.classList.remove('hidden');
    };

    const showResult = (res) => {
        qDiv.classList.add('hidden');
        resDiv.classList.remove('hidden');
        document.getElementById('res-title').innerText = res.title;
        document.getElementById('res-desc').innerText = res.desc;
    };

    const btnStart = document.getElementById('btn-quiz-start');
    const btnReset = document.getElementById('btn-quiz-reset');

    if (btnStart) btnStart.onclick = () => showQuestion(1);
    if (btnReset) btnReset.onclick = () => {
        resDiv.classList.add('hidden');
        startDiv.classList.remove('hidden');
    };
}

function setupStyleMap() {
    document.querySelectorAll('.beer-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            document.querySelectorAll('.beer-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');

            // Simple toast replacement
            const label = dot.dataset.label;
            alert(`Style : ${label}`); // Simple for standalone, or custom toast below
        });
    });
}

// Start
// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

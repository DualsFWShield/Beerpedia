
// State
let blocks = [];
let dragSrcEl = null;

// Block Types Definition
const BLOCK_TYPES = {
    header: { label: 'Titre H3', icon: 'H3', field: 'text' },
    text: { label: 'Texte', icon: '¶', field: 'textarea' },
    list: { label: 'Liste', icon: '≣', field: 'textarea', placeholder: 'Un item par ligne...' },
    image: { label: 'Image', icon: '🖼️', field: 'text', placeholder: 'Ex: ../images/beer/default.png' },
    meta: { label: 'Infos', icon: 'ℹ️', isComplex: true },
    signature: { label: 'Signature', icon: '🏷️', isComplex: true }, // NEW
    callout: { label: 'Note', icon: '💡', field: 'textarea', placeholder: 'Message important...' },
    divider: { label: 'Séparateur', icon: '➖', isStatic: true }
};

// --- Workspace Management ---

window.addBlock = (type) => {
    const id = Date.now().toString();
    // Default content for signature
    let content = '';
    if (type === 'signature') content = { volume: '33cl', abv: '5.0%', type: 'Lager' };

    blocks.push({ id, type, content });
    renderWorkspace();
    renderPreview();
    saveDraft();
};

window.removeBlock = (id) => {
    blocks = blocks.filter(b => b.id !== id);
    renderWorkspace();
    renderPreview();
    saveDraft();
};

window.updateBlock = (id, value, key = null) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    if (key) {
        // Complex object (Meta/Signature)
        if (typeof block.content !== 'object') block.content = {};
        block.content[key] = value;
    } else {
        // Simple string
        block.content = value;
    }
    renderPreview();
    saveDraft();
};

// Rich Text Helper
window.insertTag = (id, tagStart, tagEnd) => {
    const el = document.getElementById(`input-${id}`);
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + tagStart + selected + tagEnd + after;
    updateBlock(id, newText);

    // Restore selection/focus (trickier with re-render, but good enough for mvp)
    setTimeout(() => {
        const newEl = document.getElementById(`input-${id}`);
        if (newEl) {
            newEl.focus();
            newEl.setSelectionRange(start + tagStart.length, end + tagStart.length);
        }
    }, 50);
};

// Listeners
document.getElementById('meta-title').addEventListener('input', () => { renderPreview(); saveDraft(); });
document.getElementById('meta-subtitle').addEventListener('input', () => { renderPreview(); saveDraft(); });

// --- Rendering ---

function renderWorkspace() {
    const container = document.getElementById('workspace');
    container.innerHTML = '';

    blocks.forEach((block, index) => {
        const def = BLOCK_TYPES[block.type] || { label: 'Inconnu', icon: '?' };
        const el = document.createElement('div');
        el.className = 'workspace-block';
        el.draggable = true;

        // Header controls
        let html = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#aaa; font-size:0.8rem;">
                <span>${def.icon} ${def.label}</span>
                <button class="remove-btn" onclick="removeBlock('${block.id}')">✖</button>
            </div>
        `;

        // Toolbar for rich text fields
        const toolbar = `
            <div style="display:flex; gap:5px; margin-bottom:5px; padding-bottom:5px; border-bottom:1px solid #333;">
                <button class="btn-xs" style="padding:2px 8px;" onclick="insertTag('${block.id}', '<b>', '</b>')" title="Gras"><b>B</b></button>
                <button class="btn-xs" style="padding:2px 8px;" onclick="insertTag('${block.id}', '<i>', '</i>')" title="Italique"><i>I</i></button>
                <button class="btn-xs" style="padding:2px 8px;" onclick="insertTag('${block.id}', '<u>', '</u>')" title="Souligné"><u>U</u></button>
                <button class="btn-xs" style="padding:2px 8px;" onclick="insertTag('${block.id}', '<s>', '</s>')" title="Barré"><s>S</s></button>
                <button class="btn-xs" style="padding:2px 8px;" onclick="insertTag('${block.id}', '<small>', '</small>')" title="Petit">A-</button>
            </div>
        `;

        // Input fields based on type
        if (block.type === 'header' || block.type === 'text' || block.type === 'image' || block.type === 'callout') {
            const tag = (block.type === 'text' || block.type === 'callout') ? 'textarea' : 'input';
            if (block.type === 'text' || block.type === 'callout') html += toolbar;

            html += `<${tag} id="input-${block.id}" class="form-input" style="width:100%" 
                oninput="updateBlock('${block.id}', this.value)" 
                value="${block.content}" placeholder="${def.placeholder || 'Contenu...'}"></${tag}>`;

        } else if (block.type === 'list') {
            html += toolbar;
            html += `<textarea id="input-${block.id}" class="form-input" style="width:100%" rows="4" 
                oninput="updateBlock('${block.id}', this.value)" 
                placeholder="Item 1\nItem 2">${block.content}</textarea>`;

        } else if (block.type === 'meta') {
            const v = block.content || {};
            html += `
                <div class="input-group">
                    <input type="text" placeholder="Température (ex: 6-8°C)" value="${v.temp || ''}" oninput="updateBlock('${block.id}', this.value, 'temp')">
                    <input type="text" placeholder="Verre (ex: Tulipe)" value="${v.glass || ''}" oninput="updateBlock('${block.id}', this.value, 'glass')">
                </div>
            `;
        } else if (block.type === 'signature') {
            const v = block.content || {};
            html += `
                <div class="input-group" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">
                    <input type="text" placeholder="Vol (33cl)" value="${v.volume || ''}" oninput="updateBlock('${block.id}', this.value, 'volume')">
                    <input type="text" placeholder="ABV (5%)" value="${v.abv || ''}" oninput="updateBlock('${block.id}', this.value, 'abv')">
                    <input type="text" placeholder="Type (IPA)" value="${v.type || ''}" oninput="updateBlock('${block.id}', this.value, 'type')">
                </div>
            `;
        } else if (block.type === 'divider') {
            html += `<div style="height:2px; background:#444; margin:10px 0;"></div>`;
        }

        el.innerHTML = html;

        // Drag Events
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragover', handleDragOver);
        el.addEventListener('drop', (e) => handleDrop(e, index));

        container.appendChild(el);
    });
}

function renderPreview() {
    const container = document.getElementById('preview-content');
    const title = document.getElementById('meta-title').value || 'Titre de l\'article';
    const subtitle = document.getElementById('meta-subtitle').value || 'Sous-titre';

    let html = `
        <div style="padding:20px; color:#fff; font-family:'Outfit', sans-serif;">
            <header style="text-align:center; padding-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:20px;">
                <h1 style="color:var(--accent-gold); font-size:2rem; margin-bottom:5px;">${title}</h1>
                <p style="color:#aaa;">${subtitle}</p>
            </header>
            <div class="content">
    `;

    blocks.forEach(block => {
        if (block.type === 'header') {
            html += `<h3 style="color:#fff; border-left:3px solid var(--accent-gold); padding-left:10px; margin-top:20px;">${block.content || '...'}</h3>`;
        } else if (block.type === 'text') {
            html += `<p style="color:#ccc; line-height:1.6; margin-bottom:10px;">${(block.content || '').replace(/\n/g, '<br>')}</p>`;
        } else if (block.type === 'list') {
            const items = (block.content || '').split('\n').filter(x => x.trim());
            html += `<ul style="color:#ddd; padding-left:20px; margin-bottom:15px;">
                ${items.map(i => `<li>${i}</li>`).join('')}
            </ul>`;
        } else if (block.type === 'image') {
            const src = block.content || 'https://placehold.co/600x400';
            html += `<div style="margin:20px 0; text-align:center;">
                <img src="${src}" style="max-width:100%; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
            </div>`;
        } else if (block.type === 'meta') {
            const v = block.content || {};
            html += `
                <div style="display:flex; gap:10px; margin:20px 0; justify-content:center;">
                    <span style="background:rgba(255,192,0,0.1); color:var(--accent-gold); padding:5px 12px; border-radius:20px; border:1px solid rgba(255,192,0,0.3);">
                        🌡️ ${v.temp || '?'}
                    </span>
                    <span style="background:rgba(255,192,0,0.1); color:var(--accent-gold); padding:5px 12px; border-radius:20px; border:1px solid rgba(255,192,0,0.3);">
                        🍺 ${v.glass || '?'}
                    </span>
                </div>
            `;
        } else if (block.type === 'signature') {
            const v = block.content || {};
            html += `
                <div style="background:#1a1a1a; border:1px solid #333; border-radius:12px; padding:15px; margin:20px 0; display:flex; justify-content:space-around; align-items:center;">
                    <div style="text-align:center;">
                        <div style="color:#888; font-size:0.7rem; text-transform:uppercase;">Volume</div>
                        <div style="color:#fff; font-weight:bold;">${v.volume || '-'}</div>
                    </div>
                    <div style="width:1px; height:30px; background:#333;"></div>
                    <div style="text-align:center;">
                        <div style="color:#888; font-size:0.7rem; text-transform:uppercase;">Alcool</div>
                        <div style="color:var(--accent-gold); font-weight:bold;">${v.abv || '-'}</div>
                    </div>
                    <div style="width:1px; height:30px; background:#333;"></div>
                    <div style="text-align:center;">
                        <div style="color:#888; font-size:0.7rem; text-transform:uppercase;">Style</div>
                        <div style="color:#fff; font-weight:bold;">${v.type || '-'}</div>
                    </div>
                </div>
             `;
        } else if (block.type === 'callout') {
            html += `
                <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; border-left:4px solid var(--accent-gold); margin:15px 0;">
                    <p style="margin:0; color:#eee; font-style:italic;">"${block.content || '...'}"</p>
                </div>
            `;
        } else if (block.type === 'divider') {
            html += `<hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:30px 0;">`;
        }
    });

    html += `</div></div>`;
    container.innerHTML = html;
}

// ... Drag & Drop Logic (unchanged) ...
function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', null); // Firefox fix
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e, targetIndex) {
    if (e.stopPropagation) e.stopPropagation();

    // Get source index
    const sourceIndex = Array.from(dragSrcEl.parentNode.children).indexOf(dragSrcEl);

    if (sourceIndex !== targetIndex) {
        // Reorder array
        const [movedBlock] = blocks.splice(sourceIndex, 1);
        blocks.splice(targetIndex, 0, movedBlock);

        // Re-render
        renderWorkspace();
        renderPreview();
        saveDraft(); // Auto-save on reorder
    }

    dragSrcEl.classList.remove('dragging');
    return false;
}

// --- Auto-Save & Multi-Draft ---
const STORAGE_KEY = 'beerdex_editor_data';

let currentDraftId = null;

function loadDrafts() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"drafts":{}}');
    if (!data.drafts || Object.keys(data.drafts).length === 0) {
        createNewDraft(false);
    } else {
        currentDraftId = data.activeId || Object.keys(data.drafts)[0];
        if (!data.drafts[currentDraftId]) currentDraftId = Object.keys(data.drafts)[0];
        loadDraftContent(data.drafts[currentDraftId]);
    }
}

function loadDraftContent(draft) {
    if (!draft) return;
    document.getElementById('meta-title').value = draft.title || '';
    document.getElementById('meta-subtitle').value = draft.subtitle || '';
    blocks = draft.blocks || [];
    renderWorkspace();
    renderPreview();
}

function createNewDraft(shouldSave = true) {
    const id = 'draft_' + Date.now();
    currentDraftId = id;

    // Clear UI
    document.getElementById('meta-title').value = '';
    document.getElementById('meta-subtitle').value = '';
    blocks = [];

    renderWorkspace();
    renderPreview();

    if (shouldSave) saveDraft();
    toggleDraftsPanel(false); // Close panel if open
}

function saveDraft() {
    if (!currentDraftId) return;

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"drafts":{}}');
    if (!data.drafts) data.drafts = {};

    const title = document.getElementById('meta-title').value || 'Sans titre';
    const subtitle = document.getElementById('meta-subtitle').value || '';

    data.activeId = currentDraftId;
    data.drafts[currentDraftId] = {
        id: currentDraftId,
        title,
        subtitle,
        blocks,
        lastMod: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showAutoSaveIndicator();
    renderDraftsList();
}

function deleteDraft(id, e) {
    if (e) e.stopPropagation();
    if (!confirm('Supprimer ce brouillon ?')) return;

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"drafts":{}}');
    if (data.drafts) delete data.drafts[id];

    if (id === currentDraftId) {
        const remaining = data.drafts ? Object.keys(data.drafts) : [];
        if (remaining.length > 0) {
            currentDraftId = remaining[0];
            data.activeId = currentDraftId;
            loadDraftContent(data.drafts[currentDraftId]);
        } else {
            currentDraftId = null;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            createNewDraft();
            return;
        }
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    renderDraftsList();
}

window.switchDraft = (id) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && data.drafts && data.drafts[id]) {
        currentDraftId = id;
        loadDraftContent(data.drafts[id]);
        data.activeId = id;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        toggleDraftsPanel(false);
    }
};

window.createNewDraft = createNewDraft;

window.toggleDraftsPanel = (forceState) => {
    const panel = document.getElementById('drafts-panel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    const show = forceState !== undefined ? forceState : isHidden;

    if (show) {
        renderDraftsList();
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
};

function renderDraftsList() {
    const list = document.getElementById('drafts-list');
    if (!list) return;
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"drafts":{}}');
    const drafts = data.drafts || {};

    list.innerHTML = Object.values(drafts)
        .sort((a, b) => b.lastMod - a.lastMod)
        .map(d => `
            <div onclick="switchDraft('${d.id}')" class="draft-item ${d.id === currentDraftId ? 'active' : ''}">
                <div>
                    <div style="font-weight:bold; color:#fff; font-size:0.9rem;">${d.title || 'Sans titre'}</div>
                    <div style="font-size:0.7rem; color:#888;">${new Date(d.lastMod).toLocaleTimeString()}</div>
                </div>
                <button onclick="deleteDraft('${d.id}', event)" class="btn-icon" style="font-size:1rem; color:#555;">🗑️</button>
            </div>
        `).join('');
}

function showAutoSaveIndicator() {
    const ind = document.getElementById('autosave-indicator');
    if (ind) {
        ind.style.opacity = '1';
        setTimeout(() => ind.style.opacity = '0', 2000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.sidebar-header');
    if (header) {
        const ind = document.createElement('div');
        ind.id = 'autosave-indicator';
        ind.innerText = 'Sauvegardé ✓';
        ind.style = 'color:var(--success); font-size:0.7rem; margin-top:5px; opacity:0; transition:opacity 0.3s; text-align:right;';
        header.appendChild(ind);
    }
    loadDrafts();
});

// --- Export ---
window.generateHTML = () => {
    const title = document.getElementById('meta-title').value || 'Article';
    const subtitle = document.getElementById('meta-subtitle').value || '';
    let contentHtml = '';

    blocks.forEach(block => {
        if (block.type === 'header') {
            contentHtml += `            <h3>${block.content}</h3>\n`;
        } else if (block.type === 'text') {
            contentHtml += `            <p>${(block.content || '').replace(/\n/g, '<br>')}</p>\n`;
        } else if (block.type === 'list') {
            const items = (block.content || '').split('\n').filter(x => x.trim());
            contentHtml += `            <ul>\n${items.map(i => `                <li>${i}</li>`).join('\n')}\n            </ul>\n`;
        } else if (block.type === 'image') {
            contentHtml += `            <div class="article-image"><img src="${block.content}" alt="Image"></div>\n`;
        } else if (block.type === 'meta') {
            const v = block.content || {};
            contentHtml += `            <div class="article-meta">
                <span>🌡️ ${v.temp}</span>
                <span>🍺 ${v.glass}</span>
            </div>\n`;
        } else if (block.type === 'signature') {
            const v = block.content || {};
            contentHtml += `            <div class="beer-signature" style="background:#1a1a1a; border:1px solid #333; border-radius:12px; padding:15px; margin:20px 0; display:flex; justify-content:space-around; align-items:center;">
                <div style="text-align:center;">
                    <div style="color:#888; font-size:0.7rem; text-transform:uppercase;">Volume</div>
                    <div style="color:#fff; font-weight:bold;">${v.volume}</div>
                </div>
                <div style="width:1px; height:30px; background:#333;"></div>
                <div style="text-align:center;">
                    <div style="color:#888; font-size:0.7rem; text-transform:uppercase;">Alcool</div>
                    <div style="color:var(--accent-gold); font-weight:bold;">${v.abv}</div>
                </div>
                <div style="width:1px; height:30px; background:#333;"></div>
                <div style="text-align:center;">
                    <div style="color:#888; font-size:0.7rem; text-transform:uppercase;">Style</div>
                    <div style="color:#fff; font-weight:bold;">${v.type}</div>
                </div>
            </div>\n`;
        } else if (block.type === 'callout') {
            contentHtml += `            <blockquote style="background:rgba(255,255,255,0.05); padding:15px; border-left:4px solid #ffc107; margin:15px 0;">
                <p style="margin:0; font-style:italic;">${block.content}</p>
            </blockquote>\n`;
        } else if (block.type === 'divider') {
            contentHtml += `            <hr style="margin:30px 0; border:0; border-top:1px solid rgba(255,255,255,0.1);">\n`;
        }
    });

    const fullHtml = `<!DOCTYPE html>
<html lang="fr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Beerpedia</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Russo+One&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <div id="app">
        <header class="app-header">
            <div class="logo">
                <a href="../index.html" style="text-decoration:none; display:flex; align-items:center; gap:10px; color:inherit;">
                    <img src="../../icons/logo-bnr.png" width="32" height="32" alt="Beerdex Logo">
                    <h1>Beerpedia</h1>
                </a>
            </div>
             <a href="../index.html" class="icon-btn" aria-label="Retour">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
            </a>
        </header>

        <main id="main-content" class="scroll-container">
            <div class="article-container fade-in">
                <header class="article-header">
                    <div class="article-icon">🍺</div>
                    <h1>${title}</h1>
                    <p class="subtitle">${subtitle}</p>
                    <div class="article-author" style="font-size:0.8rem; color:#666; margin-top:10px; text-align:center;">
                        <span style="color:#eee;">${author}</span> // <span style="font-style:italic;">${role}</span>
                    </div>
                </header>

                <div class="article-content">
${contentHtml}
                </div>
                
                <div style="height: 100px;"></div>
            </div>
        </main>
    </div>
    <script src="../js/runtime.js"></script>
</body>
</html>`;

    document.getElementById('export-code').value = fullHtml;
    document.getElementById('export-modal').classList.remove('hidden');
};

// --- IMPORT Logic ---
window.processImport = () => {
    const code = document.getElementById('import-code').value;
    if (!code) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');

    const title = doc.querySelector('title') ? doc.querySelector('title').innerText.split(' - ')[0] : 'Titre Importé';
    const h1 = doc.querySelector('h1') ? doc.querySelector('h1').innerText : title;
    const subtitle = doc.querySelector('.subtitle') ? doc.querySelector('.subtitle').innerText : '';

    document.getElementById('meta-title').value = h1;
    document.getElementById('meta-subtitle').value = subtitle;

    const contentDiv = doc.querySelector('.article-content');
    if (!contentDiv) { alert("Section .article-content introuvable."); return; }

    blocks = [];

    Array.from(contentDiv.children).forEach(el => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);

        if (el.tagName === 'H3') {
            blocks.push({ id, type: 'header', content: el.innerText });
        } else if (el.tagName === 'P') {
            blocks.push({ id, type: 'text', content: el.innerHTML.replace(/<br>/g, '\n').trim() });
        } else if (el.tagName === 'UL') {
            const items = Array.from(el.querySelectorAll('li')).map(li => li.innerText).join('\n');
            blocks.push({ id, type: 'list', content: items });
        } else if (el.classList.contains('article-image')) {
            const img = el.querySelector('img');
            blocks.push({ id, type: 'image', content: img ? img.src : '' });
        } else if (el.classList.contains('article-meta')) {
            const spans = el.querySelectorAll('span');
            let temp = '', glass = '';
            spans.forEach(s => {
                if (s.innerText.includes('🌡️')) temp = s.innerText.replace('🌡️', '').trim();
                if (s.innerText.includes('🍺')) glass = s.innerText.replace('🍺', '').trim();
            });
            blocks.push({ id, type: 'meta', content: { temp, glass } });
        } else if (el.classList.contains('beer-signature')) {
            let volume = '', abv = '', type = '';
            const divs = el.querySelectorAll('div > div:nth-child(2)'); // Value divs
            if (divs.length >= 3) {
                volume = divs[0].innerText;
                abv = divs[1].innerText;
                type = divs[2].innerText;
            }
            blocks.push({ id, type: 'signature', content: { volume, abv, type } });
        } else if (el.tagName === 'BLOCKQUOTE') {
            blocks.push({ id, type: 'callout', content: el.innerText.trim() });
        } else if (el.tagName === 'HR') {
            blocks.push({ id, type: 'divider', content: '' });
        }
    });

    renderWorkspace();
    renderPreview();
    saveDraft();
    document.getElementById('import-modal').classList.add('hidden');
    alert(`Importé avec succès ! ${blocks.length} blocs récupérés.`);
};

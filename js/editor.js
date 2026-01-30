// ======================================
// BEERPEDIA ARTICLE EDITOR - v2.0
// ======================================

import { db, auth, collection, addDoc, getDocs, getDoc, doc, signInWithEmailAndPassword, onAuthStateChanged, signOut, provider, signInWithPopup } from './firebase-config.js';

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
    signature: { label: 'Signature', icon: '🏷️', isComplex: true },
    callout: { label: 'Note', icon: '💡', field: 'textarea', placeholder: 'Message important...' },
    quote: { label: 'Citation', icon: '❝', isComplex: true },
    faq: { label: 'FAQ', icon: '❓', isComplex: true },
    table: { label: 'Tableau', icon: '📊', field: 'textarea', placeholder: 'Col1,Col2,Col3\nVal1,Val2,Val3' },
    divider: { label: 'Séparateur', icon: '➖', isStatic: true }
};

// --- Firebase Auth & Logic ---

function initFirebaseUI() {
    const btnLogin = document.getElementById('btn-login');
    const loginForm = document.getElementById('login-form');
    const authEmail = document.getElementById('auth-email');
    const authPass = document.getElementById('auth-password');
    const btnSubmit = document.getElementById('btn-auth-submit');
    const btnLogout = document.getElementById('btn-logout');
    const btnPublish = document.getElementById('btn-publish');

    // Toggle Login Form
    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            loginForm.classList.toggle('hidden');
            btnLogin.classList.toggle('hidden');
        });
    }

    // Google Login Logic
    if (loginForm && !document.getElementById('btn-google-login')) {
        const googleBtn = document.createElement('button');
        googleBtn.id = 'btn-google-login';
        googleBtn.className = 'btn-secondary';
        googleBtn.innerHTML = '🔵 Se connecter avec Google';
        googleBtn.style.width = '100%';
        googleBtn.style.marginTop = '10px';
        googleBtn.style.marginBottom = '10px';

        // Insert before inputs
        loginContainer.insertBefore(googleBtn, loginContainer.firstChild);

        googleBtn.addEventListener('click', async () => {
            try {
                await signInWithPopup(auth, provider);
                loginForm.classList.add('hidden');
            } catch (error) {
                console.error(error);
                alert("Erreur Google Auth : " + error.message);
            }
        });
    }

    // Login Action
    if (btnSubmit) {
        btnSubmit.addEventListener('click', async () => {
            try {
                await signInWithEmailAndPassword(auth, authEmail.value, authPass.value);
                loginForm.classList.add('hidden');
            } catch (error) {
                alert("Erreur de connexion : " + error.message);
            }
        });
    }

    // Logout Action
    if (btnLogout) {
        btnLogout.addEventListener('click', () => signOut(auth));
    }

    // Publish Action
    if (btnPublish) {
        btnPublish.addEventListener('click', publishArticle);
    }

    // Auth State Observer
    onAuthStateChanged(auth, (user) => {
        const authSection = document.getElementById('auth-section');
        const userSection = document.getElementById('user-section');
        const userEmailSpan = document.getElementById('user-email');

        if (user) {
            if (authSection) authSection.classList.add('hidden');
            if (userSection) userSection.classList.remove('hidden');
            if (userEmailSpan) userEmailSpan.innerText = user.email;
        } else {
            if (authSection) authSection.classList.remove('hidden');
            if (userSection) userSection.classList.add('hidden');
            if (btnLogin) btnLogin.classList.remove('hidden'); // Ensure button is back
            if (loginForm) loginForm.classList.add('hidden');
        }
    });
}

async function publishArticle() {
    if (!confirm("Voulez-vous publier cet article en ligne sur Firebase ?")) return;

    const btn = document.getElementById('btn-publish');
    const originalText = btn.innerText;
    btn.innerText = "⏳ Publication...";
    btn.disabled = true;

    try {
        const title = document.getElementById('meta-title').value || 'Sans titre';
        const subtitle = document.getElementById('meta-subtitle').value || '';
        const icon = document.getElementById('meta-icon').value || '🍺';
        const author = document.getElementById('meta-author').value || 'Beerpedia';
        const role = document.getElementById('meta-role').value || 'Éditeur';
        const generatedHtml = getExportHTML(); // We store the full HTML for easy rendering

        // Search Keywords Generation
        const keywords = [
            ...title.toLowerCase().split(' '),
            ...subtitle.toLowerCase().split(' '),
            ...blocks.map(b => typeof b.content === 'string' ? b.content.toLowerCase().split(' ') : []).flat()
        ].filter(k => k.length > 3);

        const articleData = {
            title,
            subtitle,
            icon,
            author,
            role,
            blocks, // Store raw blocks for editing later if needed
            contentHtml: generatedHtml, // Store generated HTML for display
            tags: [...new Set(keywords)].slice(0, 10), // Limit keywords
            createdAt: new Date().toISOString(),
            uid: auth.currentUser ? auth.currentUser.uid : 'anon'
        };

        const docRef = await addDoc(collection(db, "articles"), articleData);

        alert(`🎉 Article publié avec succès ! ID: ${docRef.id}`);
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("Erreur lors de la publication : " + e.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- Workspace Management ---

window.addBlock = (type) => {
    const id = Date.now().toString();
    let content = '';

    // Default content for complex types
    if (type === 'signature') content = { volume: '33cl', abv: '5.0%', type: 'Lager' };
    if (type === 'quote') content = { text: '', author: '' };
    if (type === 'faq') content = { question: '', answer: '' };

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

window.moveBlock = (id, direction) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    // Swap
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];

    renderWorkspace();
    renderPreview();
    saveDraft();
};

window.updateBlock = (id, value, key = null) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    if (key) {
        if (typeof block.content !== 'object') block.content = {};
        block.content[key] = value;
    } else {
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

    setTimeout(() => {
        const newEl = document.getElementById(`input-${id}`);
        if (newEl) {
            newEl.focus();
            newEl.setSelectionRange(start + tagStart.length, end + tagStart.length);
        }
    }, 50);
};

// Metadata listeners
document.getElementById('meta-title').addEventListener('input', () => { renderPreview(); saveDraft(); });
document.getElementById('meta-subtitle').addEventListener('input', () => { renderPreview(); saveDraft(); });
document.getElementById('meta-icon').addEventListener('change', () => { renderPreview(); saveDraft(); });
document.getElementById('meta-author').addEventListener('input', () => { renderPreview(); saveDraft(); });
document.getElementById('meta-role').addEventListener('input', () => { renderPreview(); saveDraft(); });

// --- Rendering ---

function renderWorkspace() {
    const container = document.getElementById('workspace');
    container.innerHTML = '';

    blocks.forEach((block, index) => {
        const def = BLOCK_TYPES[block.type] || { label: 'Inconnu', icon: '?' };
        const el = document.createElement('div');
        el.className = 'workspace-block';
        el.draggable = true;

        // Header controls with reorder buttons
        let html = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#aaa; font-size:0.8rem; align-items:center;">
                <span>${def.icon} ${def.label}</span>
                <div style="display:flex; gap:4px; align-items:center;">
                    <button class="btn-icon" style="font-size:0.9rem;" onclick="moveBlock('${block.id}', 'up')" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>▲</button>
                    <button class="btn-icon" style="font-size:0.9rem;" onclick="moveBlock('${block.id}', 'down')" ${index === blocks.length - 1 ? 'disabled style="opacity:0.3"' : ''}>▼</button>
                    <button class="remove-btn" onclick="removeBlock('${block.id}')">✖</button>
                </div>
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
        if (block.type === 'header' || block.type === 'image') {
            html += `<input id="input-${block.id}" class="form-input" style="width:100%" 
                oninput="updateBlock('${block.id}', this.value)" 
                value="${block.content || ''}" placeholder="${def.placeholder || 'Contenu...'}">`;
        } else if (block.type === 'text' || block.type === 'callout') {
            html += toolbar;
            html += `<textarea id="input-${block.id}" class="form-input" style="width:100%" rows="3" 
                oninput="updateBlock('${block.id}', this.value)" 
                placeholder="${def.placeholder || 'Contenu...'}">${block.content || ''}</textarea>`;
        } else if (block.type === 'list') {
            html += toolbar;
            html += `<textarea id="input-${block.id}" class="form-input" style="width:100%" rows="4" 
                oninput="updateBlock('${block.id}', this.value)" 
                placeholder="Item 1\nItem 2">${block.content || ''}</textarea>`;
        } else if (block.type === 'table') {
            html += `<textarea id="input-${block.id}" class="form-input" style="width:100%; font-family:monospace;" rows="4" 
                oninput="updateBlock('${block.id}', this.value)" 
                placeholder="Header1,Header2,Header3\nVal1,Val2,Val3">${block.content || ''}</textarea>`;
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
        } else if (block.type === 'quote') {
            const v = block.content || {};
            html += `
                <div class="input-group" style="display:flex; flex-direction:column; gap:5px;">
                    <textarea id="input-${block.id}" class="form-input" rows="2" placeholder="Citation..." oninput="updateBlock('${block.id}', this.value, 'text')">${v.text || ''}</textarea>
                    <input type="text" placeholder="— Auteur" value="${v.author || ''}" oninput="updateBlock('${block.id}', this.value, 'author')">
                </div>
            `;
        } else if (block.type === 'faq') {
            const v = block.content || {};
            html += `
                <div class="input-group" style="display:flex; flex-direction:column; gap:5px;">
                    <input type="text" placeholder="Question ?" value="${v.question || ''}" oninput="updateBlock('${block.id}', this.value, 'question')">
                    <textarea class="form-input" rows="2" placeholder="Réponse..." oninput="updateBlock('${block.id}', this.value, 'answer')">${v.answer || ''}</textarea>
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
    const icon = document.getElementById('meta-icon').value || '🍺';
    const title = document.getElementById('meta-title').value || 'Titre de l\'article';
    const subtitle = document.getElementById('meta-subtitle').value || 'Sous-titre';
    const author = document.getElementById('meta-author').value || 'Beerpedia';
    const role = document.getElementById('meta-role').value || 'Éditeur';

    let html = `
        <div style="padding:20px; color:#fff; font-family:'Outfit', sans-serif;">
            <header style="text-align:center; padding-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:20px;">
                <div style="font-size:3rem;">${icon}</div>
                <h1 style="color:var(--accent-gold); font-size:2rem; margin-bottom:5px;">${title}</h1>
                <p style="color:#aaa;">${subtitle}</p>
                <div style="font-size:0.8rem; color:#666; margin-top:10px;">
                    <span style="color:#eee;">${author}</span> // <span style="font-style:italic;">${role}</span>
                </div>
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
        } else if (block.type === 'quote') {
            const v = block.content || {};
            html += `
                <blockquote style="margin:20px 0; padding:15px 20px; border-left:4px solid #555; background:rgba(255,255,255,0.03); font-style:italic; color:#ddd;">
                    "${v.text || '...'}"
                    ${v.author ? `<footer style="margin-top:10px; font-size:0.9rem; color:#888;">— ${v.author}</footer>` : ''}
                </blockquote>
            `;
        } else if (block.type === 'faq') {
            const v = block.content || {};
            html += `
                <div style="margin:15px 0; background:#1a1a1a; border-radius:8px; overflow:hidden;">
                    <div style="padding:12px 15px; background:#252525; font-weight:bold; color:#fff;">
                        ❓ ${v.question || 'Question ?'}
                    </div>
                    <div style="padding:12px 15px; color:#ccc; line-height:1.5;">
                        ${v.answer || 'Réponse...'}
                    </div>
                </div>
            `;
        } else if (block.type === 'table') {
            const rows = (block.content || '').split('\n').filter(x => x.trim());
            if (rows.length > 0) {
                html += `<div style="overflow-x:auto; margin:15px 0;"><table style="width:100%; border-collapse:collapse; background:#1a1a1a; border-radius:8px; overflow:hidden;">`;
                rows.forEach((row, i) => {
                    const cells = row.split(',');
                    const tag = i === 0 ? 'th' : 'td';
                    const style = i === 0
                        ? 'background:#252525; color:var(--accent-gold); padding:10px; text-align:left;'
                        : 'padding:10px; border-top:1px solid #333; color:#ccc;';
                    html += `<tr>${cells.map(c => `<${tag} style="${style}">${c.trim()}</${tag}>`).join('')}</tr>`;
                });
                html += `</table></div>`;
            }
        } else if (block.type === 'divider') {
            html += `<hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:30px 0;">`;
        }
    });

    html += `</div></div>`;
    container.innerHTML = html;
}

// Drag & Drop
function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', null);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e, targetIndex) {
    if (e.stopPropagation) e.stopPropagation();
    const sourceIndex = Array.from(dragSrcEl.parentNode.children).indexOf(dragSrcEl);

    if (sourceIndex !== targetIndex) {
        const [movedBlock] = blocks.splice(sourceIndex, 1);
        blocks.splice(targetIndex, 0, movedBlock);
        renderWorkspace();
        renderPreview();
        saveDraft();
    }

    dragSrcEl.classList.remove('dragging');
    return false;
}

// --- Draft Management ---
const STORAGE_KEY = 'beerpedia_editor_data';
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
    document.getElementById('meta-icon').value = draft.icon || '🍺';
    document.getElementById('meta-author').value = draft.author || 'Beerpedia';
    document.getElementById('meta-role').value = draft.role || 'Éditeur';
    blocks = draft.blocks || [];
    renderWorkspace();
    renderPreview();
}

function createNewDraft(shouldSave = true) {
    const id = 'draft_' + Date.now();
    currentDraftId = id;

    document.getElementById('meta-title').value = '';
    document.getElementById('meta-subtitle').value = '';
    document.getElementById('meta-icon').value = '🍺';
    document.getElementById('meta-author').value = 'Beerpedia';
    document.getElementById('meta-role').value = 'Éditeur';
    blocks = [];

    renderWorkspace();
    renderPreview();

    if (shouldSave) saveDraft();
    toggleDraftsPanel(false);
}

function saveDraft() {
    if (!currentDraftId) return;

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"drafts":{}}');
    if (!data.drafts) data.drafts = {};

    const title = document.getElementById('meta-title').value || 'Sans titre';
    const subtitle = document.getElementById('meta-subtitle').value || '';
    const icon = document.getElementById('meta-icon').value || '🍺';
    const author = document.getElementById('meta-author').value || 'Beerpedia';
    const role = document.getElementById('meta-role').value || 'Éditeur';

    data.activeId = currentDraftId;
    data.drafts[currentDraftId] = {
        id: currentDraftId,
        title, subtitle, icon, author, role, blocks,
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
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
window.deleteDraft = deleteDraft;

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
                    <div style="font-weight:bold; color:#fff; font-size:0.9rem;">${d.icon || '🍺'} ${d.title || 'Sans titre'}</div>
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

// --- Export ---
function getExportHTML() {
    const icon = document.getElementById('meta-icon').value || '🍺';
    const title = document.getElementById('meta-title').value || 'Article';
    const subtitle = document.getElementById('meta-subtitle').value || '';
    const author = document.getElementById('meta-author').value || 'Beerpedia';
    const role = document.getElementById('meta-role').value || 'Éditeur';

    let contentHtml = '';

    blocks.forEach(block => {
        if (block.type === 'header') {
            contentHtml += `                    <h3>${block.content}</h3>\n`;
        } else if (block.type === 'text') {
            contentHtml += `                    <p>${(block.content || '').replace(/\n/g, '<br>')}</p>\n`;
        } else if (block.type === 'list') {
            const items = (block.content || '').split('\n').filter(x => x.trim());
            contentHtml += `                    <ul>\n${items.map(i => `                        <li>${i}</li>`).join('\n')}\n                    </ul>\n`;
        } else if (block.type === 'image') {
            contentHtml += `                    <div class="article-image"><img src="${block.content}" alt="Image"></div>\n`;
        } else if (block.type === 'meta') {
            const v = block.content || {};
            contentHtml += `                    <div class="article-meta">
                        <span>🌡️ ${v.temp || '?'}</span>
                        <span>🍺 ${v.glass || '?'}</span>
                    </div>\n`;
        } else if (block.type === 'signature') {
            const v = block.content || {};
            contentHtml += `                    <div class="beer-signature">
                        <div><div class="label">Volume</div><div class="value">${v.volume}</div></div>
                        <div><div class="label">Alcool</div><div class="value highlight">${v.abv}</div></div>
                        <div><div class="label">Style</div><div class="value">${v.type}</div></div>
                    </div>\n`;
        } else if (block.type === 'callout') {
            contentHtml += `                    <blockquote>${block.content}</blockquote>\n`;
        } else if (block.type === 'quote') {
            const v = block.content || {};
            contentHtml += `                    <blockquote>
                        "${v.text}"
                        ${v.author ? `<footer>— ${v.author}</footer>` : ''}
                    </blockquote>\n`;
        } else if (block.type === 'faq') {
            const v = block.content || {};
            contentHtml += `                    <details class="faq-item">
                        <summary>${v.question || 'Question ?'}</summary>
                        <p>${v.answer || 'Réponse...'}</p>
                    </details>\n`;
        } else if (block.type === 'table') {
            const rows = (block.content || '').split('\n').filter(x => x.trim());
            if (rows.length > 0) {
                contentHtml += `                    <table class="article-table">\n`;
                rows.forEach((row, i) => {
                    const cells = row.split(',');
                    const tag = i === 0 ? 'th' : 'td';
                    contentHtml += `                        <tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>\n`;
                });
                contentHtml += `                    </table>\n`;
            }
        } else if (block.type === 'divider') {
            contentHtml += `                    <hr>\n`;
        }
    });

    return `<!DOCTYPE html>
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
                    <img src="../icons/logo-bnr.png" width="32" height="32" alt="Beerpedia Logo">
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
                    <div class="article-icon">${icon}</div>
                    <h1>${title}</h1>
                    <p class="subtitle">${subtitle}</p>
                    <p class="article-author">
                        <span style="color:#eee;">${author}</span> // <span style="font-style:italic;">${role}</span>
                    </p>
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
}

window.generateHTML = () => {
    document.getElementById('export-code').value = getExportHTML();
    document.getElementById('export-modal').classList.remove('hidden');
};

window.downloadHTML = () => {
    const html = getExportHTML();
    const title = document.getElementById('meta-title').value || 'article';
    const filename = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '.html';

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// --- Import ---
window.processImport = () => {
    const code = document.getElementById('import-code').value;
    if (!code) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, 'text/html');

    const title = doc.querySelector('title') ? doc.querySelector('title').innerText.split(' - ')[0] : 'Titre Importé';
    const h1 = doc.querySelector('h1') ? doc.querySelector('h1').innerText : title;
    const subtitle = doc.querySelector('.subtitle') ? doc.querySelector('.subtitle').innerText : '';
    const iconEl = doc.querySelector('.article-icon');
    const icon = iconEl ? iconEl.innerText : '🍺';

    document.getElementById('meta-title').value = h1;
    document.getElementById('meta-subtitle').value = subtitle;
    document.getElementById('meta-icon').value = icon;

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
            const divs = el.querySelectorAll('div > div:nth-child(2)');
            if (divs.length >= 3) {
                volume = divs[0].innerText;
                abv = divs[1].innerText;
                type = divs[2].innerText;
            }
            blocks.push({ id, type: 'signature', content: { volume, abv, type } });
        } else if (el.tagName === 'BLOCKQUOTE') {
            blocks.push({ id, type: 'callout', content: el.innerText.trim() });
        } else if (el.tagName === 'DETAILS') {
            const summary = el.querySelector('summary');
            const p = el.querySelector('p');
            blocks.push({
                id, type: 'faq', content: {
                    question: summary ? summary.innerText : '',
                    answer: p ? p.innerText : ''
                }
            });
        } else if (el.tagName === 'TABLE') {
            const rows = Array.from(el.querySelectorAll('tr')).map(tr =>
                Array.from(tr.querySelectorAll('th, td')).map(c => c.innerText).join(',')
            ).join('\n');
            blocks.push({ id, type: 'table', content: rows });
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

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', (e) => {
    // Ctrl+S: Save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveDraft();
        showAutoSaveIndicator();
    }
    // Ctrl+E: Export
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        generateHTML();
    }
    // Formatting in active textarea
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
        const id = active.id?.replace('input-', '');
        if (id) {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                insertTag(id, '<b>', '</b>');
            }
            if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                insertTag(id, '<i>', '</i>');
            }
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                insertTag(id, '<u>', '</u>');
            }
        }
    }
});

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    // Auto-save indicator
    const header = document.querySelector('.sidebar-header');
    if (header) {
        const ind = document.createElement('div');
        ind.id = 'autosave-indicator';
        ind.innerText = 'Sauvegardé ✓';
        ind.style = 'color:var(--success); font-size:0.7rem; margin-top:5px; opacity:0; transition:opacity 0.3s; text-align:right;';
        header.appendChild(ind);
    }
    loadDrafts();
    initFirebaseUI(); // Initialize Firebase Logic
});

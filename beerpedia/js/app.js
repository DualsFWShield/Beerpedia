import { GUIDE_HTML } from './guide_content.js';
import * as UI from '../../js/ui.js';

const mainContent = document.getElementById('main-content');

// Init
function init() {
    renderView();
}

function renderView() {
    mainContent.innerHTML = '';

    // We only render the guide here. 
    // Articles are now separate HTML files.
    UI.renderGuide(mainContent);
}

// Start
document.addEventListener('DOMContentLoaded', init);

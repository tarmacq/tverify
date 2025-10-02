// ===============================================
// widget.js - Tarmacq Verify Frontend Widget
// ===============================================

// 1. Configuration - REPLACE WITH YOUR PROJECT DETAILS
const SUPABASE_URL = 'https://<YOUR-PROJECT-REF>.supabase.co/rest/v1/rpc/'; 
const WIDGET_ID = 'tarmacq-verify-widget-container';
const PLACEHOLDER_ID = 'captcha-placeholder'; // Target ID for customers to use

// Global state to store important data
window.TarmacqVerify = {
    siteKey: null,
    challengeId: null,
    selectedPositions: [],
    apiUrl: SUPABASE_URL
};

// ===============================================
// Core Initialization Function (Runs on load)
// ===============================================
(function initializeWidget() {
    // 1. Read the customer's site key from the script tag
    const currentScript = document.currentScript;
    const customerSiteKey = currentScript ? currentScript.getAttribute('data-secret') : null;

    if (!customerSiteKey) {
        console.error('Tarmacq Verify Error: data-secret attribute is missing. Widget disabled.');
        return;
    }
    window.TarmacqVerify.siteKey = customerSiteKey;

    // 2. Inject CSS (Assume a simple inline style or load external CSS)
    injectStyles();

    // 3. Inject the basic widget HTML into the placeholder
    const placeholder = document.getElementById(PLACEHOLDER_ID);
    if (!placeholder) {
        console.error(`Tarmacq Verify Error: Placeholder div #${PLACEHOLDER_ID} not found.`);
        return;
    }

    placeholder.innerHTML = `
        <div id="${WIDGET_ID}" class="tv-state-default">
            <div class="tv-checkbox-box" tabindex="0" role="checkbox" aria-checked="false"></div>
            <span class="tv-label">I am not a robot</span>
            <span class="tv-branding">tarmacq verify</span>
        </div>
    `;

    // 4. Attach event listener to the checkbox
    document.querySelector('.tv-checkbox-box').addEventListener('click', startTarmacqChallenge);
    document.querySelector('.tv-checkbox-box').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startTarmacqChallenge();
        }
    });
})();

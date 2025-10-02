// ===============================================
// widget.js - Tarmacq Verify Frontend Widget
// ===============================================

// -----------------------------------------------
// 1. Configuration - REPLACE THIS VALUE
// -----------------------------------------------
const SUPABASE_URL = 'https://lxtaitbzpvdzyonxhfmm.supabase.co/rest/v1/rpc/'; 
const WIDGET_ID = 'tarmacq-verify-widget-container';
const PLACEHOLDER_ID = 'captcha-placeholder'; 

// Global state to manage the challenge
window.TarmacqVerify = {
    siteKey: null,
    challengeId: null,
    selectedPositions: [],
    apiUrl: SUPABASE_URL
};

// ===============================================
// Core Initialization (Runs automatically on script load)
// ===============================================
(function initializeWidget() {
    // 1. Read the customer's site key from the script tag
    const currentScript = document.currentScript;
    const customerSiteKey = currentScript ? currentScript.getAttribute('data-secret') : null;

    if (!customerSiteKey) {
        console.error('tarmacq Verify Error: data-secret attribute is missing. Widget disabled.');
        return;
    }
    window.TarmacqVerify.siteKey = customerSiteKey;

    // 2. Inject Styles
    injectStyles();

    // 3. Inject the basic widget HTML into the placeholder
    const placeholder = document.getElementById(PLACEHOLDER_ID);
    if (!placeholder) {
        console.error(`tarmacq Verify Error: Placeholder div #${PLACEHOLDER_ID} not found.`);
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
    const checkbox = document.querySelector('.tv-checkbox-box');
    checkbox.addEventListener('click', startTarmacqChallenge);
    checkbox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startTarmacqChallenge();
        }
    });
})();

// ===============================================
// 2. Challenge Generation and Modal Display
// ===============================================

async function startTarmacqChallenge() {
    const checkbox = document.querySelector('.tv-checkbox-box');
    
    // Set loading state
    checkbox.classList.add('tv-loading');
    checkbox.classList.remove('tv-success', 'tv-error');
    setHiddenField('tarmacq_solved', '');

    try {
        const response = await fetch(window.TarmacqVerify.apiUrl + 'generate_challenge_rpc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': window.TarmacqVerify.siteKey 
            },
            body: JSON.stringify({
                client_secret: window.TarmacqVerify.siteKey 
            })
        });

        const data = await response.json();

        if (response.ok && data.challenge_id && data.images) {
            window.TarmacqVerify.challengeId = data.challenge_id;
            checkbox.classList.remove('tv-loading');
            openImageGridModal(data.prompt, data.images);
        } else {
            throw new Error(data.error || 'Failed to generate challenge.');
        }

    } catch (error) {
        console.error('Tarmacq Verify API Error:', error);
        showErrorState();
    }
}


function openImageGridModal(prompt, images) {
    window.TarmacqVerify.selectedPositions = []; // Reset selections

    const modal = document.createElement('dialog');
    modal.id = 'tv-modal';
    
    // Create the image grid HTML from the received images array
    const imageGridHTML = images.map((img, index) => `
        <div class="tv-tile" data-position="${index + 1}" role="button" tabindex="0">
            <img src="${img.url}" alt="Challenge image ${index + 1}">
            <div class="tv-selection-overlay"></div>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="tv-modal-content">
            <h3>Select all squares containing: <strong>${prompt}</strong></h3>
            <div class="tv-image-grid">
                ${imageGridHTML}
            </div>
            <button id="tv-modal-verify-btn" disabled>VERIFY</button>
            <span class="tv-branding-modal">tarmacq verify</span>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.showModal(); 

    // Attach grid click handlers
    modal.querySelectorAll('.tv-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            tile.classList.toggle('selected');
            const position = parseInt(tile.dataset.position);

            const index = window.TarmacqVerify.selectedPositions.indexOf(position);
            if (index > -1) {
                window.TarmacqVerify.selectedPositions.splice(index, 1);
            } else {
                window.TarmacqVerify.selectedPositions.push(position);
            }

            const verifyBtn = document.getElementById('tv-modal-verify-btn');
            verifyBtn.disabled = window.TarmacqVerify.selectedPositions.length === 0;
        });
    });

    // Attach final verification handler
    document.getElementById('tv-modal-verify-btn').addEventListener('click', () => {
        submitUserAnswer(modal);
    });
}


// ===============================================
// 3. Submission and State Management
// ===============================================

async function submitUserAnswer(modal) {
    const verifyBtn = document.getElementById('tv-modal-verify-btn');
    
    verifyBtn.textContent = 'Verifying...';
    verifyBtn.disabled = true;

    try {
        const response = await fetch(window.TarmacqVerify.apiUrl + 'verify_tarmacq_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': window.TarmacqVerify.siteKey
            },
            body: JSON.stringify({
                user_secret: window.TarmacqVerify.siteKey,
                challenge_id: window.TarmacqVerify.challengeId,
                user_positions: window.TarmacqVerify.selectedPositions
            })
        });

        const result = await response.json();

        if (result.success) {
            showSuccessState();
        } else {
            showErrorState();
        }
        
    } catch (error) {
        console.error('tarmacq Verify Verification Error:', error);
        showErrorState();
    } finally {
        modal.close();
        modal.remove();
    }
}


function showSuccessState() {
    const checkbox = document.querySelector('.tv-checkbox-box');
    checkbox.classList.remove('tv-loading', 'tv-error');
    checkbox.classList.add('tv-success');
    
    // Set hidden fields for the customer's form to submit
    setHiddenField('tarmacq_solved', 'true');
    setHiddenField('tarmacq_challenge_id', window.TarmacqVerify.challengeId);
}

function showErrorState() {
    const checkbox = document.querySelector('.tv-checkbox-box');
    checkbox.classList.remove('tv-loading', 'tv-success');
    checkbox.classList.add('tv-error');
    
    // Clear fields to prevent fraudulent submission
    setHiddenField('tarmacq_solved', '');
    setHiddenField('tarmacq_challenge_id', '');
}

function setHiddenField(name, value) {
    // Look for the input field globally in the document
    let field = document.querySelector(`input[name="${name}"]`);
    
    // If not found, create it and attach it to the placeholder
    if (!field) {
        field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        document.getElementById(PLACEHOLDER_ID).appendChild(field);
    }
    field.value = value;
}

// ----------------------------------------------------------------------
// CSS Injection (Injects necessary styling for the widget and modal)
// ----------------------------------------------------------------------
function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* General Reset for Isolation */
        #${WIDGET_ID}, #${WIDGET_ID} *, #tv-modal, #tv-modal * {
            box-sizing: border-box;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }

        /* 1. Base Widget Styles */
        #${WIDGET_ID} { 
            display: inline-flex; 
            align-items: center; 
            padding: 8px 12px; 
            border: 1px solid #D1D5DB; 
            border-radius: 4px; 
            background-color: #F9FAFB;
            font-size: 14px;
            color: #4B5563;
        }
        .tv-checkbox-box { 
            width: 20px; 
            height: 20px; 
            border: 2px solid #6B7280; 
            margin-right: 10px; 
            cursor: pointer; 
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 2px;
            transition: all 0.2s ease;
        }
        .tv-branding {
            font-size: 10px;
            color: #9CA3AF;
            margin-left: 15px;
            opacity: 0.7;
            text-transform: uppercase;
        }

        /* 2. State Styles (The core visual feedback) */
        .tv-loading .tv-checkbox-box { 
            border-color: #F59E0B; /* Orange */
            /* You would use an animated spinner here in a real product */
        }
        .tv-success .tv-checkbox-box { 
            background-color: #10B981; /* Green */
            border-color: #10B981;
            /* Placeholder for Checkmark (replace with SVG icon) */
            content: '✓'; 
            color: white; 
            font-weight: bold;
            font-size: 16px;
        }
        .tv-error .tv-checkbox-box { 
            background-color: #EF4444; /* Red */
            border-color: #EF4444;
            /* Placeholder for X (replace with SVG icon) */
            content: '✕'; 
            color: white;
            font-weight: bold;
            font-size: 16px; 
        }

        /* 3. Modal Styles */
        #tv-modal::backdrop {
            background: rgba(0, 0, 0, 0.7);
        }
        #tv-modal { 
            border: none; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); 
            max-width: 400px;
            width: 90%;
            text-align: center;
        }
        .tv-modal-content h3 {
            font-size: 16px;
            margin-bottom: 15px;
            color: #1F2937;
        }
        .tv-image-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 5px; 
            margin-bottom: 20px; 
        }
        .tv-tile { 
            position: relative; 
            width: 100%;
            padding-bottom: 100%; /* Creates a square container */
            cursor: pointer; 
            overflow: hidden; 
            background-color: #E5E7EB;
        }
        .tv-tile img { 
            position: absolute;
            top: 0;
            left: 0;
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            display: block;
        }
        .tv-selection-overlay { 
            position: absolute; 
            top: 0; 
            left: 0; 
            right: 0; 
            bottom: 0; 
            background-color: rgba(255, 193, 7, 0.3); /* Semi-transparent yellow */
            display: none; 
            border: 4px solid #FFC107; /* Tarmacq yellow/gold highlight */
            pointer-events: none; /* Allows click to pass through */
        }
        .tv-tile.selected .tv-selection-overlay { 
            display: block; 
        }
        #tv-modal-verify-btn {
            background-color: #10B981;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        #tv-modal-verify-btn:disabled {
            background-color: #9CA3AF;
            cursor: not-allowed;
        }
        .tv-branding-modal {
            display: block;
            margin-top: 15px;
            font-size: 10px;
            color: #9CA3AF;
            text-transform: uppercase;
        }
    `;
    document.head.appendChild(style);
}

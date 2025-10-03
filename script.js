// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const userEmailEl = document.getElementById('user-email');
const sitesList = document.getElementById('sites-list');

// Toggle auth forms
document.getElementById('signup-btn').onclick = () => {
  document.getElementById('login-form').classList.add('hidden');
  document.getElementById('signup-form').classList.remove('hidden');
};

document.getElementById('back-to-login').onclick = () => {
  document.getElementById('signup-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
};

// Auth handlers
document.getElementById('login-btn').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert('Login failed: ' + error.message);
  else checkUser();
};

document.getElementById('do-signup-btn').onclick = async () => {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert('Signup failed: ' + error.message);
  else checkUser();
};

document.getElementById('logout-btn').onclick = async () => {
  await supabase.auth.signOut();
  authSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
};

// Add new site
document.getElementById('add-site-btn').onclick = async () => {
  const domain = document.getElementById('new-domain').value.trim();
  if (!domain) return alert('Please enter a domain');
  
  const siteKey = 'tq_site_' + Math.random().toString(36).substring(2, 15);
  const secretKey = 'tq_secret_' + Math.random().toString(36).substring(2, 30) + Date.now();

  const { error } = await supabase.from('sites').insert({
    domain,
    site_key: siteKey,
    secret_key: secretKey
  });

  if (error) alert('Failed to add site: ' + error.message);
  else {
    document.getElementById('new-domain').value = '';
    loadSites();
  }
};

// Load user's sites
async function loadSites() {
  const { data, error } = await supabase.from('sites').select('*').order('created_at', { ascending: false });
  if (error) return console.error(error);
  
  if (data.length === 0) {
    sitesList.innerHTML = '<p>No sites added yet.</p>';
    return;
  }

  let html = '<h2>Your Sites</h2>';
  data.forEach(site => {
    const scriptTag = '<script src="https://tarmacq.github.io/tverify/widget.js" data-sitekey="' + site.site_key + '"></script>';
    html += `
      <div class="card">
        <h3>${site.domain}</h3>
        <p><strong>Site Key:</strong></p>
        <div class="key-box">${site.site_key}</div>
        <p><strong>Secret Key:</strong> (keep this private!)</p>
        <div class="key-box">${site.secret_key}</div>
        <p>✅ Add this to your site's HTML:</p>
        <pre>${scriptTag}</pre>
      </div>
    `;
  });
  sitesList.innerHTML = html;
}

// Check auth state
async function checkUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Auth check error:', error);
    return;
  }
  if (data.user) {
    authSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    userEmailEl.textContent = data.user.email;
    loadSites();
  } else {
    authSection.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkUser);
} else {
  checkUser();
}

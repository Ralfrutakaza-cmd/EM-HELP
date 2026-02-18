// État de l'application
let currentUser = null;
let incidents = [];
let currentTab = 'inscription';

// DOM Elements
const sections = {
    login: document.getElementById('loginSection'),
    main: document.getElementById('mainContent')
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadIncidents();
    setupEventListeners();
    checkUserStatus();
    switchTab('inscription'); // Onglet par défaut
});

// Gestion des sections
function showSection(section) {
    Object.values(sections).forEach(s => s.classList.add('hidden'));
    if (section === 'login') {
        sections.login.classList.remove('hidden');
    } else {
        sections.main.classList.remove('hidden');
    }
}

// Écouteurs d'événements
function setupEventListeners() {
    // Formulaire signalement
    document.getElementById('incidentForm').addEventListener('submit', handleSubmit);
    
    // Recherche et filtres
    document.getElementById('search').addEventListener('input', filterIncidents);
    document.getElementById('filterType').addEventListener('change', filterIncidents);
    
    // Formulaires auth
    document.getElementById('inscriptionForm').addEventListener('submit', handleInscription);
    document.getElementById('connexionForm').addEventListener('submit', handleConnexion);
}

// === GESTION INSCRIPTION ===
function handleInscription(e) {
    e.preventDefault();
    
    const userData = {
        nom: document.getElementById('nom').value.trim(),
        prenom: document.getElementById('prenom').value.trim(),
        filiere: document.getElementById('filiere').value.trim(),
        matricule: document.getElementById('matricule').value.trim(),
        anonymat: document.getElementById('anonymat').checked,
        email: document.getElementById('email').value.trim(),
        password: btoa(document.getElementById('password').value), // Hash simple
        id: Date.now(),
        joined: new Date().toISOString()
    };
    
    // Validation
    if (!userData.nom || !userData.prenom || !userData.filiere || !userData.matricule || !userData.email || !userData.password) {
        showNotification('❌ Tous les champs obligatoires sont requis', 'error');
        return;
    }
    
    // Vérifier doublons
    if (!saveUser(userData)) {
        return;
    }
    
    // Succès
    showNotification('✅ Inscription réussie ! Connectez-vous maintenant.', 'success');
    e.target.reset();
    switchTab('connexion');
}

// === GESTION CONNEXION ===
function handleConnexion(e) {
    e.preventDefault();
    
    const matricule = document.getElementById('conn_matricule').value.trim();
    const sessionAnonymat = document.getElementById('conn_anonymat').checked;
    
    if (!matricule) {
        showNotification('❌ Matricule requis', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('emgUsers') || '[]');
    const user = users.find(u => u.matricule === matricule);
    
    if (user) {
        currentUser = {
            ...user,
            sessionAnonymat: sessionAnonymat
        };
        localStorage.setItem('emgCurrentUser', JSON.stringify(currentUser));
        updateUserStatus();
        showSection('main');
        document.getElementById('logoutBtn').style.display = 'block';
        showNotification(`✅ Bienvenue ${user.prenom} !`, 'success');
    } else {
        showNotification('❌ Matricule non trouvé', 'error');
    }
}

// === SAUVEGARDE UTILISATEUR ===
function saveUser(userData) {
    const users = JSON.parse(localStorage.getItem('emgUsers') || '[]');
    const existing = users.find(u => u.matricule === userData.matricule || u.email === userData.email);
    
    if (existing) {
        showNotification('❌ Matricule ou email déjà utilisé', 'error');
        return false;
    }
    
    users.push(userData);
    localStorage.setItem('emgUsers', JSON.stringify(users));
    return true;
}

// === SWITCH TABS ===
function switchTab(tab) {
    currentTab = tab;
    
    // Cacher tous les tabs
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    
    // Activer le bon tab
    document.getElementById(tab + 'Tab').classList.add('active');
    document.getElementById(tab + 'TabBtn').classList.add('active');
}

// === SOUMISSION FORMULAIRE SIGNALEMENT ===
function handleSubmit(e) {
    e.preventDefault();
    
    const data = {
        titre: document.getElementById('titre').value,
        type: document.getElementById('type').value,
        description: document.getElementById('description').value,
        urgence: document.getElementById('urgence').value,
        pseudo: getDisplayName(),
        timestamp: new Date().toISOString()
    };

    saveIncident(data);
    
    e.target.reset();
    document.getElementById('urgence').value = 'Moyenne';
    
    showNotification('✅ Signalement envoyé anonymement !', 'success');
    loadIncidents();
}

// Nom affiché selon règles anonymat
function getDisplayName() {
    if (!currentUser) return 'Anonyme';
    if (currentUser.sessionAnonymat || currentUser.anonymat) return 'Anonyme';
    return `${currentUser.prenom} ${currentUser.nom}`;
}

// === FONCTIONS UTILISATEUR ===
function updateUserStatus() {
    if (currentUser) {
        const displayName = getDisplayName();
        document.getElementById('userStatus').textContent = displayName;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('emgCurrentUser');
    document.getElementById('userStatus').textContent = 'Anonyme';
    document.getElementById('logoutBtn').style.display = 'none';
    showSection('main');
    showNotification('👋 Déconnecté avec succès', 'info');
}

function checkUserStatus() {
    const savedUser = localStorage.getItem('emgCurrentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserStatus();
        document.getElementById('logoutBtn').style.display = 'block';
    }
}

// === FONCTIONS INCIDENTS ===
function saveIncident(data) {
    incidents.unshift(data);
    localStorage.setItem('emgIncidents', JSON.stringify(incidents.slice(0, 100)));
}

function loadIncidents() {
    const saved = localStorage.getItem('emgIncidents');
    incidents = saved ? JSON.parse(saved) : [];
    renderIncidents();
    updateCount();
}

function renderIncidents(filteredIncidents = incidents) {
    const list = document.getElementById('incidentList');
    const noIncidents = document.getElementById('noIncidents');
    
    if (filteredIncidents.length === 0) {
        list.innerHTML = '';
        noIncidents.style.display = 'block';
        return;
    }
    
    noIncidents.style.display = 'none';
    
    list.innerHTML = filteredIncidents.map(incident => `
        <li class="${incident.urgence.toLowerCase()}">
            <div style="font-weight: bold; color: #489443; margin-bottom: 0.5rem;">
                ${incident.titre}
                <span style="font-size: 0.8rem; background: #ff6b6b; color: white; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: 1rem;">
                    ${incident.urgence}
                </span>
            </div>
            <div style="color: #666; margin-bottom: 0.5rem;">
                <strong>${incident.type}</strong>
            </div>
            <div style="color: #444; line-height: 1.5;">${incident.description}</div>
            <div style="font-size: 0.85rem; color: #888; margin-top: 1rem; border-top: 1px solid #e8f5e8; padding-top: 0.5rem;">
                Par ${incident.pseudo} • ${new Date(incident.timestamp).toLocaleString('fr-FR')}
            </div>
        </li>
    `).join('');
}

function filterIncidents() {
    const search = document.getElementById('search').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    
    const filtered = incidents.filter(incident => {
        const matchesSearch = incident.titre.toLowerCase().includes(search) ||
                            incident.description.toLowerCase().includes(search) ||
                            incident.type.toLowerCase().includes(search);
        const matchesType = !filterType || incident.type === filterType;
        return matchesSearch && matchesType;
    });
    
    renderIncidents(filtered);
}

function updateCount() {
    document.getElementById('count').textContent = incidents.length > 0 ? `(${incidents.length})` : '';
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

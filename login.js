// Handle authentication state
function isLoggedIn() {
    const savedPassword = localStorage.getItem('gelvano_password');
    const savedStudentName = localStorage.getItem('gelvano_student_name');
    return !!(savedPassword && savedStudentName);
}

function showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden');
}

function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    overlay.classList.add('hidden');
    setTimeout(() => { overlay.style.display = 'none'; }, 400);
}

function showLoginButton() {
    const profileContainer = document.getElementById('profileContainer');
    if (profileContainer) {
        profileContainer.innerHTML = `
            <button id="loginButton" class="login-button">
                تسجيل الدخول
                <i class="fas fa-sign-in-alt"></i>
            </button>
        `;
        profileContainer.style.display = 'block';
        
        document.getElementById('loginButton').addEventListener('click', () => {
            showLoginOverlay();
        });
    }
}

function showProfileUI(name, password) {
    const profileContainer = document.getElementById('profileContainer');
    if (profileContainer) {
        profileContainer.innerHTML = `
            <i class="fas fa-user-circle profile-icon" id="profileIcon"></i>
        `;
        // Create modal if not exists
        let modal = document.getElementById('profileModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'profileModal';
            modal.className = 'profile-modal-overlay';
            modal.innerHTML = `
                <div class="profile-modal-box">
                    <span class="profile-modal-close" id="profileModalClose">&times;</span>
                    <div class="profile-info-item">
                        <strong>الاسم:</strong> <span id="profileNameModal">${name}</span>
                    </div>
                    <div class="profile-info-item">
                        <strong>ID:</strong> <span id="profilePasswordModal">${password}</span>
                    </div>
                    <div class="profile-info-item logout-item">
                        <button id="logoutButtonModal" class="logout-button">
                            <i class="fas fa-sign-out-alt"></i>
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        const profileIcon = document.getElementById('profileIcon');
        const profileModal = document.getElementById('profileModal');
        const profileModalClose = document.getElementById('profileModalClose');
        const logoutButtonModal = document.getElementById('logoutButtonModal');
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileModal.style.display = 'flex';
        });
        profileModalClose.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });
        logoutButtonModal.addEventListener('click', () => {
            localStorage.removeItem('gelvano_password');
            localStorage.removeItem('gelvano_student_name');
            location.reload();
        });
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
    }
}

// Check video access
function checkVideoAccess(element) {
    if (!isLoggedIn()) {
        element.preventDefault();
        const alertOverlay = document.createElement('div');
        alertOverlay.className = 'alert-overlay';
        alertOverlay.innerHTML = `
            <div class="alert-box">
                <i class="fas fa-exclamation-circle"></i>
                <h3>تنبيه</h3>
                <p>يرجى تسجيل الدخول أولاً للوصول إلى المحتوى</p>
                <button id="alertLoginBtn" class="alert-login-btn">تسجيل الدخول</button>
            </div>
        `;
        document.body.appendChild(alertOverlay);
        
        document.getElementById('alertLoginBtn').addEventListener('click', () => {
            alertOverlay.remove();
            showLoginOverlay();
        });
        
        alertOverlay.addEventListener('click', (e) => {
            if (e.target === alertOverlay) {
                alertOverlay.remove();
            }
        });
        return false;
    }
    return true;
}

// Initialize authentication
document.addEventListener('DOMContentLoaded', async function() {
    const loginBtn = document.getElementById('loginBtn');
    const form = document.getElementById('loginForm');
    const studentNameInput = document.getElementById('studentName');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('loginError');
    
    let allowedPasswords = [];
    let passwordsLoaded = false;

    // Fetch passwords
    async function fetchAllowedPasswords() {
        passwordsLoaded = false;
        try {
            const fileRes = await fetch('passwords.json', { cache: 'no-store' });
            if (!fileRes.ok) throw new Error('passwords.json not found');
            allowedPasswords = await fileRes.json();
        } catch (_) {
            allowedPasswords = [];
        } finally {
            passwordsLoaded = true;
        }
    }
    
    await fetchAllowedPasswords();

    // Initial UI state
    if (isLoggedIn()) {
        const savedPassword = localStorage.getItem('gelvano_password');
        const savedStudentName = localStorage.getItem('gelvano_student_name');
        showProfileUI(savedStudentName, savedPassword);
        hideLoginOverlay();
    } else {
        showLoginButton();
        hideLoginOverlay();
    }

    // Login form handling
    function validateLogin() {
        if (!passwordsLoaded) {
            errorDiv.textContent = 'جاري تحميل كلمات السر...';
            return false;
        }
        const studentName = studentNameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!studentName) {
            errorDiv.textContent = 'يرجى إدخال اسم الطالب بالعربية';
            return false;
        }
        if (!/^[FST][0-9]{4}$/.test(password)) {
            errorDiv.textContent = 'كلمة المرور يجب أن تبدأ بحرف (F/S/T) ثم 4 أرقام';
            return false;
        }
        if (!allowedPasswords.map(p => p.trim().toUpperCase()).includes(password.toUpperCase().trim())) {
            errorDiv.textContent = 'كلمة المرور غير صحيحة أو غير مسجلة';
            return false;
        }
        errorDiv.textContent = '';
        return true;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const studentName = studentNameInput.value.trim();
        const password = passwordInput.value.trim();
        if (validateLogin()) {
            localStorage.setItem('gelvano_password', password);
            localStorage.setItem('gelvano_student_name', studentName);
            hideLoginOverlay();
            showProfileUI(studentName, password);
        }
    });

    loginBtn.addEventListener('click', () => form.dispatchEvent(new Event('submit')));
    
    // Add video access check to all video links
    document.querySelectorAll('a[href*="videos"], a[href*="media"]').forEach(link => {
        link.addEventListener('click', checkVideoAccess);
    });
});
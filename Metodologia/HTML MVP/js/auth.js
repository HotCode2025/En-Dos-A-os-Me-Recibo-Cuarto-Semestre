/**
 * San Rafael Movilidad - Sistema de Autenticación, Registro y Perfil
 * Almacenamiento local mediante localStorage (sr_movilidad_users / sr_movilidad_session)
 */
(function () {
    const USERS_KEY = "sr_movilidad_users";
    const SESSION_KEY = "sr_movilidad_session";

    function initDefaultUsers() {
        if (!localStorage.getItem(USERS_KEY)) {
            const initialUsers = [
                {
                    id: "user-demo-1",
                    name: "Miguel Pérez",
                    email: "usuario@sanrafael.com",
                    password: "password123",
                    zone: "Centro",
                    favoriteLine: "511",
                    createdAt: new Date().toLocaleDateString("es-AR")
                }
            ];
            localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
        }
    }

    function getUsers() {
        initDefaultUsers();
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem(SESSION_KEY));
        } catch {
            return null;
        }
    }

    function setSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        updateNavbarSession();
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        updateNavbarSession();
    }

    function updateNavbarSession() {
        const session = getSession();
        document.querySelectorAll(".btn-login").forEach(btn => {
            if (session) {
                const firstName = session.name.split(" ")[0];
                btn.textContent = `👤 ${firstName}`;
                btn.title = `Conectado como ${session.name}`;
            } else {
                btn.textContent = "Mi Cuenta";
                btn.title = "Acceso y registro";
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        initDefaultUsers();
        updateNavbarSession();

        const tabLogin = document.querySelector("#tab-login");
        const tabRegister = document.querySelector("#tab-register");
        const loginForm = document.querySelector("#login-form");
        const registerForm = document.querySelector("#register-form");
        const authContainer = document.querySelector("#auth-container");
        const profileContainer = document.querySelector("#profile-container");
        const authAlert = document.querySelector("#auth-alert");
        const btnLogout = document.querySelector("#btn-logout");

        function showAlert(message, type = "error") {
            if (!authAlert) return;
            authAlert.textContent = message;
            authAlert.className = `form-alert is-${type}`;
            authAlert.hidden = false;
        }

        function clearAlert() {
            if (!authAlert) return;
            authAlert.textContent = "";
            authAlert.className = "form-alert";
            authAlert.hidden = true;
        }

        function switchTab(tab) {
            clearAlert();
            if (tab === "register") {
                tabLogin?.classList.remove("active");
                tabRegister?.classList.add("active");
                if (loginForm) loginForm.hidden = true;
                if (registerForm) registerForm.hidden = false;
            } else {
                tabRegister?.classList.remove("active");
                tabLogin?.classList.add("active");
                if (registerForm) registerForm.hidden = true;
                if (loginForm) loginForm.hidden = false;
            }
        }

        tabLogin?.addEventListener("click", () => switchTab("login"));
        tabRegister?.addEventListener("click", () => switchTab("register"));

        function renderProfile(user) {
            if (!profileContainer || !authContainer) return;
            authContainer.hidden = true;
            profileContainer.hidden = false;

            const nameEl = document.querySelector("#profile-name");
            const emailEl = document.querySelector("#profile-email");
            const zoneEl = document.querySelector("#profile-zone");
            const lineEl = document.querySelector("#profile-line");
            const dateEl = document.querySelector("#profile-date");
            const avatarEl = document.querySelector("#profile-avatar-initials");

            if (nameEl) nameEl.textContent = user.name;
            if (emailEl) emailEl.textContent = user.email;
            if (zoneEl) zoneEl.textContent = user.zone || "San Rafael Centro";
            if (lineEl) lineEl.textContent = user.favoriteLine ? `Línea ${user.favoriteLine}` : "Línea 511";
            if (dateEl) dateEl.textContent = user.createdAt || "Reciente";

            if (avatarEl) {
                const parts = user.name.trim().split(" ");
                const initials = parts.length > 1
                    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                    : (parts[0].slice(0, 2)).toUpperCase();
                avatarEl.textContent = initials || "SR";
            }
        }

        function checkCurrentView() {
            const session = getSession();
            if (session && profileContainer && authContainer) {
                renderProfile(session);
            } else if (profileContainer && authContainer) {
                authContainer.hidden = false;
                profileContainer.hidden = true;
            }
        }

        // Login Handler
        loginForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            clearAlert();

            const emailInput = document.querySelector("#login-email");
            const passwordInput = document.querySelector("#login-pass");
            const email = emailInput?.value.trim().toLowerCase() || "";
            const password = passwordInput?.value || "";

            const users = getUsers();
            const found = users.find(u => u.email.toLowerCase() === email && u.password === password);

            if (!found) {
                showAlert("Correo electrónico o contraseña incorrectos.", "error");
                return;
            }

            setSession(found);
            renderProfile(found);
        });

        // Register Handler
        registerForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            clearAlert();

            const name = document.querySelector("#register-name")?.value.trim() || "";
            const email = document.querySelector("#register-email")?.value.trim().toLowerCase() || "";
            const zone = document.querySelector("#register-zone")?.value || "Centro";
            const favoriteLine = document.querySelector("#register-line")?.value || "511";
            const password = document.querySelector("#register-pass")?.value || "";
            const confirmPass = document.querySelector("#register-confirm-pass")?.value || "";

            if (!name || !email || !password) {
                showAlert("Por favor completa los campos obligatorios.", "error");
                return;
            }

            if (password.length < 6) {
                showAlert("La contraseña debe tener al menos 6 caracteres.", "error");
                return;
            }

            if (password !== confirmPass) {
                showAlert("Las contraseñas ingresadas no coinciden.", "error");
                return;
            }

            const users = getUsers();
            const existing = users.find(u => u.email.toLowerCase() === email);
            if (existing) {
                showAlert("Ya existe una cuenta registrada con este correo electrónico.", "error");
                return;
            }

            const newUser = {
                id: "user-" + Date.now(),
                name,
                email,
                zone,
                favoriteLine,
                password,
                createdAt: new Date().toLocaleDateString("es-AR")
            };

            users.push(newUser);
            saveUsers(users);
            setSession(newUser);
            renderProfile(newUser);
        });

        // Logout Handler
        btnLogout?.addEventListener("click", () => {
            clearSession();
            if (profileContainer && authContainer) {
                profileContainer.hidden = true;
                authContainer.hidden = false;
                switchTab("login");
                showAlert("Has cerrado sesión correctamente.", "info");
            }
        });

        checkCurrentView();
    });
})();

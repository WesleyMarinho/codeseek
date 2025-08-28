// frontend/public/js/auth.js

class Auth {
    constructor() {
        this.logoutButton = document.getElementById('logout-button');
    }

    /**
     * Attaches registration functionality to a form.
     * @param {HTMLFormElement} formElement The form element for registration.
     */
    attachRegister(formElement) {
        if (!formElement) return;

        formElement.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = formElement.querySelector('#name').value;
            const email = formElement.querySelector('#email').value;
            const password = formElement.querySelector('#password').value;
            const confirmPassword = formElement.querySelector('#confirm-password').value;
            const submitButton = formElement.querySelector('button[type="submit"]');
            const errorMessageDiv = document.getElementById('error-message');

            if (errorMessageDiv) {
                errorMessageDiv.textContent = '';
                errorMessageDiv.classList.add('hidden');
            }
            
            if (password !== confirmPassword) {
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'Passwords do not match.';
                    errorMessageDiv.classList.remove('hidden');
                } else {
                    alert('Passwords do not match.');
                }
                return;
            }
            
            if(submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Registering...';
            }

            try {
                const response = await fetch('/register', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                const data = await response.json();
                if (data.success) {
                    window.location.href = data.redirectUrl;
                } else {
                    if (errorMessageDiv) {
                        errorMessageDiv.textContent = data.message || 'An unknown error occurred.';
                        errorMessageDiv.classList.remove('hidden');
                    } else {
                        alert(data.message);
                    }
                }
            } catch (error) {
                console.error('Registration request failed:', error);
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'Could not connect to the server. Please try again later.';
                    errorMessageDiv.classList.remove('hidden');
                } else {
                    alert('Could not connect to the server.');
                }
            } finally {
                if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Register';
                }
            }
        });
    }

    /**
     * Attaches login functionality to a form.
     * @param {HTMLFormElement} formElement The form element for login.
     */
    attachLogin(formElement) {
        if (!formElement) return;

        formElement.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = formElement.querySelector('#email').value;
            const password = formElement.querySelector('#password').value;
            const submitButton = formElement.querySelector('button[type="submit"]');
            const errorMessageDiv = document.getElementById('error-message');

            if (errorMessageDiv) {
                errorMessageDiv.textContent = '';
                errorMessageDiv.classList.add('hidden');
            }
            if(submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Logging in...';
            }

            try {
                // The login route is handled by web.js, not api.js
                const response = await fetch('/login', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();
                if (data.success) {
                    window.location.href = data.redirectUrl;
                } else {
                    if (errorMessageDiv) {
                        errorMessageDiv.textContent = data.message || 'An unknown error occurred.';
                        errorMessageDiv.classList.remove('hidden');
                    } else {
                        alert(data.message);
                    }
                }
            } catch (error) {
                console.error('Login request failed:', error);
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'Could not connect to the server. Please try again later.';
                    errorMessageDiv.classList.remove('hidden');
                } else {
                    alert('Could not connect to the server.');
                }
            } finally {
                if(submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Login';
                }
            }
        });
    }

    /**
     * Attaches logout functionality to the logout button.
     */
    attachLogout() {
        if (!this.logoutButton) return;
        this.logoutButton.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                // The logout route is handled by web.js, not api.js
                const response = await fetch('/logout', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    window.location.href = data.redirectUrl;
                } else {
                    if (typeof showNotification === 'function') {
                        showNotification(data.message || 'Logout failed.', 'error');
                    } else {
                        alert(data.message || 'Logout failed.');
                    }
                }
            } catch (error) {
                console.error('Logout request failed:', error);
                if (typeof showNotification === 'function') {
                    showNotification('Could not connect to the server.', 'error');
                } else {
                    alert('Could not connect to the server.');
                }
            }
        });
    }
}

// Auto-initialize for different pages
document.addEventListener('DOMContentLoaded', () => {
    const auth = new Auth();
    
    // Attach login logic if on the login page
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        auth.attachLogin(loginForm);
    }
    
    // Attach register logic if on the register page
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        auth.attachRegister(registerForm);
    }
    
    // Attach logout logic on any page that has a logout button
    if (document.getElementById('logout-button')) {
        auth.attachLogout();
    }
});
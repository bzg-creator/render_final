document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Function to toggle between forms
    window.toggleForm = function() {
        loginForm.classList.toggle('active');
        registerForm.classList.toggle('active');
    };

    // Show register form if there's a registration error
    if (document.querySelector('#registerForm .error-message')) {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }

    // Show login form if there's a login error
    if (document.querySelector('#loginForm .error-message')) {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    }
});
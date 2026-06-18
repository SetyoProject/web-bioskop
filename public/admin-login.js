const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

async function loginAdmin(event) {

    event.preventDefault();

    const formData = new FormData(loginForm);

    const payload = {

        username: formData.get('username'),

        password: formData.get('password')

    };

    try {

        const response = await fetch(
            '/api/admin/login',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        if (!response.ok) {

            loginMessage.textContent =
                result.message;

            loginMessage.style.color =
                'red';

            return;

        }

        window.location.href =
            '/panel-admin';

    }

    catch (error) {

        loginMessage.textContent =
            'Terjadi kesalahan';

    }

}

loginForm?.addEventListener(
    'submit',
    loginAdmin
);
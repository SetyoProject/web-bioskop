const movieTable = document.getElementById('movieTable');

const movieCount = document.getElementById('movieCount');
const bookingCount = document.getElementById('bookingCount');
const totalRevenue = document.getElementById('totalRevenue');

const addMovieForm = document.getElementById('addMovieForm');

const logoutButton = document.getElementById('logoutButton');

function rupiah(value) {

    return new Intl.NumberFormat(
        'id-ID',
        {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }
    ).format(value);

}


// ======================
// Dashboard Summary
// ======================
async function fetchSummary() {

    try {

        const response =
            await fetch('/api/admin/summary');

        if (!response.ok) {

            window.location.href =
                '/admin';

            return;

        }

        const summary =
            await response.json();

        if (movieCount) {

            movieCount.textContent =
                summary.movieCount;

        }

        if (bookingCount) {

            bookingCount.textContent =
                summary.bookingCount;

        }

        if (totalRevenue) {

            totalRevenue.textContent =
                rupiah(summary.totalRevenue);

        }

    }

    catch (error) {

        console.error(error);

    }

}


// ======================
// Ambil data film
// ======================
async function fetchMovies() {

    try {

        const response =
            await fetch('/api/admin/movies');

        if (!response.ok) {

            window.location.href =
                '/admin';

            return;

        }

        const movies =
            await response.json();

        renderMovies(movies);

    }

    catch (error) {

        console.error(error);

    }

}


// ======================
// Tampilkan film
// ======================
function renderMovies(movies) {

    if (!movieTable) return;

    if (movies.length === 0) {

        movieTable.innerHTML = `
        <tr>
            <td colspan="7">
                Belum ada film
            </td>
        </tr>
        `;

        return;

    }

    movieTable.innerHTML =
        movies.map(movie => `

        <tr>

            <td>${movie.id}</td>

            <td>${movie.title}</td>

            <td>${movie.genre}</td>

            <td>${movie.schedule}</td>

            <td>${movie.availableSeats}</td>

            <td>${rupiah(movie.price)}</td>

            <td>

                <button
                    onclick="deleteMovie(${movie.id})">

                    Hapus

                </button>

            </td>

        </tr>

    `).join('');

}


// ======================
// Tambah Film
// ======================
async function addMovie(event) {

    event.preventDefault();

    const formData =
        new FormData(addMovieForm);

    const payload = {

        title:
            formData.get('title'),

        genre:
            formData.get('genre'),

        duration:
            formData.get('duration'),

        schedule:
            formData.get('schedule'),

        price:
            formData.get('price'),

        availableSeats:
            formData.get('availableSeats')

    };

    try {

        const response =
            await fetch(
                '/api/admin/movies',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(payload)
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            alert(result.message);

            return;

        }

        alert('Film berhasil ditambahkan');

        addMovieForm.reset();

        fetchMovies();

        fetchSummary();

    }

    catch (error) {

        console.error(error);

    }

}


// ======================
// Hapus Film
// ======================
async function deleteMovie(id) {

    const konfirmasi =
        confirm(
            'Yakin ingin menghapus film ini?'
        );

    if (!konfirmasi) return;

    try {

        const response =
            await fetch(
                `/api/admin/movies/${id}`,
                {
                    method: 'DELETE'
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            alert(result.message);

            return;

        }

        alert('Film berhasil dihapus');

        fetchMovies();

        fetchSummary();

    }

    catch (error) {

        console.error(error);

    }

}


// ======================
// Logout Admin
// ======================
async function logoutAdmin() {

    try {

        await fetch(
            '/api/admin/logout',
            {
                method: 'POST'
            }
        );

        window.location.href =
            '/admin';

    }

    catch (error) {

        console.error(error);

    }

}


// ======================
// Event
// ======================
addMovieForm?.addEventListener(
    'submit',
    addMovie
);

logoutButton?.addEventListener(
    'click',
    logoutAdmin
);


// ======================
// Load Awal
// ======================
fetchSummary();

fetchMovies();

const menuToggle =
    document.querySelector('.menu-toggle');

const sidebar =
    document.getElementById('sidebar');

menuToggle?.addEventListener(
    'click',
    () => {

        sidebar.classList.toggle(
            'active'
        );

    }
);
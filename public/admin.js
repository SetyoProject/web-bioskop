const movieCount =
    document.getElementById('movieCount');

const bookingCount =
    document.getElementById('bookingCount');

const totalRevenue =
    document.getElementById('totalRevenue');

const ticketCount =
    document.getElementById('ticketCount');

const logoutButton =
    document.getElementById('logoutButton');

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
// Tambah / Update Film
// ======================
async function addMovie(event) {

    event.preventDefault();

    const formData =
        new FormData(
            addMovieForm
        );

    const editId =
        addMovieForm.dataset
            .editId;

    try {

        const response =
            await fetch(

                editId
                    ? `/api/admin/movies/${editId}`
                    : '/api/admin/movies',

                {

                    method:
                        editId
                            ? 'PATCH'
                            : 'POST',

                    body:
                        formData

                }

            );

        const result =
            await response.json();

        if (!response.ok) {

            alert(
                result.message
            );

            return;

        }

        alert(

            editId
                ? 'Film berhasil diperbarui'
                : 'Film berhasil ditambahkan'

        );

        delete
            addMovieForm.dataset
                .editId;

        addMovieForm.reset();

        if (
            posterPreview
        ) {

            posterPreview.src = '';

            posterPreview.style.display =
                'none';

        }

        fetchMovies();
        fetchSummary();

    }

    catch (error) {

        console.error(
            error
        );

    }

}

document.getElementById(
    'movieFormContainer'
).innerHTML = `
<div class="box">

    <h2>Tambah Film Baru</h2>

    <form id="addMovieForm">

        <input
            type="text"
            name="title"
            placeholder="Judul Film"
            required
        >

        <input
            type="text"
            name="genre"
            placeholder="Genre"
            required
        >

        <input
            type="number"
            name="duration"
            placeholder="Durasi (Menit)"
            required
        >

        <input
            type="text"
            name="schedule"
            placeholder="Jadwal Tayang"
            required
        >

        <input
            type="number"
            name="price"
            placeholder="Harga Tiket"
            required
        >

        <input
            type="number"
            name="availableSeats"
            placeholder="Jumlah Kursi"
            required
        >

        <div class="poster-upload">

            <label>Poster Film</label>

            <input
                type="file"
                id="posterInput"
                name="poster"
                accept="image/*"
            >

            <img
                id="posterPreview"
                class="poster-preview"
                style="display:none"
            >

        </div>

        <button type="submit">
            Tambah Film
        </button>

    </form>

</div>
`;

document.getElementById(
    'movieListContainer'
).innerHTML = `
<div class="box">

    <h2>Daftar Film</h2>

    <div class="table-container">

        <table>

            <thead>

                <tr>
                    <th>No</th>
                    <th>Poster</th>
                    <th>Judul</th>
                    <th>Genre</th>
                    <th>Jadwal</th>
                    <th>Kursi</th>
                    <th>Harga</th>
                    <th>Aksi</th>
                </tr>

            </thead>

            <tbody id="movieTable">

            </tbody>

        </table>

    </div>

</div>
`;

document.getElementById(
    'bookingContainer'
).innerHTML = `
<div class="box">

    <h2>Booking Terbaru</h2>

    <div class="table-container">

        <table>

            <thead>

                <tr>
                    <th>Kode Booking</th>
                    <th>Nama</th>
                    <th>Film</th>
                    <th>Total</th>
                    <th>Status</th>
                </tr>

            </thead>

            <tbody id="latestBookings">

            </tbody>

        </table>

    </div>

</div>
`;

const movieTable =
    document.getElementById('movieTable');

const addMovieForm =
    document.getElementById('addMovieForm');

const posterInput =
    document.getElementById('posterInput');

const posterPreview =
    document.getElementById('posterPreview');

const latestBookings =
    document.getElementById('latestBookings');

    posterInput?.addEventListener(
    'change',
    () => {

        const file =
            posterInput.files[0];

        if (!file)
            return;

        posterPreview.src =
            URL.createObjectURL(file);

        posterPreview.style.display =
            'block';

    }
);
async function fetchLatestBookings() {

    try {

        const response =
            await fetch(
                '/api/bookings'
            );

        const bookings =
            await response.json();

        if (!latestBookings)
            return;

        if (bookings.length === 0) {

            latestBookings.innerHTML = `
                <tr>
                    <td colspan="5">
                        Belum ada booking
                    </td>
                </tr>
            `;

            return;
        }

        latestBookings.innerHTML =
            bookings
                .slice(-5)
                .reverse()
                .map(booking => `

                    <tr>

                        <td>
                            ${booking.id}
                        </td>

                        <td>
                            ${booking.customerName}
                        </td>

                        <td>
                            ${booking.items
                                .map(
                                    item =>
                                        item.title
                                )
                                .join(', ')
                            }
                        </td>

                        <td>
                            ${rupiah(
                                booking.total
                            )}
                        </td>

                        <td>
                            ${booking.status}
                        </td>

                    </tr>

                `)
                .join('');

    }

    catch (error) {

        console.error(error);

    }

}

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

        movieCount.textContent =
            summary.movieCount;

        bookingCount.textContent =
            summary.bookingCount;

        totalRevenue.textContent =
            rupiah(summary.totalRevenue);

        ticketCount.textContent =
            summary.ticketCount;

    }

    catch (error) {
        console.error(error);
    }

}

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


function renderMovies(movies) {

    if (!movieTable)
        return;

    if (movies.length === 0) {

        movieTable.innerHTML = `
            <tr>
                <td colspan="8">
                    Belum ada film
                </td>
            </tr>
        `;

        return;
    }

    movieTable.innerHTML =
        movies.map(
            (movie, index) => `

            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>

                    <img
                        src="${
                            movie.poster ||
                            '/uploads/no-image.jpg'
                        }?t=${movie.updatedAt}"
                        class="poster-thumb"
                    >

                </td>

                <td>${movie.title}</td>
                <td>${movie.genre}</td>
                <td>${movie.schedule}</td>
                <td>${movie.availableSeats}</td>
                <td>${rupiah(movie.price)}</td>

                <td>

                    <button
                        class="edit-btn"
                        data-id="${movie.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${movie.id}"
                    >
                        Hapus
                    </button>

                </td>

            </tr>

        `
        ).join('');

        document
    .querySelectorAll(
        '.edit-btn'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                editMovie(
                    Number(
                        button.dataset.id
                    )
                );

            }
        );

    });

document
    .querySelectorAll(
        '.delete-btn'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            () => {

                deleteMovie(
                    Number(
                        button.dataset.id
                    )
                );

            }
        );

    });

}
async function deleteMovie(id) {

    const konfirmasi =
        confirm(
            'Yakin ingin menghapus film ini?'
        );

    if (!konfirmasi)
        return;

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

            alert(
                result.message
            );

            return;

        }

        alert(
            result.message
        );

        fetchMovies();
        fetchSummary();

    }

    catch (error) {

        console.error(error);

    }

}

// ======================
// Edit Film
// ======================
async function editMovie(id) {

    try {

        const response =
            await fetch(
                '/api/admin/movies'
            );

        const movies =
            await response.json();

        const movie =
            movies.find(
                item =>
                    item.id === id
            );

        if (!movie) {

            alert(
                'Film tidak ditemukan'
            );

            return;

        }

        addMovieForm.title.value =
            movie.title;

        addMovieForm.genre.value =
            movie.genre;

        addMovieForm.duration.value =
            movie.duration;

        addMovieForm.schedule.value =
            movie.schedule;

        addMovieForm.price.value =
            movie.price;

        addMovieForm.availableSeats.value =
            movie.availableSeats;

        if (
            movie.poster &&
            posterPreview
        ) {

            posterPreview.src =
                movie.poster;

            posterPreview.style.display =
                'block';

        }

        addMovieForm.dataset.editId =
            id;

        const submitButton =
            addMovieForm.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {

            submitButton.textContent =
                'Update Film';

        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

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

addMovieForm?.addEventListener(
    'submit',
    addMovie
);

logoutButton?.addEventListener(
    'click',
    logoutAdmin
);

const menuToggle =
    document.querySelector(
        '.menu-toggle'
    );

const sidebar =
    document.querySelector(
        '.sidebar'
    );

menuToggle?.addEventListener(
    'click',
    () => {

        sidebar.classList.toggle(
            'active'
        );

    }
);

fetchSummary();
fetchMovies();
fetchLatestBookings();
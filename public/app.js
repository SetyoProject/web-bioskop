const movieGrid = document.getElementById('movieGrid');

const searchInput = document.getElementById('searchInput');

const searchButton = document.getElementById('searchButton');

const cartItems = document.getElementById('cartItems');

const cartTotal = document.getElementById('cartTotal');

const checkoutForm = document.getElementById('checkoutForm');

const checkoutMessage = document.getElementById('checkoutMessage');

const cartBadge = document.getElementById('cartBadge');

let movies = [];

let cart =
    JSON.parse(
        localStorage.getItem('bioskop-cart')
    ) || [];

let selectedMovie = null;


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


function saveCart() {

    localStorage.setItem(
        'bioskop-cart',
        JSON.stringify(cart)
    );

    updateCartBadge();

}


function updateCartBadge() {

    if (!cartBadge) return;

    const totalItems =
        cart.reduce(
            (sum, item) =>
                sum +
                Number(item.quantity),
            0
        );

    cartBadge.textContent =
        totalItems;

}


async function fetchMovies() {

    const params =
        new URLSearchParams();

    if (
        searchInput &&
        searchInput.value.trim()
    ) {

        params.set(
            'search',
            searchInput.value.trim()
        );

    }

    const response =
        await fetch(
            `/api/movies?${params.toString()}`
        );

    movies =
        await response.json();

    renderMovies();

}


function renderMovies() {

    if (!movieGrid) return;

    if (movies.length === 0) {

        movieGrid.innerHTML =
            '<p>Tidak ada film.</p>';

        return;

    }

    movieGrid.innerHTML =
        movies.map(movie => `

        <article class="movie-card">

            <img
                src="${movie.poster}"
                alt="${movie.title}"
            >

            <h3>
                ${movie.title}
            </h3>

            <p>
                Genre :
                ${movie.genre}
            </p>

            <p>
                Jadwal :
                ${movie.schedule}
            </p>

            <p>
                Durasi :
                ${movie.duration} menit
            </p>

            <p>
                Harga :
                ${rupiah(movie.price)}
            </p>

            <p>
                Kursi tersedia :
                ${movie.availableSeats}
            </p>

            <button
    onclick="openBooking(${movie.id})"
>
    Pesan Tiket
</button>

        </article>

    `).join('');

}


async function addToCart() {
    const selectedSeats =
        [...document.querySelectorAll('.seat.selected')]
            .map(seat => Number(seat.dataset.seat));

    if (selectedSeats.length === 0) {
        alert('Pilih kursi terlebih dahulu.');
        return;
    }

    const studio =
        document.getElementById('studioSelect').value;

    const schedule =
        document.getElementById('scheduleSelect').value;

    const existing =
        cart.find(item =>
            item.movieId === selectedMovie.id &&
            item.studio === studio &&
            item.schedule === schedule
        );

    if (existing) {

        existing.seats = Array.from(
            new Set([
                ...existing.seats,
                ...selectedSeats
            ])
        );

        existing.quantity =
            existing.seats.length;

        existing.subtotal =
            existing.quantity *
            existing.price;

    } else {

        cart.push({
            movieId: selectedMovie.id,
            title: selectedMovie.title,
            studio,
            schedule,
            seats: selectedSeats,
            quantity: selectedSeats.length,
            price: selectedMovie.price,
            subtotal:
                selectedMovie.price *
                selectedSeats.length
        });

    }

    saveCart();
    renderCart();
    await loadBookedSeats();
    renderSeats();
    showToast(
        `🎟️ ${selectedMovie.title}
     (${selectedSeats.length} tiket)
     berhasil ditambahkan`
    );

    document
        .getElementById(
            'bookingModal'
        )
        .style.display =
        'none';
}

function showToast(message) {

    const toast =
        document.getElementById(
            'toast'
        );

    if (!toast) return;

    toast.innerHTML = `
        <div class="toast-message">
            ${message}
        </div>
    `;

    setTimeout(() => {

        toast.innerHTML = '';

    }, 5000);

}


function removeFromCart(
    movieId,
    studio,
    schedule
) {

    cart =
        cart.filter(
            item =>
                !(
                    item.movieId === movieId &&
                    item.studio === studio &&
                    item.schedule === schedule
                )
        );

    saveCart();

    renderCart();

    refreshSeats();

}


function renderCart() {

    if (
        !cartItems ||
        !cartTotal
    ) {

        updateCartBadge();

        return;

    }

    if (cart.length === 0) {

        cartItems.innerHTML =
            '<p>Keranjang kosong.</p>';

        cartTotal.textContent =
            rupiah(0);

        return;

    }

    cartItems.innerHTML =
    cart.map(item => `

    <div class="cart-item">

        <div>

            <strong>
                ${item.title}
            </strong>

            <p>
                Studio :
                ${item.studio}
            </p>

            <p>
                Jam :
                ${item.schedule}
            </p>

            <p>
                Kursi :
                ${item.seats.join(', ')}
            </p>

            <p>
                ${item.quantity} tiket
            </p>

        </div>

        <div>
            ${rupiah(item.subtotal)}
        </div>

        <button
            onclick="
                removeFromCart(
                    ${item.movieId},
                    '${item.studio}',
                    '${item.schedule}'
                )"
        >
            Hapus
        </button>

    </div>

`).join('');

    const total =
    cart.reduce(
        (sum, item) =>
            sum +
            item.subtotal,
        0
    );

    cartTotal.textContent =
        rupiah(total);

}

async function submitCheckout(
    event
) {

    event.preventDefault();

    if (cart.length === 0) {

        alert(
            'Keranjang masih kosong'
        );

        return;
    }

    const formData =
        new FormData(
            checkoutForm
        );

    const payload = {

        customerName:
            formData.get(
                'customerName'
            ),

        phoneNumber:
            formData.get(
                'phoneNumber'
            ),

        paymentMethod:
            formData.get(
                'paymentMethod'
            ),

        items:
            cart.map(item => ({
                movieId:
                    item.movieId,

                title:
                    item.title,

                studio:
                    item.studio,

                schedule:
                    item.schedule,

                seats:
                    item.seats,

                quantity:
                    item.quantity,

                price:
                    item.price,

                subtotal:
                    item.subtotal
            }))
    };

    // WAJIB ADA
    const response =
        await fetch(
            '/api/bookings',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

    const result =
        await response.json();

    console.log(result);

    if (!response.ok) {

        checkoutMessage.textContent =
            result.message;

        return;
    }

    checkoutMessage.innerHTML =
        `Booking berhasil.
        Kode Booking:
        <strong>
            ${result.booking.id}
        </strong>`;

    cart = [];

    saveCart();

    renderCart();

    checkoutForm.reset();

    window.location.href =
        `/booking-success.html?id=${result.booking.id}`;
}


searchButton?.addEventListener(
    'click',
    fetchMovies
);

checkoutForm?.addEventListener(
    'submit',
    submitCheckout
);

  //untuk membuat modal booking
  async function openBooking(movieId) {

    selectedMovie =
        movies.find(
            movie =>
                movie.id === movieId
        );

    const studioSelect =
        document.getElementById(
            'studioSelect'
        );

    const scheduleSelect =
        document.getElementById(
            'scheduleSelect'
        );

    studioSelect.onchange =
        async () => {

            await loadBookedSeats();

            renderSeats();

        };

    scheduleSelect.onchange =
        async () => {

            await loadBookedSeats();

            renderSeats();

        };

    await loadBookedSeats();

    renderSeats();

    document
        .getElementById(
            'bookingModal'
        )
        .style.display =
        'flex';
}

let bookedSeats = [];


function renderSeats() {

    const seatContainer =
        document.getElementById(
            'seatContainer'
        );

    if (!seatContainer) {

        console.error(
            'seatContainer tidak ditemukan'
        );

        return;

    }

    seatContainer.innerHTML = '';

    for (
        let i = 1;
        i <= 20;
        i++
    ) {

        const seat =
            document.createElement(
                'div'
            );

        seat.classList.add(
            'seat'
        );

        seat.dataset.seat =
            i;

        seat.textContent =
            i;

        if (
            bookedSeats.includes(i)
        ) {

            seat.classList.add(
                'booked'
            );

        } else {

            seat.addEventListener(
                'click',
                () => {

                    seat.classList.toggle(
                        'selected'
                    );

                }
            );

        }

        seatContainer.appendChild(
            seat
        );

    }

}



async function loadBookedSeats() {

    
    const response =
        await fetch('/api/bookings');

    const bookings =
        await response.json();

    const studio =
        document.getElementById(
            'studioSelect'
        ).value;

    const schedule =
        document.getElementById(
            'scheduleSelect'
        ).value;

    bookedSeats =
        bookedSeats =
    bookings
        .flatMap(
            booking =>
                booking.items || []
        )
        .filter(
            item =>
                selectedMovie &&
                item.movieId ===
                    selectedMovie.id &&
                item.studio ===
                    studio &&
                item.schedule ===
                    schedule
        )
        .flatMap(
            item =>
                item.seats || []
        );
}

document
    .querySelector('.close')
    ?.addEventListener(
        'click',
        () => {

            document
                .getElementById(
                    'bookingModal'
                )
                .style.display =
                'none';

        }
    );

    document
    .getElementById('confirmSeat')
    ?.addEventListener(
        'click',
        addToCart
    );

    window.onclick = (event) => {

    const modal =
        document.getElementById(
            'bookingModal'
        );

    if (event.target === modal) {

        modal.style.display =
            'none';

    }

};
//cetak struk
async function loadTicket() {

    if (
        !window.location.pathname
            .startsWith('/ticket/')
    ) {

        return;

    }

    const bookingId =
        window.location.pathname
            .split('/')
            .pop();

    const response =
        await fetch(
            '/api/bookings'
        );

    const bookings =
        await response.json();

    const booking =
        bookings.find(
            item =>
                item.id ===
                bookingId
        );

    if (!booking) return;

    renderTicket(
        booking
    );

}

loadTicket();

function renderTicket(
    booking
) {

    const ticket =
        document.getElementById(
            'ticketContainer'
        );

    if (!ticket) return;

    const item =
        booking.items[0];

    ticket.innerHTML = `
<div class="ticket">

    <div class="ticket-header">
        <h1>🎬 CinemaKu</h1>
        <p>E-Tiket Bioskop</p>
    </div>

    <div class="ticket-qr">
        <img
            src="
https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${booking.id}
            "
        >
    </div>

    <div class="ticket-detail">

        <div class="ticket-row">
            <span>Kode Booking</span>
            <strong>${booking.id}</strong>
        </div>

        <div class="ticket-row">
            <span>Nama</span>
            <strong>${booking.customerName}</strong>
        </div>

        <div class="ticket-row">
            <span>Film</span>
            <strong>${item.title}</strong>
        </div>

        <div class="ticket-row">
            <span>Studio</span>
            <strong>${item.studio}</strong>
        </div>

        <div class="ticket-row">
            <span>Jadwal</span>
            <strong>${item.schedule}</strong>
        </div>

        <div class="ticket-row">
            <span>Kursi</span>
            <strong>${item.seats.join(', ')}</strong>
        </div>

        <div class="ticket-row total">
            <span>Total</span>
            <strong>${rupiah(booking.total)}</strong>
        </div>

    </div>

    <p class="ticket-note">
        Tunjukkan tiket ini kepada petugas bioskop
    </p>

    <div class="ticket-actions">
        <button
            class="print-btn"
            onclick="window.print()"
        >
            🖨️ Cetak Tiket
        </button>
    </div>

</div>
`;
}




fetchMovies();

renderCart();
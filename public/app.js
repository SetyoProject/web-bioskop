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
                onclick="addToCart(${movie.id})"
            >
                Pesan Tiket
            </button>

        </article>

    `).join('');

}


function addToCart(movieId) {

    const movie =
        movies.find(
            item =>
                item.id === movieId
        );

    if (!movie) return;

    const existing =
        cart.find(
            item =>
                item.movieId === movieId
        );

    if (existing) {

        if (
            existing.quantity >=
            movie.availableSeats
        ) {

            alert(
                'Jumlah tiket melebihi kursi tersedia'
            );

            return;

        }

        existing.quantity++;

    } else {

        cart.push({

            movieId:
                movie.id,

            title:
                movie.title,

            price:
                movie.price,

            quantity:
                1

        });

    }

    saveCart();

    renderCart();

}


function updateQuantity(
    movieId,
    action
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.movieId === movieId
        );

    if (!item) return;

    if (action === 'plus') {

        item.quantity++;

    }

    if (action === 'minus') {

        item.quantity--;

    }

    if (item.quantity < 1) {

        cart =
            cart.filter(
                cartItem =>
                    cartItem.movieId !== movieId
            );

    }

    saveCart();

    renderCart();

}


function removeFromCart(movieId) {

    cart =
        cart.filter(
            item =>
                item.movieId !== movieId
        );

    saveCart();

    renderCart();

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

            <strong>
                ${item.title}
            </strong>

            <p>
                ${rupiah(item.price)}
            </p>

            <button
                onclick="
                updateQuantity(
                ${item.movieId},
                'minus'
                )">
                -
            </button>

            ${item.quantity}

            <button
                onclick="
                updateQuantity(
                ${item.movieId},
                'plus'
                )">
                +
            </button>

            <button
                onclick="
                removeFromCart(
                ${item.movieId}
                )">
                x
            </button>

        </div>

    `).join('');

    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                item.price *
                item.quantity,
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

                quantity:
                    item.quantity

            }))

    };

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

}


searchButton?.addEventListener(
    'click',
    fetchMovies
);

checkoutForm?.addEventListener(
    'submit',
    submitCheckout
);


fetchMovies();

renderCart();
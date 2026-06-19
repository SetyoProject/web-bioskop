console.log('scan.js terbaca');
console.log(typeof Html5Qrcode);
const ticketResult =
    document.getElementById(
        'ticketResult'
    );

let scanner =
    null;

async function onScanSuccess(
    bookingId
) {

    if (scanner) {

        await scanner.pause();

    }

    try {

        const response =
            await fetch(
                `/api/bookings/${bookingId}`
            );

        if (!response.ok) {

            throw new Error();

        }

        const booking =
            await response.json();

        if (
            booking.isUsed
        ) {

            ticketResult.innerHTML = `

                <h2
                    class="ticket-used"
                >
                    🔴 Tiket
                    Sudah Digunakan
                </h2>

                <p>
                    ${booking.id}
                </p>

            `;

            return;
        }

        ticketResult.innerHTML = `

            <h2
                class="ticket-valid"
            >
                ✅ Tiket Valid
            </h2>

            <p>
                <b>Kode:</b>
                ${booking.id}
            </p>

            <p>
                <b>Nama:</b>
                ${
                    booking.customerName
                }
            </p>

            <p>
                <b>Film:</b>
                ${
                    booking.items
                        .map(
                            item =>
                                item.title
                        )
                        .join(', ')
                }
            </p>

            <p>
                <b>Total:</b>
                Rp${booking.total}
            </p>

            <button
                class="checkin-btn"
                onclick="
                    confirmTicket(
                        '${booking.id}'
                    )
                "
            >
                Konfirmasi Masuk
            </button>

        `;

    }

    catch {

        ticketResult.innerHTML = `

            <h2
                class="ticket-notfound"
            >
                ⚠️ Tiket
                Tidak Ditemukan
            </h2>

        `;

    }

}

async function confirmTicket(
    id
) {

    const response =
        await fetch(
            `/api/bookings/${id}/checkin`,
            {
                method:
                    'PATCH'
            }
        );

    const result =
        await response.json();

    alert(
        result.message
    );

    ticketResult.innerHTML = `

        <h2
            class="ticket-valid"
        >
            ✅ Tiket Berhasil
            Digunakan
        </h2>

        <p>
            ${id}
        </p>

    `;

    setTimeout(
        () => {

            ticketResult.innerHTML =
                'Arahkan QR tiket ke kamera.';

            scanner.resume();

        },
        2000
    );

}

window.addEventListener(
    'load',
    async () => {

        console.log('halaman scan dimulai');

        try {

            const cameras =
                await Html5Qrcode
                    .getCameras();

            console.log(cameras);

        }

        catch (error) {

            console.error(error);

        }

    }
);
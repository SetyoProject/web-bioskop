console.log('scan.js terbaca');
console.log(typeof Html5Qrcode);

const ticketResult =
    document.getElementById(
        'ticketResult'
    );

const cameraInfo =
    document.getElementById(
        'cameraInfo'
    );

let scanner = null;
let cameras = [];
let currentCamera = 0;


// ======================
// Scan berhasil
// ======================
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

        if (booking.isUsed) {

            ticketResult.innerHTML = `
                <h2 class="ticket-used">
                    🔴 Tiket Sudah Digunakan
                </h2>

                <p>
                    ${booking.id}
                </p>
            `;

            return;
        }

        ticketResult.innerHTML = `
            <h2 class="ticket-valid">
                ✅ Tiket Valid
            </h2>

            <p>
                <b>Kode:</b>
                ${booking.id}
            </p>

            <p>
                <b>Nama:</b>
                ${booking.customerName}
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
                Rp${booking.total.toLocaleString(
                    'id-ID'
                )}
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
                ⚠️ Tiket Tidak Ditemukan
            </h2>
        `;

    }

}


// ======================
// Konfirmasi check in
// ======================
async function confirmTicket(
    id
) {

    const response =
        await fetch(
            `/api/bookings/${id}/checkin`,
            {
                method: 'PATCH'
            }
        );

    const result =
        await response.json();

    alert(
        result.message
    );

    ticketResult.innerHTML = `
        <h2 class="ticket-valid">
            ✅ Tiket Berhasil Digunakan
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


// ======================
// Membuka kamera
// ======================
async function startScanner() {

    try {

        cameras =
            await Html5Qrcode
                .getCameras();

        console.log(
            cameras
        );

        if (
            !cameras.length
        ) {

            ticketResult.innerHTML =
                'Kamera tidak ditemukan';

            return;

        }

        scanner =
            new Html5Qrcode(
                'reader'
            );

        await scanner.start(

            cameras[currentCamera].id,

            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250
                }
            },

            onScanSuccess

        );

        if (cameraInfo) {

            cameraInfo.textContent =
                `Menggunakan: ${
                    cameras[currentCamera]
                        .label ||
                    `Kamera ${
                        currentCamera + 1
                    }`
                }`;

        }

    }

    catch (error) {

        console.error(error);

        ticketResult.innerHTML =
            'Gagal membuka kamera';

    }

}


// ======================
// Ganti kamera
// ======================
async function switchCamera() {

    if (
        cameras.length < 2
    ) {

        alert(
            'Hanya ada satu kamera.'
        );

        return;

    }

    await scanner.stop();

    currentCamera =
        (currentCamera + 1) %
        cameras.length;

    await scanner.start(

        cameras[currentCamera].id,

        {
            fps: 10,
            qrbox: {
                width: 250,
                height: 250
            }
        },

        onScanSuccess

    );

    if (cameraInfo) {

        cameraInfo.textContent =
            `Menggunakan: ${
                cameras[currentCamera]
                    .label ||
                `Kamera ${
                    currentCamera + 1
                }`
            }`;

    }

}


// ======================
// Load halaman
// ======================
window.addEventListener(
    'load',
    startScanner
);

document
    .getElementById(
        'switchCamera'
    )
    ?.addEventListener(
        'click',
        switchCamera
    );
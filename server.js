
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const dataPath = path.join(__dirname, 'data');
const moviesFile = path.join(dataPath, 'movies.json');
const bookingsFile = path.join(dataPath, 'bookings.json');

const publicPath = path.join(__dirname, 'public');
const uploadsPath = path.join(publicPath, 'uploads');

const PDFDocument =
    require('pdfkit');

const QRCode =
    require('qrcode');

const axios =
    require('axios');

const storage =
    multer.diskStorage({

        destination:
            (req,file,
                cb
            ) => {
                cb(
                    null,
                    uploadsPath
                );
            },
        filename:
            (req,file,
                cb
            ) => {
                const ext =
                    path.extname(
                        file.originalname
                    );
                cb(
                    null,
                    Date.now() + ext
                );
            }
    });

const upload =
    multer({
        storage
    });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const activeAdminTokens = new Set();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.static(publicPath));

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

//membaca file json
function readJson(filePath) {
    try {

        const data = fs.readFileSync(filePath, 'utf8');

        return JSON.parse(data || '[]');

    } catch (error) {

        console.error(error);

        return [];
    }
}

//menyimpan file json
function writeJson(filePath, data) {

    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 2)
    );

}

//kode booking
function formatBookingId() {

    const now = new Date();

    const date =
        now.toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

    const random =
        Math.floor(
            1000 + Math.random() * 9000
        );

    return `BK-${date}-${random}`;
}

//membaca cookie
function getCookie(req, name) {

    const cookieHeader =
        req.headers.cookie || '';

    const cookies =
        cookieHeader
        .split(';')
        .map(item => item.trim())
        .filter(Boolean);

    for (const cookie of cookies) {

        const [key, ...valueParts] =
            cookie.split('=');

        if (key === name) {

            return decodeURIComponent(
                valueParts.join('=')
            );

        }

    }

    return null;

}

//middleware admin
function requireAdmin(req, res, next) {

    const token =
        getCookie(
            req,
            'bioskop_admin_token'
        );

    if (
        !token ||
        !activeAdminTokens.has(token)
    ) {

        return res.status(401).json({
            message:
            'Silakan login sebagai admin'
        });

    }

    next();

}

//ringkasan dashboard pengunjung
function buildPublicSummary() {

    const movies =
        readJson(moviesFile);

    return {

        movieCount:
            movies.length,

        totalSeats:
            movies.reduce(
                (sum, movie) =>
                    sum +
                    Number(movie.availableSeats || 0),
                0
            )

    };

}

//dashboard admin
function buildAdminSummary() {

    const movies =
        readJson(moviesFile);

    const bookings =
        readJson(bookingsFile);

    const totalRevenue =
        bookings.reduce(
            (sum, booking) =>
                sum +
                Number(booking.total || 0),
            0
        );

    return {

        movieCount:
            movies.length,

        bookingCount:
            bookings.length,

        totalRevenue

    };

}

//health check
app.get('/api/health', (req, res) => {

    res.json({

        status: 'ok',

        message:
            'API Bioskop berjalan'

    });

});

//login admin

app.post('/api/admin/login', (req, res) => {

    const { username, password } = req.body;

    if (
        username !== ADMIN_USERNAME ||
        password !== ADMIN_PASSWORD
    ) {

        return res.status(401).json({
            message: 'Username atau password salah'
        });

    }

    const token =
        crypto.randomBytes(32)
        .toString('hex');

    activeAdminTokens.add(token);

    res.cookie(
        'bioskop_admin_token',
        token,
        {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 4
        }
    );

    res.json({
        message: 'Login berhasil',
        redirect: '/panel-admin'
    });

});

//logout admin

app.post('/api/admin/logout', requireAdmin, (req, res) => {

    const token =
        req.cookies.bioskop_admin_token;

    if (token) {
        activeAdminTokens.delete(token);
    }

    res.clearCookie('bioskop_admin_token');

    res.json({
        message: 'Logout berhasil'
    });

});

//info admin yng sedang login
app.get('/api/admin/me', requireAdmin, (req, res) => {

    res.json({
        username: ADMIN_USERNAME,
        role: 'admin'
    });

});

//get semua film

app.get('/api/movies', (req, res) => {

    let movies =
        readJson(moviesFile);

    const {
        search,
        genre,
        sort
    } = req.query;

    // Search judul atau genre
    if (search) {

        const keyword =
            search.toLowerCase();

        movies = movies.filter(movie =>

            `${movie.title} ${movie.genre} ${movie.description}`
            .toLowerCase()
            .includes(keyword)

        );

    }

    // Filter genre
    if (
        genre &&
        genre !== 'all'
    ) {

        movies = movies.filter(movie =>

            movie.genre
            .toLowerCase() ===
            genre.toLowerCase()

        );

    }

    // Urutkan harga tiket
    if (sort === 'low') {

        movies.sort(
            (a, b) =>
            a.price - b.price
        );

    }

    if (sort === 'high') {

        movies.sort(
            (a, b) =>
            b.price - a.price
        );

    }

    res.json(movies);

});

//get details film

app.get('/api/movies/:id', (req, res) => {

    const movies =
        readJson(moviesFile);

    const movie =
        movies.find(

            item =>
            item.id ===
            Number(req.params.id)

        );

    if (!movie) {

        return res.status(404).json({
            message: 'Film tidak ditemukan'
        });

    }

    res.json(movie);

});

//ringkasan public
app.get('/api/summary', (req, res) => {

    res.json(
        buildPublicSummary()
    );

});


// generate pdf
async function generateTicketPdf(
    booking
) {

    const fileName =
        `${booking.id}.pdf`;

    const filePath =
        path.join(
            __dirname,
            'public',
            'uploads',
            fileName
        );

    const doc =
    new PDFDocument({
        size: [420, 700],
        margin: 25
    });

    doc.pipe(
        fs.createWriteStream(
            filePath
        )
    );

    // Card
    doc
        .roundedRect(
            20,
            20,
            380,
            540,
            20
        )
        .stroke('#dddddd');

    // Header
    doc
        .fontSize(24)
        .fillColor('#dc2626')
        .text(
            'CinemaKu',
            {
                align: 'center'
            }
        );

    doc
        .moveDown(0.3)
        .fontSize(13)
        .fillColor('#888')
        .text(
            'E-Ticket Bioskop',
            {
                align: 'center'
            }
        );

    // QR
    const qrUrl =
        `https://web-bioskop.onrender.com/ticket/${booking.id}`;

    const qrImage =
        await QRCode.toDataURL(
            qrUrl
        );

    doc.image(
        Buffer.from(
            qrImage.split(',')[1],
            'base64'
        ),
        140,
        90,
        {
            width: 120
        }
    );

    let y = 250;

    function field(
        label,
        value
    ) {

        doc
            .fontSize(10)
            .fillColor('#777')
            .text(
                label,
                45,
                y
            );

        y += 18;

        doc
            .fontSize(12)
            .fillColor('#111')
            .text(
                value,
                45,
                y
            );

        y += 28;

        doc
            .strokeColor(
                '#eeeeee'
            )
            .moveTo(
                45,
                y
            )
            .lineTo(
                355,
                y
            )
            .stroke();

        y += 15;
    }

    field(
        'Kode Booking',
        booking.id
    );

    field(
        'Nama',
        booking.customerName
    );

    field(
        'Film',
        booking.items[0].title
    );

    field(
        'Studio',
        booking.items[0].studio
    );

    field(
        'Jadwal',
        `${booking.items[0].schedule} WIB`
    );

    field(
        'Kursi',
        booking.items[0].seats.join(
            ', '
        )
    );

    field(
        'Total Pembayaran',
        `Rp${booking.total.toLocaleString(
            'id-ID'
        )}`
    );

    doc
        .moveDown()
        .fontSize(11)
        .fillColor('#666')
        .text(
            'Tunjukkan QR Code ini kepada petugas bioskop',
            {
                align: 'center'
            }
        );

    doc.end();

    booking.ticketPdf =
        `/uploads/${fileName}`;
}
async function generateTicketPdf(
    booking
) {

    const fileName =
        `${booking.id}.pdf`;

    const filePath =
        path.join(
            __dirname,
            'public',
            'uploads',
            fileName
        );

    const doc =
        new PDFDocument({
            size: [420, 650],
            margin: 25
        });

    doc.pipe(
        fs.createWriteStream(
            filePath
        )
    );

    // Card
    doc
        .roundedRect(
            20,
            20,
            380,
            600,
            20
        )
        .stroke('#dddddd');

    // Header
    doc
        .fontSize(24)
        .fillColor('#dc2626')
        .text(
            'CinemaKu',
            {
                align:
                    'center'
            }
        );

    doc
        .moveDown(0.2)
        .fontSize(12)
        .fillColor('#888')
        .text(
            'E-Ticket Bioskop',
            {
                align:
                    'center'
            }
        );

    // QR Code
    const qrUrl =
        `https://web-bioskop.onrender.com/ticket/${booking.id}`;

    const qrImage =
        await QRCode.toDataURL(
            qrUrl
        );

    doc.image(
        Buffer.from(
            qrImage
                .split(',')[1],
            'base64'
        ),
        160,
        85,
        {
            width: 100
        }
    );

    let y = 230;

    function field(
        label,
        value
    ) {

        doc
            .fontSize(10)
            .fillColor('#666')
            .text(
                label,
                50,
                y,
                {
                    width: 110
                }
            );

        doc
            .fontSize(11)
            .fillColor('#111')
            .text(
                `: ${value}`,
                150,
                y,
                {
                    width: 200
                }
            );

        y += 22;

        doc
            .strokeColor(
                '#eeeeee'
            )
            .moveTo(
                50,
                y
            )
            .lineTo(
                350,
                y
            )
            .stroke();

        y += 12;
    }

    field(
        'Kode Booking',
        booking.id
    );

    field(
        'Nama',
        booking.customerName
    );

    field(
        'Film',
        booking.items[0].title
    );

    field(
        'Studio',
        booking.items[0].studio
    );

    field(
        'Jadwal',
        `${booking.items[0].schedule} WIB`
    );

    field(
        'Kursi',
        booking.items[0].seats.join(
            ', '
        )
    );

    field(
        'Total',
        `Rp${booking.total.toLocaleString(
            'id-ID'
        )}`
    );

    // Footer
    doc
        .fontSize(11)
        .fillColor('#666')
        .text(
            'Tunjukkan QR Code ini kepada petugas bioskop',
            50,
            y + 25,
            {
                width: 300,
                align:
                    'center'
            }
        );

    doc.end();

    booking.ticketPdf =
        `/uploads/${fileName}`;
}
//post booking
app.post('/api/bookings', (req, res) => {

    const {
        customerName,
        phoneNumber,
        paymentMethod,
        items
    } = req.body;

    if (
        !customerName ||
        !phoneNumber ||
        !paymentMethod ||
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return res.status(400).json({
            message: 'Data pemesanan belum lengkap'
        });

    }

    const movies = readJson(moviesFile);
    const bookings = readJson(bookingsFile);

    const bookingItems = [];

    for (const item of items) {

    const movie =
        movies.find(
            m =>
                m.id ===
                Number(
                    item.movieId
                )
        );

    const quantity =
        Array.isArray(
            item.seats
        )
            ? item.seats.length
            : Number(
                item.quantity || 1
            );

    bookingItems.push({

        movieId:
            movie.id,

        title:
            movie.title,

        studio:
            item.studio,

        schedule:
            item.schedule,

        seats:
            item.seats,

        price:
            movie.price,

        quantity,

        subtotal:
            movie.price *
            quantity

    });

}
const total =
    bookingItems.reduce(
        (sum, item) =>
            sum +
            item.subtotal,
        0
    );

   const newBooking = {
    id: formatBookingId(),
    customerName,
    phoneNumber,
    paymentMethod,
    items: bookingItems,
    total,

    status: 'Menunggu konfirmasi admin',

    paymentStatus: 'pending',
    ticketStatus: '-',
    isUsed: false,
    scanTime: null,
    ticketPdf: null,

    createdAt: new Date().toISOString()
};

    bookings.push(newBooking);

    writeJson(
        moviesFile,
        movies
    );

    writeJson(
        bookingsFile,
        bookings
    );

    res.status(201).json({

        message:
            'Pemesanan berhasil',

        booking:
            newBooking

    });

});

//get semua booking admin
app.get(
    '/api/admin/bookings',
    requireAdmin,
    (req, res) => {

        const bookings =
            readJson(bookingsFile)
            .sort(
                (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
            );

        res.json(bookings);

});

//update status booking
app.patch(
    '/api/admin/bookings/:id/status',
    requireAdmin,
    (req, res) => {

        const { status } = req.body;

        const allowedStatus = [
            'Menunggu konfirmasi admin',
            'Diproses',
            'Selesai',
            'Dibatalkan'
        ];

        if (
            !allowedStatus.includes(status)
        ) {

            return res.status(400).json({
                message:
                'Status tidak valid'
            });

        }

        const bookings =
            readJson(bookingsFile);

        const booking =
            bookings.find(
                item =>
                item.id === req.params.id
            );

        if (!booking) {

            return res.status(404).json({
                message:
                'Booking tidak ditemukan'
            });

        }

        booking.status = status;

        booking.updatedAt =
            new Date().toISOString();


        booking.paymentStatus =
    'paid';

booking.ticketStatus =
    'Belum Digunakan';

        writeJson(
            bookingsFile,
            bookings
        );

        res.json({

            message:
                'Status berhasil diperbarui',
            booking
        });
});

//dashboard admin
app.get(
    '/api/admin/summary',
    requireAdmin,
    (req, res) => {

        const movies =
            readJson(
                moviesFile
            );

        const bookings =
            readJson(
                bookingsFile
            );

        const bookingCount =
            bookings.length;

        const totalRevenue =
            bookings.reduce(
                (sum, booking) =>
                    sum +
                    Number(
                        booking.total || 0
                    ),
                0
            );

        const ticketCount =
            bookings.reduce(
                (sum, booking) =>

                    sum +

                    booking.items.reduce(
                        (s, item) =>
                            s +
                            Number(
                                item.quantity || 0
                            ),
                        0
                    ),

                0
            );

        res.json({

            movieCount:
                movies.length,

            bookingCount,

            ticketCount,

            totalRevenue

        });

    }
);


//data pelanggan
app.get(
    '/api/admin/customers',
    requireAdmin,
    (req, res) => {

        const bookings =
            readJson(bookingsFile);

        const customers =
            bookings.map(item => ({

                bookingId:
                    item.id,

                customerName:
                    item.customerName,

                phoneNumber:
                    item.phoneNumber,

                total:
                    item.total,

                status:
                    item.status,

                bookingDate:
                    item.createdAt

            }));

        res.json(customers);

});

// ======================
// GET semua film
// ======================
app.get(
    '/api/admin/movies',
    requireAdmin,
    (req, res) => {

        const movies =
            readJson(moviesFile);

        res.json(movies);

});

// ======================
// Tambah film
// ======================
app.post(
    '/api/admin/movies',
    requireAdmin,
    upload.single('poster'),
    (req, res) => {

        console.log(req.body);
console.log(req.file);

        const {

            title,
            genre,
            duration,
            schedule,
            price,
            availableSeats,
            label,
            description,
            poster

        } = req.body;

        if (
            !title ||
            !genre ||
            !duration ||
            !schedule ||
            !price
        ) {

            return res.status(400).json({
                message: 'Data film belum lengkap'
            });

        }

        const movies =
            readJson(moviesFile);

        const nextId =
            movies.reduce(
                (max, movie) =>
                    Math.max(
                        max,
                        Number(movie.id)
                    ),
                0
            ) + 1;

        const newMovie = {

            id: nextId,

            title:
                String(title).trim(),

            genre:
                String(genre).trim(),

            duration:
                Number(duration),

            schedule:
                String(schedule).trim(),

            price:
                Number(price),

            availableSeats:
                Number(availableSeats),

            label:
                String(
                    label || ''
                ).trim(),

            description:
                String(
                    description || ''
                ).trim(),

            poster:
                req.file
                    ? `/uploads/${req.file.filename}`
                    : '/img/default-poster.jpg',

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };

        movies.push(newMovie);

        writeJson(
            moviesFile,
            movies
        );

        res.status(201).json({

            message:
                'Film berhasil ditambahkan',

            movie:
                newMovie

        });

});

// ======================
// Edit film
// ======================
app.patch(
    '/api/admin/movies/:id',
    requireAdmin,
    upload.single('poster'),
    (req, res) => {

        const movies =
            readJson(moviesFile);

        const movie =
            movies.find(

                item =>
                    item.id ===
                    Number(req.params.id)

            );

        if (!movie) {

            return res.status(404).json({
                message:
                    'Film tidak ditemukan'
            });

        }

        const allowedFields = [

            'title',
            'genre',
            'duration',
            'schedule',
            'price',
            'availableSeats',
            'label',
            'description'

        ];

        for (const field of allowedFields) {

    if (
        req.body[field] !== undefined
    ) {

        movie[field] =
            req.body[field];

    }

}

if (req.file) {

    if (
        movie.poster &&
        movie.poster.startsWith('/uploads/')
    ) {

        const oldPath =
            path.join(
                publicPath,
                movie.poster.replace(
                    '/uploads/',
                    'uploads/'
                )
            );

        if (
            fs.existsSync(oldPath)
        ) {

            fs.unlinkSync(
                oldPath
            );

        }

    }

    movie.poster =
        `/uploads/${req.file.filename}`;

}

movie.updatedAt =
    new Date().toISOString();

writeJson(
    moviesFile,
    movies
);

res.json({

    message:
        'Film berhasil diperbarui',

    movie

});

});

// ======================
// Hapus film
// ======================
app.delete(
    '/api/admin/movies/:id',
    requireAdmin,
    (req, res) => {

        const movies =
            readJson(moviesFile);

        const index =
            movies.findIndex(

                item =>
                    item.id ===
                    Number(req.params.id)

            );

        if (index === -1) {

            return res.status(404).json({
                message:
                    'Film tidak ditemukan'
            });

        }

        movies.splice(index, 1);

        writeJson(
            moviesFile,
            movies
        );

        res.json({
            message:
                'Film berhasil dihapus'
        });

});

//kirim pdf ke wa

async function sendWhatsAppTicket(
    booking
) {

    try {

        let phone =
            booking.phoneNumber
                .replace(/\D/g, '');

        if (
            phone.startsWith('0')
        ) {

            phone =
                '62' +
                phone.slice(1);

        }

        const pdfUrl =
            `https://web-bioskop.onrender.com/uploads/${booking.id}.pdf`;

        const message =
`🎬 CinemaKu

Pembayaran berhasil dikonfirmasi.

Kode Booking:
${booking.id}

Film:
${booking.items[0].title}

Studio:
${booking.items[0].studio}

Jadwal:
${booking.items[0].schedule}

📄 Download E-Ticket:
${pdfUrl}

Tunjukkan QR Code pada tiket kepada petugas bioskop.

Selamat menonton 🍿`;

        console.log(
            'Nomor:',
            phone
        );

        console.log(
            'PDF:',
            pdfUrl
        );

        await axios.post(
    'https://api.fonnte.com/send',
    {
        target:
            phone,

        message
    },
    {
        headers: {
            Authorization:
                process.env
                    .FONNTE_TOKEN
        }
    }
);

        console.log(
            'FONNTE:',
            response.data
        );

        console.log(
            'WA berhasil dikirim'
        );

    }

    catch (error) {

        console.log(
            'Gagal kirim WA'
        );

        console.log(
            error.response?.data
        );

    }

}




// Halaman film
app.get('/film', (req, res) => {
    res.sendFile(
        path.join(publicPath, 'film.html')
    );
});

// Halaman checkout
app.get('/checkout', (req, res) => {
    res.sendFile(
        path.join(publicPath, 'checkout.html')
    );
});

// Halaman login admin
app.get('/admin', (req, res) => {
    res.sendFile(
        path.join(publicPath, 'admin-login.html')
    );
});

// Dashboard admin
app.get('/panel-admin', requireAdmin, (req, res) => {
    res.sendFile(
        path.join(__dirname, 'views', 'admin.html')
    );
});

// Halaman transaksi admin
app.get('/panel-admin/transaksi', requireAdmin, (req, res) => {
    res.sendFile(
        path.join(__dirname, 'views', 'admin-transaksi.html')
    );
});

// Halaman pelanggan
app.get('/panel-admin/customer', requireAdmin, (req, res) => {
    res.sendFile(
        path.join(__dirname, 'views', 'admin-customer.html')
    );
});


app.get(
    '/api/bookings',
    (req, res) => {

        console.log(
            'API BOOKINGS DIPANGGIL'
        );
        
        const bookings =
            readJson(
                bookingsFile
            );

        res.json(
            bookings
        );

    }
);

app.get(
    '/api/bookings/:id',
    requireAdmin,
    (req, res) => {

        const bookings =
            readJson(
                bookingsFile
            );

        const booking =
            bookings.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!booking) {

            return res.status(404)
                .json({
                    message:
                        'Booking tidak ditemukan'
                });

        }

        res.json(
            booking
        );

    }
);



app.patch(
    '/api/bookings/:id/checkin',
    requireAdmin,
    (req, res) => {

        const bookings =
            readJson(
                bookingsFile
            );

        const booking =
            bookings.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!booking) {

            return res.status(404)
                .json({
                    message:
                        'Booking tidak ditemukan'
                });

        }

        booking.isUsed =
            true;

        booking.checkInAt =
            new Date()
                .toISOString();

        writeJson(
            bookingsFile,
            bookings
        );

        res.json({

            message:
                'Tiket berhasil divalidasi'

        });

    }
);

app.get(
    '/panel-admin/scan',
    requireAdmin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,'scan',
                'scan.html'
            )
        );

    }
);
app.patch(
    '/api/admin/bookings/:id/confirm',
    requireAdmin,
    async (req, res) => {

        const bookings =
            readJson(bookingsFile);

        const booking =
            bookings.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking tidak ditemukan'
            });
        }

        booking.paymentStatus =
            'paid';

        booking.ticketStatus =
            'Belum Digunakan';

        booking.updatedAt =
            new Date().toISOString();

        await generateTicketPdf(
            booking
        );

        await sendWhatsAppTicket(
    booking
);
        writeJson(
            bookingsFile,
            bookings
        );

        res.json({
            message:
                'Pembayaran berhasil dikonfirmasi',
            booking
        });
    }
); 

//tiket
app.get(
    '/ticket/:id',
    (req, res) => {

        res.sendFile(
            path.join(
                publicPath,
                'ticket.html'
            )
        );

    }
);

// Default halaman
app.use((req, res) => {
    res.sendFile(
        path.join(publicPath, 'index.html')
    );
});



// Menjalankan server
app.listen(PORT, () => {
    console.log(
        `Server berjalan di http://localhost:${PORT}`
    );
});
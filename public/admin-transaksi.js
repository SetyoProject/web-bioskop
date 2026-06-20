const transactionTable =
    document.getElementById(
        'transactionTable'
    );

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

async function fetchTransactions() {

    const response =
        await fetch(
            '/api/admin/bookings'
        );

    const bookings =
        await response.json();

    renderTransactions(bookings);
}

function renderTransactions(bookings) {

    transactionTable.innerHTML =
        bookings.map(item => {

            const paymentStatus =
                item.paymentStatus || 'pending';

            const ticketStatus =
                item.ticketStatus || '-';

            const isUsed =
                item.isUsed || false;

            return `
                <tr>

                    <td>${item.id}</td>

                    <td>${item.customerName}</td>

                    <td>
                        ${
                            item.items?.map(
                                film => film.title
                            ).join(', ') || '-'
                        }
                    </td>

                    <td>
                        ${rupiah(item.total)}
                    </td>

                    <td>
                        ${
                            paymentStatus === 'pending'
                                ? 'Pending'
                                : 'Paid'
                        }
                    </td>

                    <td>
                        ${ticketStatus}
                    </td>

                    <td>
                        ${
                            item.checkInAt
                                ? new Date(
                                    item.checkInAt
                                ).toLocaleString('id-ID')
                                : '-'
                        }
                    </td>

                    <td>

    ${
        paymentStatus === 'pending'
            ? `
                <button
                    class="btn-confirm"
                    onclick="confirmPayment('${item.id}')">
                    Konfirmasi
                </button>
            `
            : !isUsed
                ? `
                    <button
                        class="btn-scan"
                        onclick="scanTicket('${item.id}')">
                        Scan Tiket
                    </button>
                `
                : `
                    <button
                        class="btn-detail"
                        onclick="viewTicket('${item.id}')">
                        Detail
                    </button>
                `
    }

</td>

                </tr>
            `;
        }).join('');

}

async function confirmPayment(id) {

    const response =
        await fetch(
            `/api/admin/bookings/${id}/confirm`,
            {
                method: 'PATCH'
            }
        );

    const result =
        await response.json();

    if (
    result.waLink
) {

    window.open(
        result.waLink,
        '_blank'
    );

}

    fetchTransactions();
}

function scanTicket(id) {

    window.location.href =
        `/panel-admin/scan?id=${id}`;

}

function viewTicket(id) {

    window.open(
        `/uploads/${id}.pdf`,
        '_blank'
    );

}

fetchTransactions();
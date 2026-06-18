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

    renderTransactions(
        bookings
    );

}


function renderTransactions(bookings) {

    transactionTable.innerHTML =
        bookings.map(item => `

        <tr>

            <td>${item.id}</td>

            <td>${item.customerName}</td>

            <td>${rupiah(item.total)}</td>

            <td>${item.status}</td>

            <td>
                ${new Date(
                    item.createdAt
                ).toLocaleDateString()}
            </td>

            <td>

                <button
                    onclick="
                    updateStatus(
                    '${item.id}',
                    'Diproses'
                    )">

                    Diproses

                </button>

                <button
                    onclick="
                    updateStatus(
                    '${item.id}',
                    'Selesai'
                    )">

                    Selesai

                </button>

            </td>

        </tr>

    `).join('');

}


async function updateStatus(
    id,
    status
) {

    await fetch(
        `/api/admin/bookings/${id}/status`,
        {
            method: 'PATCH',

            headers: {
                'Content-Type':
                'application/json'
            },

            body:
                JSON.stringify({
                    status
                })
        }
    );

    fetchTransactions();

}


fetchTransactions();
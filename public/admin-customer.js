const customerTable =
    document.getElementById(
        'customerTable'
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


async function fetchCustomers() {

    const response =
        await fetch(
            '/api/admin/customers'
        );

    const customers =
        await response.json();

    renderCustomers(
        customers
    );

}


function renderCustomers(customers) {

    customerTable.innerHTML =
        customers.map(item => `

        <tr>

            <td>${item.bookingId}</td>

            <td>${item.customerName}</td>

            <td>${item.phoneNumber}</td>

            <td>${rupiah(item.total)}</td>

            <td>${item.status}</td>

            <td>
                ${new Date(
                    item.bookingDate
                ).toLocaleDateString()}
            </td>

        </tr>

    `).join('');

}


fetchCustomers();
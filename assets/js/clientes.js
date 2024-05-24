const tableLista = document.querySelector("#tableListaProductos tbody");
const tblPendientes = document.querySelector('#tblPendientes');
let productosjson = [];
const estadoEnviado = document.querySelector('#estadoEnviado');
const estadoProceso = document.querySelector('#estadoProceso');
const estadoCompletado = document.querySelector('#estadoCompletado');

document.addEventListener("DOMContentLoaded", function() {
    if (tableLista) {
        getListaProductos();
    }

    // Cargar datos pendientes con DataTables
    $('#tblPendientes').DataTable({
        ajax: {
            url: base_url + 'clientes/listarPendientes',
            dataSrc: ''
        },
        columns: [
            { data: 'id_transaccion' },
            { data: 'monto' },
            { data: 'fecha' },
            { data: 'accion' }
        ],
        language,
        dom,
        buttons
    });
});

async function getListaProductos() {
    const url = base_url + 'principal/listaProductos';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(listaCarrito)
        });
        const res = await response.json();

        if (res.totalPaypal > 0) {
            let html = '';
            res.productos.forEach(producto => {
                html += `<tr>
                    <td>
                        <img class="img-thumbnail rounded-circle" src="${producto.imagen}" alt="" width="100">
                    </td>
                    <td>${producto.nombre}</td>
                    <td><span class="badge bg-warning">${res.moneda + ' ' + producto.precio}</span></td>
                    <td><span class="badge bg-primary"><h3>${producto.cantidad}</h3></span></td>
                    <td>${producto.subTotal}</td>
                </tr>`;
            });

            tableLista.innerHTML = html;
            document.querySelector('#totalProducto').textContent = 'TOTAL A PAGAR: ' + res.moneda + ' ' + res.total;

            // Botón para registrar pedido
            const btnRegistrarPedido = document.createElement('button');
            btnRegistrarPedido.textContent = 'Registrar Pedido';
            btnRegistrarPedido.classList.add('btn', 'btn-primary');
            btnRegistrarPedido.addEventListener('click', function() {
                registrarPedido(res.totalPaypal);
            });

            document.querySelector('#paypal-button-container').appendChild(btnRegistrarPedido);
        } else {
            tableLista.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">CARRITO VACÍO</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error fetching listaProductos:', error);
    }
}

async function registrarPedido(montoTotal) {
    const url = base_url + 'clientes/registrarPedido';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                montoTotal: montoTotal,
                productos: listaCarrito
            })
        });
        const res = await response.json();

        Swal.fire("Aviso?", res.msg, res.icono);
        if (res.icono == 'success') {
            localStorage.removeItem('listaCarrito');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    } catch (error) {
        console.error('Error fetching registrarPedido:', error);
    }
}







function verPedido(idPedido) {
    estadoEnviado.classList.remove('bg-info');
    estadoProceso.classList.remove('bg-info');
    estadoCompletado.classList.remove('bg-info');
    const mPedido = new bootstrap.Modal(document.getElementById('modalPedido'));
    const url = base_url + 'clientes/verPedido/' + idPedido;
    fetch(url)
        .then(response => response.json())
        .then(res => {
            let html = '';
            if (res.pedido.proceso == 1) {
                estadoEnviado.classList.add('bg-info');
            } else if (res.pedido.proceso == 2) {
                estadoProceso.classList.add('bg-info');
            } else {
                estadoCompletado.classList.add('bg-info');
            }
            res.productos.forEach(row => {
                let subTotal = parseFloat(row.precio) * parseInt(row.cantidad);
                html += `<tr>
                    <td>${row.producto}</td>
                    <td><span class="badge bg-warning">${res.moneda + ' ' + row.precio}</span></td>
                    <td><span class="badge bg-primary">${row.cantidad}</span></td>
                    <td>${subTotal.toFixed(2)}</td>
                </tr>`;
            });
            document.querySelector('#tablePedidos tbody').innerHTML = html;
            mPedido.show();
        })
        .catch(error => console.error('Error fetching verPedido:', error));
}

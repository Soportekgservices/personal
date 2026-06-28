/**
 * Main App Controller - domestic-finance
 * Orquestador de vistas y eventos.
 * Storage.init() solo se llama DESPUÉS de autenticar al usuario.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Solo registra eventos y verifica si hay sesión activa.
    // NO toca Storage ni la API antes de validar credenciales.
    App.init();
});

const App = {
    init: function() {
        this.bindEvents();
        this.checkAuth();
    },

    bindEvents: function() {
        // Login
        document.getElementById('btnEnter').addEventListener('click', () => this.handleLogin());
        document.getElementById('btnLogout').addEventListener('click', () => Auth.logout());

        // Formulario de Servicio
        document.getElementById('serviceForm').addEventListener('submit', (e) => this.handleServiceSubmit(e));

        // Formulario de Pago
        document.getElementById('paymentForm').addEventListener('submit', (e) => this.handlePaymentSubmit(e));
        document.getElementById('payIsPaid').addEventListener('change', (e) => {
            const container = document.getElementById('payDateContainer');
            container.style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Navegación Sidebar
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchView(e.currentTarget.dataset.view);
            });
        });

        // Toggle Sidebar Móvil
        const toggle = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (toggle) {
            toggle.addEventListener('click', () => {
                sidebar.classList.add('open');
                overlay.classList.add('active');
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }
    },

    checkAuth: async function() {
        if (Auth.isLoggedIn()) {
            // Sesión activa: mostrar sync screen y cargar datos
            await this.showSyncScreen();
            this.showApp();
        } else {
            this.showLogin();
        }
    },

    handleLogin: async function() {
        const user = document.getElementById('userInput').value.trim();
        const pass = document.getElementById('passInput').value;
        const btn  = document.getElementById('btnEnter');

        if (!user || !pass) {
            alert('Ingresa usuario y contraseña.');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';

        const result = await Auth.login(user, pass);

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> INGRESAR AL SISTEMA';

        if (result.ok) {
            // Ocultar login, mostrar pantalla de sincronización
            document.getElementById('loginView').classList.remove('active');
            await this.showSyncScreen();
            this.showApp();
        } else {
            alert(result.message || 'Usuario o contraseña incorrectos.');
        }
    },

    // ── Pantalla de sincronización inicial ───────────────────
    showSyncScreen: async function() {
        const screen  = document.getElementById('syncScreen');
        const bar     = document.getElementById('syncProgressBar');
        const msg     = document.getElementById('syncStatusMsg');
        const step1   = document.getElementById('syncStep1');
        const step2   = document.getElementById('syncStep2');
        const step3   = document.getElementById('syncStep3');

        screen.style.display = 'flex';

        // ── Paso 1: Autenticación completada ──
        await this._delay(200);
        step1.classList.add('sync-step--done');
        bar.style.width = '25%';
        msg.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Conectando con Google Sheets...';

        await this._delay(300);

        // ── Paso 2: Sincronización real — esperamos que termine ──
        step2.classList.add('sync-step--active');
        bar.style.width = '50%';
        msg.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sincronizando datos...';

        // Esta línea bloquea hasta que la API responda completamente
        await Storage.init();

        // ── Sincronización completada ──
        step2.classList.remove('sync-step--active');
        step2.classList.add('sync-step--done');
        bar.style.width = '85%';
        msg.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Preparando interfaz...';

        await this._delay(300);

        // ── Paso 3: Todo listo ──
        step3.classList.add('sync-step--done');
        bar.style.width = '100%';
        bar.classList.add('sync-progress-bar--done');
        msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡Todo listo!';

        await this._delay(700);

        // Ocultar y resetear
        screen.style.display = 'none';
        bar.style.width = '0%';
        bar.classList.remove('sync-progress-bar--done');
        [step1, step2, step3].forEach(s => {
            s.classList.remove('sync-step--done', 'sync-step--active');
        });
    },

    _delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    showLogin: function() {
        document.getElementById('loginView').classList.add('active');
        const appContainer = document.getElementById('appContainer');
        if (appContainer) appContainer.style.display = 'none';
    },

    showApp: function() {
        document.getElementById('loginView').classList.remove('active');
        const appContainer = document.getElementById('appContainer');
        if (appContainer) appContainer.style.display = 'flex';
        this.switchView('dashboard');
    },

    switchView: function(viewId) {
        // Actualizar estado activo en el menú
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewId);
        });

        const title = document.getElementById('pageTitle');
        const desc = document.getElementById('pageDesc');
        const board = document.getElementById('dynamicBoard');

        board.innerHTML = ''; // Limpiar panel

        switch(viewId) {
            case 'dashboard':
                title.innerText = 'Resumen Financiero';
                desc.innerText = 'Estado actual de tus servicios y pagos.';
                this.renderDashboard();
                break;
            case 'services':
                title.innerText = 'Mis Servicios';
                desc.innerText = 'Configuración de proveedores y contratos.';
                this.renderServicesView();
                break;
            case 'history':
                title.innerText = 'Histórico';
                desc.innerText = 'Registro de pagos realizados.';
                this.renderHistoryView();
                break;
            case 'reports':
                title.innerText = 'Estadísticas y Reportes';
                desc.innerText = 'Análisis visual de tus gastos domésticos.';
                this.renderReportsView();
                break;

            case 'documents':
                title.innerText = 'Documentos';
                desc.innerText  = 'Repositorio de documentos del hogar.';
                ModuleDocuments.render();
                break;

            case 'family':
                title.innerText = 'Familia';
                desc.innerText  = 'Información personal de los integrantes del hogar.';
                ModuleFamily.render();
                break;

            case 'housing':
                title.innerText = 'Vivienda';
                desc.innerText  = 'Información del inmueble familiar.';
                ModuleHousing.render();
                break;

            case 'contacts':
                title.innerText = 'Contactos';
                desc.innerText  = 'Directorio de contactos importantes del hogar.';
                ModuleContacts.render();
                break;

            case 'vehicles':
                title.innerText = 'Vehículos';
                desc.innerText  = 'Información de los vehículos del hogar.';
                ModuleVehicles.render();
                break;
        }
        
        // Cerrar sidebar en móvil tras navegar
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    },

    renderDashboard: async function() {
        try {
        const services = await Storage.getServices();
        const total = services.reduce((acc, s) => acc + (parseFloat(s.valor) || 0), 0);
        const pendingServices = services.filter(s => s.estado === 'Pendiente');
        const pendingCount = pendingServices.length;

        // Calcular vencimientos próximos (próximos 5 días)
        const today = new Date();
        const soonCount = pendingServices.filter(s => {
            if (!s.fechaVencimiento) return false;
            const diff = (new Date(s.fechaVencimiento) - today) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 5;
        }).length;

        const board = document.getElementById('dynamicBoard');
        board.innerHTML = `
            <div class="card span-2">
                <span class="stat-num">$${total.toLocaleString()}</span>
                <span class="stat-desc">Gasto Mensual</span>
            </div>
            <div class="card span-2">
                <span class="stat-num">${pendingCount}</span>
                <span class="stat-desc">Servicios Pendientes</span>
            </div>
            <div class="card span-2">
                <span class="stat-num">${soonCount}</span>
                <span class="stat-desc">Vencen pronto</span>
            </div>
            <div class="card span-6">
                <div class="card-table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Contrato/NIC</th>
                                <th>Valor</th>
                                <th>Día Gen.</th>
                                <th>Vence</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong class="service-name-link" onclick="App.openHistoryDrawer(0)" title="Ver historial de pagos" style="cursor:pointer; border-bottom:1px dashed var(--color-primary-400);">${services[0]?.nombre || 'Agua'}</strong></td>
                                <td>${services[0]?.nic || '---'} ${services[0]?.nic ? `<button class="btn-action" onclick="navigator.clipboard.writeText('${services[0].nic}').then(()=>{const i=this.querySelector('i');i.className='fa-solid fa-check';this.style.color='var(--color-success)';this.style.borderColor='var(--color-success)';setTimeout(()=>{i.className='fa-solid fa-copy';this.style.color='';this.style.borderColor='';},1500)})" title="Copiar NIC" style="margin-left:4px;"><i class="fa-solid fa-copy"></i></button>` : ''}</td>
                                <td>$${(services[0]?.valor || 0).toLocaleString()}</td>
                                <td>${services[0]?.diaGeneracion || '---'}</td>
                                <td>${services[0]?.diaVencimiento || '---'}</td>
                                <td><span class="badge ${services[0]?.estado === 'Pagado' ? 'badge-success' : 'badge-pending'}">${services[0]?.estado || ''}</span></td>
                                <td>
                                    <button class="btn-action" onclick="App.openPaymentModal(${services[0]?.id})" title="Registrar Pago"><i class="fa-solid fa-file-invoice-dollar"></i></button>
                                    <a href="${services[0]?.linkPago}" target="_blank" rel="noopener noreferrer" class="btn-action" title="Portal de pago"><i class="fa-solid fa-credit-card"></i></a>
                                    <a href="https://drive.google.com/drive/folders/15WQkDHS6511UhrIP3PPZceDtsSlHR5dA" target="_blank" rel="noopener noreferrer" class="btn-action" title="Comprobantes Agua"><i class="fa-solid fa-folder-open"></i></a>
                                </td>
                            </tr>
                            <tr>
                                <td><strong class="service-name-link" onclick="App.openHistoryDrawer(1)" title="Ver historial de pagos" style="cursor:pointer; border-bottom:1px dashed var(--color-primary-400);">${services[1]?.nombre || 'Luz'}</strong></td>
                                <td>${services[1]?.nic || '---'} ${services[1]?.nic ? `<button class="btn-action" onclick="navigator.clipboard.writeText('${services[1].nic}').then(()=>{const i=this.querySelector('i');i.className='fa-solid fa-check';this.style.color='var(--color-success)';this.style.borderColor='var(--color-success)';setTimeout(()=>{i.className='fa-solid fa-copy';this.style.color='';this.style.borderColor='';},1500)})" title="Copiar NIC" style="margin-left:4px;"><i class="fa-solid fa-copy"></i></button>` : ''}</td>
                                <td>$${(services[1]?.valor || 0).toLocaleString()}</td>
                                <td>${services[1]?.diaGeneracion || '---'}</td>
                                <td>${services[1]?.diaVencimiento || '---'}</td>
                                <td><span class="badge ${services[1]?.estado === 'Pagado' ? 'badge-success' : 'badge-pending'}">${services[1]?.estado || ''}</span></td>
                                <td>
                                    <button class="btn-action" onclick="App.openPaymentModal(${services[1]?.id})" title="Registrar Pago"><i class="fa-solid fa-file-invoice-dollar"></i></button>
                                    <a href="${services[1]?.linkPago}" target="_blank" rel="noopener noreferrer" class="btn-action" title="Portal de pago"><i class="fa-solid fa-credit-card"></i></a>
                                    <a href="https://drive.google.com/drive/folders/1nE3woHyi90-f7ZgG5bTww_LJjtpDHZUV" target="_blank" rel="noopener noreferrer" class="btn-action" title="Comprobantes Luz"><i class="fa-solid fa-folder-open"></i></a>
                                </td>
                            </tr>
                            <tr>
                                <td><strong class="service-name-link" onclick="App.openHistoryDrawer(2)" title="Ver historial de pagos" style="cursor:pointer; border-bottom:1px dashed var(--color-primary-400);">${services[2]?.nombre || 'Gas'}</strong></td>
                                <td>${services[2]?.nic || '---'} ${services[2]?.nic ? `<button class="btn-action" onclick="navigator.clipboard.writeText('${services[2].nic}').then(()=>{const i=this.querySelector('i');i.className='fa-solid fa-check';this.style.color='var(--color-success)';this.style.borderColor='var(--color-success)';setTimeout(()=>{i.className='fa-solid fa-copy';this.style.color='';this.style.borderColor='';},1500)})" title="Copiar NIC" style="margin-left:4px;"><i class="fa-solid fa-copy"></i></button>` : ''}</td>
                                <td>$${(services[2]?.valor || 0).toLocaleString()}</td>
                                <td>${services[2]?.diaGeneracion || '---'}</td>
                                <td>${services[2]?.diaVencimiento || '---'}</td>
                                <td><span class="badge ${services[2]?.estado === 'Pagado' ? 'badge-success' : 'badge-pending'}">${services[2]?.estado || ''}</span></td>
                                <td>
                                    <button class="btn-action" onclick="App.openPaymentModal(${services[2]?.id})" title="Registrar Pago"><i class="fa-solid fa-file-invoice-dollar"></i></button>
                                    <a href="${services[2]?.linkPago}" target="_blank" rel="noopener noreferrer" class="btn-action" title="Portal de pago"><i class="fa-solid fa-credit-card"></i></a>
                                    <a href="https://drive.google.com/drive/folders/1ZN8dzucat6tqHwq_jLDHQ8dBROPBBMJ5" target="_blank" rel="noopener noreferrer" class="btn-action" title="Comprobantes Gas"><i class="fa-solid fa-folder-open"></i></a>
                                </td>
                            </tr>
                            <tr>
                                <td><strong class="service-name-link" onclick="App.openHistoryDrawer(3)" title="Ver historial de pagos" style="cursor:pointer; border-bottom:1px dashed var(--color-primary-400);">${services[3]?.nombre || 'Administración'}</strong></td>
                                <td>${services[3]?.nic || '---'} ${services[3]?.nic ? `<button class="btn-action" onclick="navigator.clipboard.writeText('${services[3].nic}').then(()=>{const i=this.querySelector('i');i.className='fa-solid fa-check';this.style.color='var(--color-success)';this.style.borderColor='var(--color-success)';setTimeout(()=>{i.className='fa-solid fa-copy';this.style.color='';this.style.borderColor='';},1500)})" title="Copiar NIC" style="margin-left:4px;"><i class="fa-solid fa-copy"></i></button>` : ''}</td>
                                <td>$${(services[3]?.valor || 0).toLocaleString()}</td>
                                <td>${services[3]?.diaGeneracion || '---'}</td>
                                <td>${services[3]?.diaVencimiento || '---'}</td>
                                <td><span class="badge ${services[3]?.estado === 'Pagado' ? 'badge-success' : 'badge-pending'}">${services[3]?.estado || ''}</span></td>
                                <td>
                                    <button class="btn-action" onclick="App.openPaymentModal(${services[3]?.id})" title="Registrar Pago"><i class="fa-solid fa-file-invoice-dollar"></i></button>
                                    <a href="${services[3]?.linkPago}" target="_blank" rel="noopener noreferrer" class="btn-action" title="Portal de pago"><i class="fa-solid fa-credit-card"></i></a>
                                    <a href="https://drive.google.com/drive/folders/1GyrDqloRR5ZhWlbygtFwni45Do48DYt_" target="_blank" rel="noopener noreferrer" class="btn-action" title="Comprobantes Administración"><i class="fa-solid fa-folder-open"></i></a>
                                </td>
                            </tr>
                            <tr>
                                <td><strong class="service-name-link" onclick="App.openHistoryDrawer(4)" title="Ver historial de pagos" style="cursor:pointer; border-bottom:1px dashed var(--color-primary-400);">${services[4]?.nombre || 'Internet Claro'}</strong></td>
                                <td>${services[4]?.nic || '---'} ${services[4]?.nic ? `<button class="btn-action" onclick="navigator.clipboard.writeText('${services[4].nic}').then(()=>{const i=this.querySelector('i');i.className='fa-solid fa-check';this.style.color='var(--color-success)';this.style.borderColor='var(--color-success)';setTimeout(()=>{i.className='fa-solid fa-copy';this.style.color='';this.style.borderColor='';},1500)})" title="Copiar NIC" style="margin-left:4px;"><i class="fa-solid fa-copy"></i></button>` : ''}</td>
                                <td>$${(services[4]?.valor || 0).toLocaleString()}</td>
                                <td>${services[4]?.diaGeneracion || '---'}</td>
                                <td>${services[4]?.diaVencimiento || '---'}</td>
                                <td><span class="badge ${services[4]?.estado === 'Pagado' ? 'badge-success' : 'badge-pending'}">${services[4]?.estado || ''}</span></td>
                                <td>
                                    <button class="btn-action" onclick="App.openPaymentModal(${services[4]?.id})" title="Registrar Pago"><i class="fa-solid fa-file-invoice-dollar"></i></button>
                                    <a href="${services[4]?.linkPago}" target="_blank" rel="noopener noreferrer" class="btn-action" title="Portal de pago"><i class="fa-solid fa-credit-card"></i></a>
                                    <a href="https://drive.google.com/drive/folders/1Dzq2Wts77vMdcRPhDaJMG7PmToh_qSm3" target="_blank" rel="noopener noreferrer" class="btn-action" title="Comprobantes Internet"><i class="fa-solid fa-folder-open"></i></a>
                                </td>
                            </tr>
                            <tr>
                                <td><strong class="service-name-link" onclick="App.openHistoryDrawer(5)" title="Ver historial de pagos" style="cursor:pointer; border-bottom:1px dashed var(--color-primary-400);">${services[5]?.nombre || 'Funeraria la paz'}</strong></td>
                                <td>${services[5]?.nic || '---'} ${services[5]?.nic ? `<button class="btn-action" onclick="navigator.clipboard.writeText('${services[5].nic}').then(()=>{const i=this.querySelector('i');i.className='fa-solid fa-check';this.style.color='var(--color-success)';this.style.borderColor='var(--color-success)';setTimeout(()=>{i.className='fa-solid fa-copy';this.style.color='';this.style.borderColor='';},1500)})" title="Copiar NIC" style="margin-left:4px;"><i class="fa-solid fa-copy"></i></button>` : ''}</td>
                                <td>$${(services[5]?.valor || 0).toLocaleString()}</td>
                                <td>${services[5]?.diaGeneracion || '---'}</td>
                                <td>${services[5]?.diaVencimiento || '---'}</td>
                                <td><span class="badge ${services[5]?.estado === 'Pagado' ? 'badge-success' : 'badge-pending'}">${services[5]?.estado || ''}</span></td>
                                <td>
                                    <button class="btn-action" onclick="App.openPaymentModal(${services[5]?.id})" title="Registrar Pago"><i class="fa-solid fa-file-invoice-dollar"></i></button>
                                    <a href="${services[5]?.linkPago}" target="_blank" rel="noopener noreferrer" class="btn-action" title="Portal de pago"><i class="fa-solid fa-credit-card"></i></a>
                                    <a href="https://drive.google.com/drive/folders/1TvYHMSir5hFIOuZ3nhbWjgZf8h5fT5Ex" target="_blank" rel="noopener noreferrer" class="btn-action" title="Comprobantes Funeraria"><i class="fa-solid fa-folder-open"></i></a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        } catch (error) {
            console.error("Error al renderizar el Dashboard:", error);
            document.getElementById('dynamicBoard').innerHTML = `<div class="card span-6"><p style="color:red">Error al cargar los datos. Por favor, revisa la consola.</p></div>`;
        }
    },

    renderServicesView: async function() {
        const services = await Storage.getServices();
        const board = document.getElementById('dynamicBoard');
        
        board.innerHTML = `
            <div class="card span-6" style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin:0">Listado Maestro</h3>
                <button class="pill-btn active" onclick="App.openServiceModal()"><i class="fa-solid fa-plus"></i> Nuevo Servicio</button>
            </div>
            <div class="card span-6">
                <div class="card-table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Empresa</th>
                                <th>Contrato / NIC</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${services.map(s => `
                                <tr>
                                    <td><strong>${s.nombre}</strong></td>
                                    <td>${s.empresa || 'N/A'}</td>
                                    <td><code>${s.nic || '---'}</code></td>
                                    <td><span class="badge ${s.estado === 'Pagado' ? 'badge-success' : (s.estado === 'Inactivo' ? 'badge-finalized' : 'badge-pending')}">${s.estado}</span></td>
                                    <td>
                                        <button class="btn-action" onclick="App.openServiceModal(${s.id})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                                        <button class="btn-action" onclick="App.deleteService(${s.id})" title="Eliminar"><i class="fa-solid fa-trash" style="color:var(--danger)"></i></button>
                                        ${s.linkPago ? `<a href="${s.linkPago}" target="_blank" class="btn-action" title="Ir a pagar"><i class="fa-solid fa-external-link"></i></a>` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderHistoryView: async function() {
        const payments = await Storage.getPayments();
        const services = await Storage.getServices();
        const board = document.getElementById('dynamicBoard');

        // Ordenar por fecha de registro descendente (más reciente primero)
        const sortedPayments = [...payments].sort((a, b) => {
            const dateA = a.fechaRegistro ? new Date(a.fechaRegistro) : new Date(0);
            const dateB = b.fechaRegistro ? new Date(b.fechaRegistro) : new Date(0);
            return dateB - dateA;
        });

        board.innerHTML = `
            <div class="card span-6">
                <div class="card-table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Fecha Registro</th>
                                <th>Servicio</th>
                                <th>Valor Pagado</th>
                                <th>Fecha Vencimiento</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedPayments.length === 0 ? 
                                '<tr><td colspan="5" style="text-align:center">No hay pagos registrados aún.</td></tr>' : 
                                sortedPayments.map(p => {
                                    const srv = services.find(s => s.id === p.serviceId);
                                    return `
                                        <tr>
                                            <td>${new Date(p.fechaRegistro).toLocaleDateString()}</td>
                                            <td><strong>${srv ? srv.nombre : 'Servicio Eliminado'}</strong></td>
                                            <td>$${(p.valor || 0).toLocaleString()}</td>
                                            <td>${p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString() : '<span class="badge badge-pending">Sin vencimiento</span>'}</td>
                                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.observaciones || ''}">
                                                ${p.observaciones || '---'}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderReportsView: async function() {
        const payments = await Storage.getPayments();
        const services = await Storage.getServices();
        const board = document.getElementById('dynamicBoard');

        board.innerHTML = `
            <div class="card span-3">
                <h3>Gasto por Servicio</h3>
                <p class="stat-desc">Distribución total acumulada</p>
                <div style="margin-top:20px; position:relative; height:300px;">
                    <canvas id="chartServices"></canvas>
                </div>
            </div>
            <div class="card span-3">
                <h3>Tendencia Mensual</h3>
                <p class="stat-desc">Histórico de facturación</p>
                <div style="margin-top:20px; position:relative; height:300px;">
                    <canvas id="chartTrend"></canvas>
                </div>
            </div>
        `;

        // Procesar datos para la gráfica de servicios
        const totalsByService = {};
        payments.forEach(p => {
            const srv = services.find(s => s.id === p.serviceId);
            const name = srv ? srv.nombre : 'Eliminado';
            totalsByService[name] = (totalsByService[name] || 0) + p.valor;
        });

        // Gráfica de Rosca (Doughnut)
        new Chart(document.getElementById('chartServices'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(totalsByService),
                datasets: [{
                    data: Object.values(totalsByService),
                    backgroundColor: ['#052b91', '#488a99', '#ff9800', '#8a55ff', '#10c57b', '#e63946'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Outfit' } } }
                }
            }
        });

        // Gráfica de Barras (Tendencia - Placeholder funcional)
        new Chart(document.getElementById('chartTrend'), {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Gastos $',
                    data: [0, 0, 0, 0, 0, Object.values(totalsByService).reduce((a, b) => a + b, 0)],
                    backgroundColor: '#488a99',
                    borderRadius: 8
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    // --- Gestión de Modales ---
    openServiceModal: async function(id = null) {
        const modal = document.getElementById('modalService');
        const form = document.getElementById('serviceForm');
        form.reset();
        document.getElementById('serviceId').value = '';
        document.getElementById('modalTitle').innerText = 'Nuevo Servicio';

        if (id) {
            const services = await Storage.getServices();
            const s = services.find(srv => srv.id === id);
            if (s) {
                document.getElementById('serviceId').value = s.id;
                document.getElementById('srvNombre').value = s.nombre;
                document.getElementById('srvEmpresa').value = s.empresa || '';
                document.getElementById('srvNic').value = s.nic || '';
                document.getElementById('srvValor').value = s.valor || 0;
                document.getElementById('srvLinkPago').value = s.linkPago || '';
                document.getElementById('srvEstado').value = s.estado;
                document.getElementById('srvDiaGen').value = s.diaGeneracion || 1;
                document.getElementById('modalTitle').innerText = 'Editar Servicio';
            }
        }
        modal.style.display = 'flex';
    },

    closeModal: function() {
        document.getElementById('modalService').style.display = 'none';
    },

    handleServiceSubmit: async function(e) {
        e.preventDefault();
        const serviceData = {
            id: document.getElementById('serviceId').value ? parseInt(document.getElementById('serviceId').value) : null,
            nombre: document.getElementById('srvNombre').value,
            empresa: document.getElementById('srvEmpresa').value,
            nic: document.getElementById('srvNic').value,
            valor: parseFloat(document.getElementById('srvValor').value) || 0,
            linkPago: document.getElementById('srvLinkPago').value,
            estado: document.getElementById('srvEstado').value,
            diaGeneracion: parseInt(document.getElementById('srvDiaGen').value) || 1,
            diaVencimiento: Math.min(31, (parseInt(document.getElementById('srvDiaGen').value) || 1) + 3),
            fechaActualizacion: new Date().toISOString()
        };

        await Storage.saveService(serviceData);
        this.closeModal();
        this.switchView('services');
    },

    deleteService: async function(id) {
        if (confirm('¿Estás seguro de eliminar este servicio? No podrás recuperar los datos.')) {
            await Storage.deleteService(id);
            this.renderServicesView();
        }
    },

    // --- Gestión de Pagos/Facturas ---
    openPaymentModal: async function(serviceId) {
        const services = await Storage.getServices();
        const s = services.find(srv => srv.id === serviceId);
        if (!s) return;

        const modal = document.getElementById('modalPayment');
        const form = document.getElementById('paymentForm');
        form.reset();
        
        document.getElementById('payServiceId').value = serviceId;
        document.getElementById('paymentModalTitle').innerText = `Factura: ${s.nombre}`;
        document.getElementById('payValor').value = s.valor || '';
        document.getElementById('payDateContainer').style.display = 'none';
        document.getElementById('payDiaGen').value = s.diaGeneracion || '';
        
        modal.style.display = 'flex';
    },

    closePaymentModal: function() {
        document.getElementById('modalPayment').style.display = 'none';
    },

    // --- Drawer de historial de pagos por servicio ---
    openHistoryDrawer: async function(serviceIndex) {
        const services = await Storage.getServices();
        const payments = await Storage.getPayments();
        const srv = services[serviceIndex];
        if (!srv) return;

        // Filtrar pagos de este servicio y ordenar más reciente primero
        const srvPayments = payments
            .filter(p => p.serviceId === srv.id)
            .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));

        // Calcular total gastado
        const totalGastado = srvPayments.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);

        // Construir línea de tiempo
        const timelineHTML = srvPayments.length === 0
            ? `<div class="drawer-empty"><i class="fa-solid fa-clock-rotate-left"></i><p>Sin registros de pago aún.</p></div>`
            : srvPayments.map((p, i) => `
                <div class="drawer-timeline-item ${i === 0 ? 'drawer-timeline-item--latest' : ''}">
                    <div class="drawer-timeline-dot"></div>
                    <div class="drawer-timeline-content">
                        <div class="drawer-timeline-header">
                            <span class="drawer-timeline-amount">$${(p.valor || 0).toLocaleString()}</span>
                            <span class="drawer-timeline-date">${new Date(p.fechaRegistro).toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'})}</span>
                        </div>
                        ${p.fechaVencimiento ? `<div class="drawer-timeline-meta">Vencimiento: ${new Date(p.fechaVencimiento).toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'})}</div>` : ''}
                        ${p.observaciones ? `<div class="drawer-timeline-obs">${p.observaciones}</div>` : ''}
                    </div>
                </div>`).join('');

        // Inyectar contenido en el drawer
        document.getElementById('drawerServiceName').textContent = srv.nombre;
        document.getElementById('drawerServiceEmpresa').textContent = srv.empresa || '';
        document.getElementById('drawerTotalCount').textContent = srvPayments.length;
        document.getElementById('drawerTotalAmount').textContent = '$' + totalGastado.toLocaleString();
        document.getElementById('drawerTimeline').innerHTML = timelineHTML;

        // Mostrar drawer
        document.getElementById('historyDrawer').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
    },

    closeHistoryDrawer: function() {
        document.getElementById('historyDrawer').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
    },

    handlePaymentSubmit: async function(e) {
        e.preventDefault();
        
        // Mostrar overlay de carga
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';
        
        const isPaid = document.getElementById('payIsPaid').checked;
        const paymentData = {
            serviceId: parseInt(document.getElementById('payServiceId').value),
            valor: parseFloat(document.getElementById('payValor').value),
            fechaVencimiento: document.getElementById('payVencimiento').value,
            isPaid: isPaid,
            fechaPago: isPaid ? document.getElementById('payFechaPago').value : null,
            observaciones: document.getElementById('payObservaciones').value,
            // Nuevo campo para día de generación ingresado manualmente
            diaGeneracion: isPaid ? parseInt(document.getElementById('payDiaGen').value) : null
        };
        
        // Si la factura está pagada, actualizar día de generación del servicio
        if (isPaid && paymentData.fechaPago) {
            // Usar el día de generación ingresado o, si falta, derivarlo de la fecha de pago
            const nuevoDiaGen = paymentData.diaGeneracion || new Date(paymentData.fechaPago).getDate();
            const nuevoDiaVen = Math.min(31, nuevoDiaGen + 3);
            // Guardar cambios en el servicio directamente vía Storage
            const services = await Storage.getServices();
            const srv = services.find(s => s.id === paymentData.serviceId);
            if (srv) {
                srv.diaGeneracion = nuevoDiaGen;
                srv.diaVencimiento = nuevoDiaVen;
                await Storage.saveService(srv);
            }
        }

        await Storage.savePayment(paymentData);
        this.closePaymentModal();
        this.renderDashboard(); // Refrescar dashboard para ver cambios
        // Ocultar overlay de carga
        loadingOverlay.style.display = 'none';
    }
};
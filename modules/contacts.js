/**
 * ModuleContacts — Centro de Información Familiar
 * Agrupa los contactos por la columna "Relación" (nombre de la persona del hogar).
 * Cada grupo es colapsable. Dentro de cada grupo se muestra el contacto
 * con su "Detalle" (tipo real: médico, hermano, abogado...).
 * Módulo de solo lectura.
 */
const ModuleContacts = {

    // ── Íconos por Detalle ───────────────────────────────────────────────
    DETAIL_ICONS: {
        'médico':       'fa-solid fa-stethoscope',
        'medico':       'fa-solid fa-stethoscope',
        'doctor':       'fa-solid fa-stethoscope',
        'odontólogo':   'fa-solid fa-tooth',
        'odontologo':   'fa-solid fa-tooth',
        'abogado':      'fa-solid fa-scale-balanced',
        'técnico':      'fa-solid fa-screwdriver-wrench',
        'tecnico':      'fa-solid fa-screwdriver-wrench',
        'hermano':      'fa-solid fa-people-group',
        'hermana':      'fa-solid fa-people-group',
        'amigo':        'fa-solid fa-handshake',
        'amiga':        'fa-solid fa-handshake',
        'vecino':       'fa-solid fa-house-chimney-user',
        'vecina':       'fa-solid fa-house-chimney-user',
        'proveedor':    'fa-solid fa-truck',
        'emergencia':   'fa-solid fa-triangle-exclamation',
        'familiar':     'fa-solid fa-heart',
        'trabajo':      'fa-solid fa-briefcase',
        'jefe':         'fa-solid fa-user-tie',
        'compañero':    'fa-solid fa-users',
        'otro':         'fa-solid fa-address-card'
    },

    // ── Colores por Detalle ──────────────────────────────────────────────
    DETAIL_COLORS: {
        'médico':       'cnt-blue',
        'medico':       'cnt-blue',
        'doctor':       'cnt-blue',
        'odontólogo':   'cnt-blue',
        'odontologo':   'cnt-blue',
        'abogado':      'cnt-orange',
        'emergencia':   'cnt-red',
        'familiar':     'cnt-purple',
        'hermano':      'cnt-purple',
        'hermana':      'cnt-purple',
        'trabajo':      'cnt-indigo',
        'jefe':         'cnt-indigo',
        'proveedor':    'cnt-teal',
    },

    // ── Punto de entrada ─────────────────────────────────────────────────
    render: async function () {
        const board = document.getElementById('dynamicBoard');

        board.innerHTML = `
            <div class="cnt-loading span-6">
                <div class="spinner"></div>
                <p>Cargando contactos...</p>
            </div>`;

        try {
            const contacts = await Storage.getContacts();

            if (!contacts || contacts.length === 0) {
                this.renderEmpty(board);
                return;
            }

            this.renderGroups(board, contacts);

        } catch (err) {
            console.error('[ModuleContacts]', err);
            board.innerHTML = `
                <div class="card span-6 cnt-error-card">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>No se pudieron cargar los contactos.<br>
                       Verifica la conexión e intenta de nuevo.</p>
                    <button class="btn btn-secondary btn-sm" onclick="ModuleContacts.render()">
                        <i class="fa-solid fa-rotate-right"></i> Reintentar
                    </button>
                </div>`;
        }
    },

    // ── Vista agrupada por Relación ──────────────────────────────────────
    renderGroups: function (board, contacts) {
        const grouped = this.groupByRelacion(contacts);
        const grupos  = Object.keys(grouped);

        let html = '';
        grupos.forEach((grupo, index) => {
            html += this.buildGroupCard(grupo, grouped[grupo], index);
        });

        board.innerHTML = html;
    },

    // ── Tarjeta de grupo colapsable ──────────────────────────────────────
    buildGroupCard: function (grupo, contacts, index) {
        const iniciales = this.getIniciales(grupo);
        const total     = contacts.length;

        // Filas de contactos dentro del grupo
        const filas = contacts.map(c => this.buildContactRow(c)).join('');

        return `
            <div class="card span-6 cnt-group-card" id="cnt-group-${index}">

                <!-- Cabecera colapsable -->
                <div class="cnt-group-header"
                     role="button" tabindex="0"
                     aria-expanded="false"
                     aria-controls="cnt-body-${index}"
                     onclick="ModuleContacts.toggleGroup(${index})"
                     onkeydown="if(event.key==='Enter'||event.key===' ')ModuleContacts.toggleGroup(${index})">

                    <div class="cnt-group-avatar">${iniciales}</div>

                    <div class="cnt-group-info">
                        <span class="cnt-group-name">${this.escapeHtml(grupo)}</span>
                        <span class="cnt-group-meta">
                            ${total} contacto${total !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div class="cnt-group-chevron" id="cnt-chevron-${index}">
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>

                </div>

                <!-- Lista de contactos colapsable -->
                <div class="cnt-group-body" id="cnt-body-${index}" style="display:none;">
                    <div class="cnt-contacts-list">
                        ${filas}
                    </div>
                </div>

            </div>`;
    },

    // ── Fila de un contacto dentro del grupo ────────────────────────────
    buildContactRow: function (c) {
        const nombre    = this.escapeHtml(c.nombre    || '');
        const detalle   = this.escapeHtml(c.detalle   || '');
        const telefono  = this.escapeHtml(c.telefono  || '');
        const ubicacion = this.escapeHtml(c.ubicacion || '');
        const whatsapp  = c.whatsapp || '';

        const detKey  = detalle.toLowerCase().trim();
        const icon    = this.DETAIL_ICONS[detKey]  || this.DETAIL_ICONS['otro'];
        const color   = this.DETAIL_COLORS[detKey] || 'cnt-default';
        const iniciales = this.getIniciales(nombre);
        const waLink    = whatsapp ? this.buildWhatsappLink(whatsapp) : '';

        // Acciones: teléfono + whatsapp
        let acciones = '';
        if (telefono) {
            acciones += `
                <a href="tel:${this.escapeHtml(telefono)}"
                   class="cnt-action-btn cnt-tel-btn"
                   title="Llamar: ${telefono}">
                    <i class="fa-solid fa-phone"></i>
                </a>`;
        }
        if (waLink) {
            acciones += `
                <a href="${waLink}"
                   target="_blank" rel="noopener noreferrer"
                   class="cnt-action-btn cnt-wa-btn"
                   title="WhatsApp">
                    <i class="fa-brands fa-whatsapp"></i>
                </a>`;
        }

        return `
            <div class="cnt-contact-row">

                <!-- Avatar + info -->
                <div class="cnt-row-left">
                    <div class="cnt-row-avatar ${color}">${iniciales}</div>
                    <div class="cnt-row-info">
                        <span class="cnt-row-nombre">${nombre}</span>
                        <div class="cnt-row-meta">
                            ${detalle
                                ? `<span class="cnt-detalle-badge ${color}-badge">
                                       <i class="${icon}"></i> ${detalle}
                                   </span>`
                                : ''}
                            ${ubicacion
                                ? `<span class="cnt-row-ubicacion">
                                       <i class="fa-solid fa-location-dot"></i> ${ubicacion}
                                   </span>`
                                : ''}
                        </div>
                    </div>
                </div>

                <!-- Botones de acción -->
                ${acciones
                    ? `<div class="cnt-row-actions">${acciones}</div>`
                    : ''}

            </div>`;
    },

    // ── Toggle grupo ─────────────────────────────────────────────────────
    toggleGroup: function (index) {
        const body    = document.getElementById(`cnt-body-${index}`);
        const chevron = document.getElementById(`cnt-chevron-${index}`);
        const header  = chevron.closest('.cnt-group-header');
        if (!body) return;

        const isOpen = body.style.display !== 'none';
        body.style.display        = isOpen ? 'none'  : 'block';
        chevron.style.transform   = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        header.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    },

    // ── Estado vacío ─────────────────────────────────────────────────────
    renderEmpty: function (board) {
        board.innerHTML = `
            <div class="card span-6 cnt-empty-state">
                <i class="fa-solid fa-address-book cnt-empty-icon"></i>
                <h3>Sin contactos registrados</h3>
                <p>Agrega tus contactos importantes directamente en Google Sheets.<br>
                   Una vez guardados, aparecerán aquí automáticamente.</p>
                <a href="https://docs.google.com/spreadsheets/d/14JPkOK-1b4guR6Mx7QXX0DZDKk19QpiC2v5jLPE9GHA/edit"
                   target="_blank" rel="noopener noreferrer"
                   class="btn btn-primary">
                    <i class="fa-solid fa-table-cells"></i> Abrir Google Sheets
                </a>
            </div>`;
    },

    // ── Utilidades ───────────────────────────────────────────────────────

    /**
     * Agrupa contactos por la columna "Relación" (nombre de persona del hogar).
     * Preserva el orden de aparición en Sheets.
     */
    groupByRelacion: function (contacts) {
        const grouped = {};
        contacts.forEach(c => {
            const grupo = (c.relacion || 'Sin grupo').toString().trim();
            if (!grouped[grupo]) grouped[grupo] = [];
            grouped[grupo].push(c);
        });
        return grouped;
    },

    /**
     * Construye enlace wa.me limpiando el número.
     * Acepta cualquier formato con o sin indicativo de país.
     */
    buildWhatsappLink: function (raw) {
        if (!raw) return '';
        let cleaned = String(raw).replace(/[^\d+]/g, '');
        cleaned = cleaned.replace(/^\+/, '');
        // Auto-detectar Colombia si son 10 dígitos empezando en 3
        if (/^3\d{9}$/.test(cleaned)) cleaned = '57' + cleaned;
        return cleaned ? `https://wa.me/${cleaned}` : '';
    },

    getIniciales: function (nombre) {
        if (!nombre) return '?';
        const partes = nombre.trim().split(/\s+/);
        if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
        return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
    },

    escapeHtml: function (str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g,  '&amp;').replace(/</g, '&lt;')
            .replace(/>/g,  '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g,  '&#039;');
    }
};

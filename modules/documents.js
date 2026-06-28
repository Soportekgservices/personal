/**
 * ModuleDocuments — Centro de Información Familiar
 * Vista inicial: tarjetas compactas por persona.
 * Al hacer click: se expande mostrando todos sus documentos.
 * Módulo de solo lectura.
 */
const ModuleDocuments = {

    // ── Íconos por categoría ─────────────────────────────────────────────
    CATEGORY_ICONS: {
        'cédula de extranjeria (c.e)':  'fa-solid fa-id-card',
        'cedula de extranjeria (c.e)':  'fa-solid fa-id-card',
        'cédula venezuela':             'fa-solid fa-id-card',
        'cedula venezuela':             'fa-solid fa-id-card',
        'cédula':                       'fa-solid fa-id-card',
        'cedula':                       'fa-solid fa-id-card',
        'identidad':                    'fa-solid fa-id-card',
        'pasaporte':                    'fa-solid fa-passport',
        'permiso por proteccion temp':  'fa-solid fa-file-shield',
        'permiso':                      'fa-solid fa-file-shield',
        'registro civil':               'fa-solid fa-scroll',
        'salud':                        'fa-solid fa-heart-pulse',
        'educación':                    'fa-solid fa-graduation-cap',
        'educacion':                    'fa-solid fa-graduation-cap',
        'vivienda':                     'fa-solid fa-house',
        'vehículos':                    'fa-solid fa-car',
        'vehiculos':                    'fa-solid fa-car',
        'financiero':                   'fa-solid fa-coins',
        'legal':                        'fa-solid fa-scale-balanced',
        'seguros':                      'fa-solid fa-shield-halved',
    },

    // ── Punto de entrada ─────────────────────────────────────────────────
    render: async function () {
        const board = document.getElementById('dynamicBoard');

        board.innerHTML = `
            <div class="doc-loading span-6">
                <div class="spinner"></div>
                <p>Cargando documentos...</p>
            </div>`;

        try {
            const documents = await Storage.getDocuments();

            if (!documents || documents.length === 0) {
                this.renderEmpty(board);
                return;
            }

            this.renderGrid(board, documents);

        } catch (err) {
            console.error('[ModuleDocuments]', err);
            board.innerHTML = `
                <div class="card span-6 doc-error-card">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>No se pudieron cargar los documentos.<br>
                    Verifica la conexión y vuelve a intentarlo.</p>
                    <button class="btn btn-secondary btn-sm" onclick="ModuleDocuments.render()">
                        <i class="fa-solid fa-rotate-right"></i> Reintentar
                    </button>
                </div>`;
        }
    },

    // ── Vista de tarjetas compactas ──────────────────────────────────────
    renderGrid: function (board, documents) {
        const grouped  = this.groupByPerson(documents);
        const personas = Object.keys(grouped);

        let html = '';
        personas.forEach((persona, index) => {
            html += this.buildCompactCard(persona, grouped[persona], index);
        });

        board.innerHTML = html;
    },

    // ── Tarjeta compacta (estado cerrado) ────────────────────────────────
    buildCompactCard: function (persona, docs, index) {
        const iniciales = this.getIniciales(persona);
        const total     = docs.length;
        const conEnlace = docs.filter(d => this.isValidUrl(d.url)).length;

        return `
            <div class="card span-6 doc-compact-card" id="doc-card-${index}">

                <!-- Cabecera clickeable -->
                <div class="doc-compact-header"
                     role="button" tabindex="0"
                     aria-expanded="false"
                     aria-controls="doc-body-${index}"
                     onclick="ModuleDocuments.toggleCard(${index})"
                     onkeydown="if(event.key==='Enter'||event.key===' ')ModuleDocuments.toggleCard(${index})">

                    <div class="doc-compact-avatar">${iniciales}</div>

                    <div class="doc-compact-info">
                        <span class="doc-compact-name">${this.escapeHtml(persona)}</span>
                        <span class="doc-compact-meta">
                            ${total} doc${total !== 1 ? 's' : ''}
                            · ${conEnlace} enlace${conEnlace !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div class="doc-compact-chevron" id="doc-chevron-${index}">
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>

                </div>

                <!-- Cuerpo colapsable -->
                <div class="doc-compact-body" id="doc-body-${index}" style="display:none;">
                    <table class="data-table doc-table">
                        <tbody>
                            ${docs.map(doc => this.buildDocRow(doc)).join('')}
                        </tbody>
                    </table>
                </div>

            </div>`;
    },

    // ── Fila de un documento ─────────────────────────────────────────────
    buildDocRow: function (doc) {
        const categoria = this.escapeHtml(doc.categoria || 'Documento');
        const nombre    = this.escapeHtml(doc.nombre    || '');
        const icon      = this.getCategoryIcon(doc.categoria);
        const hasUrl    = this.isValidUrl(doc.url);
        const href      = hasUrl ? this.escapeHtml(doc.url) : null;

        const btnLink = hasUrl
            ? `<a href="${href}" target="_blank" rel="noopener noreferrer"
                   class="btn-action doc-link-btn" title="Abrir documento" style="flex-shrink:0;">
                   <i class="fa-solid fa-arrow-up-right-from-square"></i>
               </a>`
            : `<span class="doc-no-link" title="Sin enlace" style="flex-shrink:0;">
                   <i class="fa-solid fa-link-slash"></i>
               </span>`;

        const nameEl = hasUrl
            ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="doc-name-link">
                   <i class="${icon} doc-row-icon"></i>
                   <span class="doc-name-text">${categoria}</span>
               </a>`
            : `<span class="doc-name">
                   <i class="${icon} doc-row-icon"></i>
                   <span class="doc-name-text">${categoria}</span>
               </span>`;

        return `
            <tr>
                <td style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding: 10px 16px;">
                    <div class="doc-row-main" style="flex:1; min-width:0;">
                        ${nameEl}
                        <span class="doc-row-categoria">${nombre}</span>
                    </div>
                    ${btnLink}
                </td>
            </tr>`;
    },

    // ── Toggle colapsar / expandir ───────────────────────────────────────
    toggleCard: function (index) {
        const body    = document.getElementById(`doc-body-${index}`);
        const chevron = document.getElementById(`doc-chevron-${index}`);
        const header  = chevron.closest('.doc-compact-header');

        const isOpen = body.style.display !== 'none';

        if (isOpen) {
            body.style.display = 'none';
            chevron.style.transform = 'rotate(0deg)';
            header.setAttribute('aria-expanded', 'false');
        } else {
            body.style.display = 'block';
            chevron.style.transform = 'rotate(180deg)';
            header.setAttribute('aria-expanded', 'true');
        }
    },

    // ── Estado vacío ─────────────────────────────────────────────────────
    renderEmpty: function (board) {
        board.innerHTML = `
            <div class="card span-6 doc-empty-state">
                <i class="fa-solid fa-folder-open doc-empty-icon"></i>
                <h3>Sin documentos registrados</h3>
                <p>Agrega documentos directamente en Google Sheets.<br>
                   Una vez guardados, aparecerán aquí automáticamente.</p>
                <a href="https://docs.google.com/spreadsheets/d/14JPkOK-1b4guR6Mx7QXX0DZDKk19QpiC2v5jLPE9GHA/edit"
                   target="_blank" rel="noopener noreferrer"
                   class="btn btn-primary">
                    <i class="fa-solid fa-table-cells"></i> Abrir Google Sheets
                </a>
            </div>`;
    },

    // ── Utilidades ───────────────────────────────────────────────────────

    groupByPerson: function (documents) {
        const grouped = {};
        documents.forEach(doc => {
            const persona = (doc.nombre || 'Sin nombre').toString().trim();
            if (!grouped[persona]) grouped[persona] = [];
            grouped[persona].push(doc);
        });
        return grouped;
    },

    isValidUrl: function (url) {
        if (!url) return false;
        const str = String(url).trim();
        return str.startsWith('http://') || str.startsWith('https://');
    },

    getCategoryIcon: function (categoria) {
        const key = (categoria || '').toString().toLowerCase().trim();
        if (this.CATEGORY_ICONS[key]) return this.CATEGORY_ICONS[key];
        for (const [k, icon] of Object.entries(this.CATEGORY_ICONS)) {
            if (key.includes(k) || k.includes(key)) return icon;
        }
        return 'fa-solid fa-file';
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
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#039;');
    }
};

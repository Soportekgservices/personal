/**
 * ModuleHousing — Centro de Información Familiar
 * Módulo de solo lectura. Muestra la información de cada inmueble
 * registrado en la hoja "Vivienda" de Google Sheets.
 */
const ModuleHousing = {

    // Íconos por tipo de inmueble
    TYPE_ICONS: {
        'apartamento': 'fa-solid fa-building',
        'casa':        'fa-solid fa-house',
        'lote':        'fa-solid fa-map',
        'local':       'fa-solid fa-store',
        'finca':       'fa-solid fa-tree',
        'otro':        'fa-solid fa-house-circle-question'
    },

    // ── Punto de entrada ─────────────────────────────────────
    render: async function () {
        const board = document.getElementById('dynamicBoard');

        board.innerHTML = `
            <div class="hsng-loading span-6">
                <div class="spinner"></div>
                <p>Cargando información de vivienda...</p>
            </div>`;

        try {
            const properties = await Storage.getHousing();

            if (!properties || properties.length === 0) {
                this.renderEmpty(board);
                return;
            }

            this.renderCards(board, properties);

        } catch (err) {
            console.error('[ModuleHousing] Error al cargar vivienda:', err);
            board.innerHTML = `
                <div class="card span-6 hsng-error-card">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>No se pudo cargar la información de vivienda.<br>
                       Verifica la conexión e intenta de nuevo.</p>
                    <button class="btn btn-secondary btn-sm" onclick="ModuleHousing.render()">
                        <i class="fa-solid fa-rotate-right"></i> Reintentar
                    </button>
                </div>`;
        }
    },

    // ── Renderiza todas las tarjetas ─────────────────────────
    renderCards: function (board, properties) {
        let html = '';
        properties.forEach(property => {
            html += this.buildPropertyCard(property);
        });
        board.innerHTML = html;
    },

    // ── Construye la tarjeta de un inmueble ──────────────────
    buildPropertyCard: function (p) {
        const tipo      = this.escapeHtml(p.tipo      || 'Inmueble');
        const direccion = this.escapeHtml(p.direccion || '');
        const ciudad    = this.escapeHtml(p.ciudad    || '');
        const pais      = this.escapeHtml(p.pais      || '');
        const matricula = this.escapeHtml(p.matriculaInmobiliaria || '');

        // Ícono según tipo
        const iconKey = tipo.toLowerCase().trim();
        const icon    = this.TYPE_ICONS[iconKey] || this.TYPE_ICONS['otro'];

        // Subtítulo: ciudad + país si existen
        const ubicacion = [ciudad, pais].filter(Boolean).join(', ');

        // ── Campos de la ficha ──
        let camposHtml = '';

        if (direccion) {
            camposHtml += this.buildField(
                'fa-solid fa-location-dot',
                'Dirección',
                direccion
            );
        }

        if (ciudad) {
            camposHtml += this.buildField(
                'fa-solid fa-city',
                'Ciudad',
                ciudad
            );
        }

        if (pais) {
            camposHtml += this.buildField(
                'fa-solid fa-earth-americas',
                'País',
                pais
            );
        }

        if (matricula) {
            camposHtml += this.buildField(
                'fa-solid fa-file-contract',
                'Matrícula inmobiliaria',
                `<code class="hsng-code">${matricula}</code>`
            );
        }

        return `
            <div class="card span-3 hsng-card">

                <!-- Cabecera -->
                <div class="hsng-card-header">
                    <div class="hsng-icon-wrap">
                        <i class="${icon}"></i>
                    </div>
                    <div class="hsng-card-info">
                        <h3 class="hsng-tipo">${tipo}</h3>
                        ${ubicacion
                            ? `<span class="hsng-ubicacion">
                                   <i class="fa-solid fa-location-dot"></i>
                                   ${ubicacion}
                               </span>`
                            : ''}
                    </div>
                </div>

                <!-- Campos -->
                ${camposHtml
                    ? `<div class="hsng-fields">${camposHtml}</div>`
                    : ''}

            </div>`;
    },

    // ── Campo individual ──────────────────────────────────────
    buildField: function (icon, label, value) {
        return `
            <div class="hsng-field">
                <span class="hsng-field-icon"><i class="${icon}"></i></span>
                <span class="hsng-field-label">${label}</span>
                <span class="hsng-field-value">${value}</span>
            </div>`;
    },

    // ── Estado vacío ─────────────────────────────────────────
    renderEmpty: function (board) {
        board.innerHTML = `
            <div class="card span-6 hsng-empty-state">
                <i class="fa-solid fa-house-circle-xmark hsng-empty-icon"></i>
                <h3>Sin inmuebles registrados</h3>
                <p>Agrega la información de tu vivienda directamente en Google Sheets.<br>
                   Una vez guardada, aparecerá aquí automáticamente.</p>
                <a href="https://docs.google.com/spreadsheets/d/14JPkOK-1b4guR6Mx7QXX0DZDKk19QpiC2v5jLPE9GHA/edit"
                   target="_blank" rel="noopener noreferrer"
                   class="btn btn-primary">
                    <i class="fa-solid fa-table-cells"></i> Abrir Google Sheets
                </a>
            </div>`;
    },

    // ── Protección XSS ───────────────────────────────────────
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

/**
 * ModuleVehicles — Centro de Información Familiar
 * Vista inicial: tarjetas resumen por vehículo.
 * Al hacer click: detalle completo con info + documentos.
 * Módulo de solo lectura.
 */
const ModuleVehicles = {

    // ── Configuración visual por tipo ────────────────────────
    TYPE_CONFIG: {
        'moto':       { icon: 'fa-solid fa-motorcycle',    gradient: 'linear-gradient(135deg,#F97316,#C2410C)', glow: 'rgba(249,115,22,0.35)'  },
        'automóvil':  { icon: 'fa-solid fa-car',           gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', glow: 'rgba(59,130,246,0.35)'  },
        'automovil':  { icon: 'fa-solid fa-car',           gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', glow: 'rgba(59,130,246,0.35)'  },
        'auto':       { icon: 'fa-solid fa-car',           gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', glow: 'rgba(59,130,246,0.35)'  },
        'carro':      { icon: 'fa-solid fa-car',           gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', glow: 'rgba(59,130,246,0.35)'  },
        'camioneta':  { icon: 'fa-solid fa-truck-pickup',  gradient: 'linear-gradient(135deg,#10B981,#059669)', glow: 'rgba(16,185,129,0.35)'  },
        'camión':     { icon: 'fa-solid fa-truck',         gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', glow: 'rgba(139,92,246,0.35)'  },
        'camion':     { icon: 'fa-solid fa-truck',         gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', glow: 'rgba(139,92,246,0.35)'  },
        'default':    { icon: 'fa-solid fa-motorcycle',   gradient: 'linear-gradient(135deg,#F97316,#C2410C)', glow: 'rgba(249,115,22,0.35)'  }
    },

    // ── Punto de entrada ─────────────────────────────────────
    render: async function () {
        const board = document.getElementById('dynamicBoard');

        board.innerHTML = `
            <div class="vhc-loading span-6">
                <div class="spinner"></div>
                <p>Cargando vehículos...</p>
            </div>`;

        try {
            const vehicles = await Storage.getVehicles();
            if (!vehicles || vehicles.length === 0) {
                this.renderEmpty(board);
                return;
            }
            this.renderGrid(board, vehicles);
        } catch (err) {
            console.error('[ModuleVehicles]', err);
            board.innerHTML = `
                <div class="card span-6 vhc-error-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>No se pudieron cargar los vehículos.<br>Verifica la conexión e intenta de nuevo.</p>
                    <button class="btn btn-secondary btn-sm" onclick="ModuleVehicles.render()">
                        <i class="fa-solid fa-rotate-right"></i> Reintentar
                    </button>
                </div>`;
        }
    },

    // ── Vista de tarjetas resumen ────────────────────────────
    renderGrid: function (board, vehicles) {
        let html = '';
        vehicles.forEach((v, index) => {
            html += this.buildSummaryCard(v, index);
        });
        board.innerHTML = html;
    },

    // ── Tarjeta resumen (clic → detalle) ────────────────────
    buildSummaryCard: function (v, index) {
        const cfg    = this.getTypeConfig(v.tipo);
        const titulo = this.getTitle(v);
        const anio   = v.anio  ? String(v.anio).replace('.0','') : '';
        const placa  = this.escapeHtml(v.placa || '');
        const tipo   = this.escapeHtml(v.tipo  || '');

        // Subtítulo: año · placa
        const sub = [anio, placa].filter(Boolean).join(' · ');

        return `
            <div class="card span-2 vhc-summary-card"
                 role="button" tabindex="0"
                 aria-label="Ver detalle de ${titulo}"
                 onclick="ModuleVehicles.renderDetail(${index})"
                 onkeydown="if(event.key==='Enter'||event.key===' ')ModuleVehicles.renderDetail(${index})">

                <!-- Ícono del vehículo -->
                <div class="vhc-summary-icon" style="background:${cfg.gradient};box-shadow:0 6px 20px ${cfg.glow};">
                    <i class="${cfg.icon}"></i>
                </div>

                <!-- Datos principales -->
                <div class="vhc-summary-body">
                    <h3 class="vhc-summary-title">${this.escapeHtml(titulo)}</h3>
                    ${sub ? `<p class="vhc-summary-sub">${sub}</p>` : ''}
                    ${tipo ? `<span class="vhc-tipo-badge">${tipo}</span>` : ''}
                </div>

                <!-- Indicador de click -->
                <div class="vhc-summary-arrow">
                    <i class="fa-solid fa-chevron-right"></i>
                </div>

            </div>`;
    },

    // ── Vista de detalle de un vehículo ──────────────────────
    renderDetail: async function (index) {
        const board   = document.getElementById('dynamicBoard');
        const vehicles = await Storage.getVehicles();
        const v        = vehicles[index];
        if (!v) return;

        const cfg    = this.getTypeConfig(v.tipo);
        const titulo = this.getTitle(v);
        const anio   = v.anio ? String(v.anio).replace('.0','') : '';
        const sub    = [anio, this.escapeHtml(v.placa || '')].filter(Boolean).join(' · ');

        // ── Panel izquierdo: información general ──
        let infoHtml = '';
        const campos = [
            { icon: 'fa-solid fa-tag',            label: 'Tipo',     valor: v.tipo     },
            { icon: 'fa-solid fa-industry',        label: 'Marca',    valor: v.marca    },
            { icon: 'fa-solid fa-car-side',        label: 'Modelo',   valor: v.modelo   },
            { icon: 'fa-solid fa-calendar',        label: 'Año',      valor: anio       },
            { icon: 'fa-solid fa-hashtag',         label: 'Placa',    valor: v.placa, isPlaca: true },
            { icon: 'fa-solid fa-calendar-check',  label: 'Adquirido',valor: this.formatFecha(v.fechaCompra) }
        ];

        campos.forEach(c => {
            if (!c.valor) return;
            const val = c.isPlaca
                ? `<span class="vhc-placa">${this.escapeHtml(c.valor)}</span>`
                : this.escapeHtml(String(c.valor));
            infoHtml += `
                <div class="vhc-field">
                    <span class="vhc-field-icon"><i class="${c.icon}"></i></span>
                    <span class="vhc-field-label">${c.label}</span>
                    <span class="vhc-field-value">${val}</span>
                </div>`;
        });

        // ── Panel derecho: documentos ──
        const docs = [
            { icon: 'fa-solid fa-id-card',            label: 'Tarjeta de Propiedad',   url: v.urlTarjeta  },
            { icon: 'fa-solid fa-shield-halved',      label: 'SOAT',                   url: v.urlSoat     },
            { icon: 'fa-solid fa-screwdriver-wrench', label: 'Tecnomecánica',           url: v.urlTecno    },
            { icon: 'fa-solid fa-id-badge',           label: 'Licencia de Conducción',  url: v.urlLicencia },
            { icon: 'fa-solid fa-file-invoice-dollar',label: 'Factura de Compra',       url: v.urlFactura  }
        ];

        let docsHtml = '';
        docs.forEach(doc => {
            const hasUrl = doc.url && doc.url.toString().trim() !== '';
            docsHtml += `
                <div class="vhc-doc-item ${hasUrl ? '' : 'vhc-doc-item--empty'}">
                    <div class="vhc-doc-left">
                        <div class="vhc-doc-icon ${hasUrl ? 'vhc-doc-icon--active' : ''}">
                            <i class="${doc.icon}"></i>
                        </div>
                        <span class="vhc-doc-label">${doc.label}</span>
                    </div>
                    ${hasUrl
                        ? `<a href="${this.escapeHtml(doc.url.toString())}"
                              target="_blank" rel="noopener noreferrer"
                              class="vhc-doc-btn"
                              title="Abrir ${doc.label}">
                               <i class="fa-solid fa-arrow-up-right-from-square"></i>
                               Abrir
                           </a>`
                        : `<span class="vhc-doc-na">Sin documento</span>`}
                </div>`;
        });

        board.innerHTML = `
            <!-- Botón volver -->
            <div class="span-6 vhc-back-row">
                <button class="vhc-back-btn" onclick="ModuleVehicles.render()">
                    <i class="fa-solid fa-arrow-left"></i> Volver a vehículos
                </button>
            </div>

            <!-- Tarjeta de detalle -->
            <div class="card span-6 vhc-detail-card">

                <!-- Cabecera del detalle -->
                <div class="vhc-detail-header" style="border-bottom-color:transparent;">
                    <div class="vhc-detail-icon" style="background:${cfg.gradient};box-shadow:0 6px 24px ${cfg.glow};">
                        <i class="${cfg.icon}"></i>
                    </div>
                    <div class="vhc-detail-title-wrap">
                        <h2 class="vhc-detail-title">${this.escapeHtml(titulo)}</h2>
                        ${sub ? `<p class="vhc-detail-sub">${sub}</p>` : ''}
                    </div>
                    ${v.tipo ? `<span class="vhc-tipo-badge vhc-tipo-badge--lg">${this.escapeHtml(v.tipo)}</span>` : ''}
                </div>

                <!-- Cuerpo: 2 columnas -->
                <div class="vhc-detail-body">

                    <!-- Columna izquierda: datos -->
                    <div class="vhc-info-panel">
                        <h4 class="vhc-panel-title">
                            <i class="fa-solid fa-circle-info"></i> Información general
                        </h4>
                        <div class="vhc-fields">
                            ${infoHtml || '<p class="vhc-no-data">Sin datos registrados.</p>'}
                        </div>
                    </div>

                    <!-- Divisor vertical -->
                    <div class="vhc-divider"></div>

                    <!-- Columna derecha: documentos -->
                    <div class="vhc-docs-panel">
                        <h4 class="vhc-panel-title">
                            <i class="fa-solid fa-folder-open"></i> Documentos
                        </h4>
                        <div class="vhc-docs-list">
                            ${docsHtml}
                        </div>
                    </div>

                </div>
            </div>`;
    },

    // ── Estado vacío ─────────────────────────────────────────
    renderEmpty: function (board) {
        board.innerHTML = `
            <div class="card span-6 vhc-empty-state">
                <i class="fa-solid fa-car-burst vhc-empty-icon"></i>
                <h3>Sin vehículos registrados</h3>
                <p>Agrega la información de tus vehículos directamente en Google Sheets.<br>
                   Una vez guardada, aparecerá aquí automáticamente.</p>
                <a href="https://docs.google.com/spreadsheets/d/14JPkOK-1b4guR6Mx7QXX0DZDKk19QpiC2v5jLPE9GHA/edit"
                   target="_blank" rel="noopener noreferrer"
                   class="btn btn-primary">
                    <i class="fa-solid fa-table-cells"></i> Abrir Google Sheets
                </a>
            </div>`;
    },

    // ── Utilidades ───────────────────────────────────────────

    getTypeConfig: function (tipo) {
        const key = (tipo || '').toLowerCase().trim();
        return this.TYPE_CONFIG[key] || this.TYPE_CONFIG['default'];
    },

    getTitle: function (v) {
        const marca  = v.marca  || '';
        const modelo = v.modelo || '';
        return [marca, modelo].filter(Boolean).join(' ') || 'Vehículo';
    },

    formatFecha: function (raw) {
        if (!raw) return '';
        let fecha;
        if (raw instanceof Date) {
            fecha = raw;
        } else {
            const str = String(raw).trim();
            if (!str) return str;
            fecha = new Date(str);
            if (isNaN(fecha.getTime())) {
                const parts = str.split(/[\/\-\.]/);
                if (parts.length === 3) {
                    const y = parts[0].length === 4 ? parts[0] : parts[2];
                    const m = parts[0].length === 4 ? parts[1] : parts[1];
                    const d = parts[0].length === 4 ? parts[2] : parts[0];
                    fecha = new Date(`${y}-${m}-${d}`);
                }
            }
        }
        if (!fecha || isNaN(fecha.getTime())) return String(raw);
        return fecha.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
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

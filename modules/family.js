/**
 * ModuleFamily — Centro de Información Familiar
 * Módulo de solo lectura. Los datos se gestionan en Google Sheets.
 * Muestra una tarjeta visual por cada integrante de la familia.
 */
const ModuleFamily = {

    // ── Punto de entrada ─────────────────────────────────────────────────
    render: async function () {
        const board = document.getElementById('dynamicBoard');

        board.innerHTML = `
            <div class="fam-loading span-6">
                <div class="spinner"></div>
                <p>Cargando información familiar...</p>
            </div>`;

        try {
            const members = await Storage.getFamily();

            if (!members || members.length === 0) {
                this.renderEmpty(board);
                return;
            }

            this.renderCards(board, members);

        } catch (err) {
            console.error('[ModuleFamily] Error al cargar familia:', err);
            board.innerHTML = `
                <div class="card span-6 fam-error-card">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>No se pudo cargar la información familiar.<br>
                       Verifica la conexión e intenta de nuevo.</p>
                    <button class="btn btn-secondary btn-sm" onclick="ModuleFamily.render()">
                        <i class="fa-solid fa-rotate-right"></i> Reintentar
                    </button>
                </div>`;
        }
    },

    // ── Renderiza todas las tarjetas ─────────────────────────────────────
    renderCards: function (board, members) {
        let html = '';

        members.forEach(member => {
            html += this.buildMemberCard(member);
        });

        board.innerHTML = html;
    },

    // ── Construye la tarjeta de un integrante ─────────────────────────────
    buildMemberCard: function (m) {
        const nombre    = this.escapeHtml(m.nombre    || '');
        const categoria = this.escapeHtml(m.categoria || '');
        const cedula    = this.escapeHtml(m.cedula    || '');
        const eps       = this.escapeHtml(m.eps       || '');
        const urlEps          = m.urlEps         || '';
        const certificadoEps  = m.certificadoEps   || '';
        const certificadoAdres= m.certificadoAdres || '';
        const grupoSanguineo  = this.escapeHtml(m.grupoSanguineo || '');

        // Fecha de nacimiento y edad
        const fechaRaw  = m.fechaNacimiento || '';
        const fechaFmt  = this.formatearFecha(fechaRaw);
        const edad      = this.calcularEdad(fechaRaw);

        // Avatar: iniciales del nombre
        const iniciales = this.getIniciales(nombre);
        const avatarColor = this.getAvatarColor(categoria);

        // ── Filas de datos personales ──
        let datosHtml = '';

        if (cedula) {
            datosHtml += `
                <div class="fam-field">
                    <span class="fam-field-icon"><i class="fa-solid fa-id-card"></i></span>
                    <span class="fam-field-label">Cédula</span>
                    <span class="fam-field-value">${cedula}</span>
                </div>`;
        }

        if (fechaFmt) {
            datosHtml += `
                <div class="fam-field">
                    <span class="fam-field-icon"><i class="fa-solid fa-cake-candles"></i></span>
                    <span class="fam-field-label">Nacimiento</span>
                    <span class="fam-field-value">${fechaFmt}</span>
                </div>`;
        }

        if (edad !== null) {
            datosHtml += `
                <div class="fam-field">
                    <span class="fam-field-icon"><i class="fa-solid fa-hourglass-half"></i></span>
                    <span class="fam-field-label">Edad</span>
                    <span class="fam-field-value"><strong>${edad}</strong> años</span>
                </div>`;
        }

        if (grupoSanguineo) {
            datosHtml += `
                <div class="fam-field">
                    <span class="fam-field-icon"><i class="fa-solid fa-droplet" style="color:var(--color-danger)"></i></span>
                    <span class="fam-field-label">Grupo sanguíneo</span>
                    <span class="fam-field-value">
                        <span class="fam-blood-badge">${grupoSanguineo}</span>
                    </span>
                </div>`;
        }

        // ── Sección EPS (solo si hay al menos un dato) ──
        const tieneEps = eps || urlEps || certificadoEps || certificadoAdres;
        let epsHtml = '';

        if (tieneEps) {
            const btnPortal = urlEps
                ? `<a href="${this.escapeHtml(urlEps)}"
                      target="_blank" rel="noopener noreferrer"
                      class="btn btn-secondary btn-sm fam-eps-btn"
                      title="Abrir portal EPS">
                       <i class="fa-solid fa-arrow-up-right-from-square"></i> Portal
                   </a>`
                : '';

            const btnCert = certificadoEps
                ? `<a href="${this.escapeHtml(certificadoEps)}"
                      target="_blank" rel="noopener noreferrer"
                      class="btn btn-secondary btn-sm fam-eps-btn"
                      title="Ver certificado EPS">
                       <i class="fa-solid fa-file-pdf"></i> Certificado EPS
                   </a>`
                : '';

            const btnAdres = certificadoAdres
                ? `<a href="${this.escapeHtml(certificadoAdres)}"
                      target="_blank" rel="noopener noreferrer"
                      class="btn btn-secondary btn-sm fam-eps-btn"
                      title="Ver certificado ADRES">
                       <i class="fa-solid fa-file-pdf"></i> Certificado ADRES
                   </a>`
                : '';

            epsHtml = `
                <div class="fam-eps-section">
                    <div class="fam-eps-header">
                        <i class="fa-solid fa-hospital"></i>
                        <span>${eps || 'EPS'}</span>
                    </div>
                    ${(btnPortal || btnCert || btnAdres)
                        ? `<div class="fam-eps-actions">${btnPortal}${btnCert}${btnAdres}</div>`
                        : ''}
                </div>`;
        }

        return `
            <div class="card span-3 fam-card">

                <!-- Cabecera de la tarjeta -->
                <div class="fam-card-header">
                    <div class="fam-avatar ${avatarColor}">${iniciales}</div>
                    <div class="fam-card-info">
                        <h3 class="fam-nombre">${nombre}</h3>
                        ${categoria
                            ? `<span class="fam-categoria-badge">${categoria}</span>`
                            : ''}
                    </div>
                </div>

                <!-- Datos personales -->
                ${datosHtml
                    ? `<div class="fam-datos">${datosHtml}</div>`
                    : ''}

                <!-- EPS -->
                ${epsHtml}

            </div>`;
    },

    // ── Estado vacío ─────────────────────────────────────────────────────
    renderEmpty: function (board) {
        board.innerHTML = `
            <div class="card span-6 fam-empty-state">
                <i class="fa-solid fa-people-roof fam-empty-icon"></i>
                <h3>Sin integrantes registrados</h3>
                <p>Agrega los datos de tu familia directamente en Google Sheets.<br>
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
     * Calcula la edad en años completos a partir de una fecha.
     * Acepta objetos Date (de Sheets), strings ISO y strings DD/MM/YYYY.
     * Devuelve null si la fecha no es válida.
     */
    calcularEdad: function (fechaRaw) {
        if (!fechaRaw) return null;
        let fecha;

        // Sheets puede devolver un objeto Date serializado o un string
        if (fechaRaw instanceof Date) {
            fecha = fechaRaw;
        } else {
            const str = String(fechaRaw).trim();
            if (!str) return null;
            // Intentar parseo directo (ISO, YYYY-MM-DD)
            fecha = new Date(str);
            // Si falla, intentar DD/MM/YYYY
            if (isNaN(fecha.getTime())) {
                const parts = str.split(/[\/\-\.]/);
                if (parts.length === 3) {
                    // Detectar si es DD/MM/YYYY o YYYY/MM/DD
                    const y = parts[0].length === 4 ? parts[0] : parts[2];
                    const m = parts[0].length === 4 ? parts[1] : parts[1];
                    const d = parts[0].length === 4 ? parts[2] : parts[0];
                    fecha = new Date(`${y}-${m}-${d}`);
                }
            }
        }

        if (!fecha || isNaN(fecha.getTime())) return null;

        const hoy   = new Date();
        let   edad  = hoy.getFullYear() - fecha.getFullYear();
        const mes   = hoy.getMonth() - fecha.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;
        return edad >= 0 && edad < 130 ? edad : null;
    },

    /**
     * Formatea una fecha para mostrar: "14 may 1990"
     * Acepta el mismo tipo de entradas que calcularEdad.
     */
    formatearFecha: function (fechaRaw) {
        if (!fechaRaw) return '';
        let fecha;

        if (fechaRaw instanceof Date) {
            fecha = fechaRaw;
        } else {
            const str = String(fechaRaw).trim();
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

        if (!fecha || isNaN(fecha.getTime())) return String(fechaRaw);

        return fecha.toLocaleDateString('es-CO', {
            day:   '2-digit',
            month: 'short',
            year:  'numeric'
        });
    },

    /**
     * Devuelve las iniciales del nombre (máximo 2 letras).
     */
    getIniciales: function (nombre) {
        if (!nombre) return '?';
        const partes = nombre.trim().split(/\s+/);
        if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
        return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
    },

    /**
     * Asigna un color de avatar según la categoría del integrante.
     */
    getAvatarColor: function (categoria) {
        const map = {
            'padre':  'fam-avatar-blue',
            'madre':  'fam-avatar-purple',
            'esposo': 'fam-avatar-blue',
            'esposa': 'fam-avatar-purple',
            'hijo':   'fam-avatar-green',
            'hija':   'fam-avatar-green',
            'abuelo': 'fam-avatar-orange',
            'abuela': 'fam-avatar-orange'
        };
        const key = (categoria || '').toLowerCase().trim();
        return map[key] || 'fam-avatar-default';
    },

    /**
     * Escapa caracteres HTML para prevenir XSS.
     */
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

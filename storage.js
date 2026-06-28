const Storage = {
    DB_NAME: 'domestic_finance_data',
    API_URL: window.APP_CONFIG && window.APP_CONFIG.API_URL ? window.APP_CONFIG.API_URL : '',

    _cache: { services: null, payments: null, documents: null, family: null, housing: null, contacts: null, vehicles: null },

    init: async function() {
        const raw = localStorage.getItem(this.DB_NAME);
        let localData = raw ? JSON.parse(raw) : { services: [], payments: [] };

        this._cache.services  = localData.services  || [];
        this._cache.payments  = localData.payments  || [];
        this._cache.documents = [];
        this._cache.family    = [];
        this._cache.housing   = [];
        this._cache.contacts  = [];
        this._cache.vehicles  = [];

        await this.syncWithCloud();
        return true;
    },

    syncWithCloud: async function() {
        try {
            const token = sessionStorage.getItem('hc_token');
            if (!token) return;

            const body = new URLSearchParams();
            body.append('action', 'getData');
            body.append('token', token);
            body.append('timestamp', Date.now().toString());

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: body
            });
            if (!response.ok) throw new Error('Respuesta de API no válida');

            const data = await response.json();
            if (data) {
                this._cache.services = (data.services || []).map(s => ({
                    ...s,
                    linkPago:           s.linkpago           || s.linkPago,
                    diaGeneracion:      s.diageneracion      || s.diaGeneracion,
                    diaVencimiento:     s.diavencimiento     || s.diaVencimiento,
                    fechaCreacion:      s.fechacreacion      || s.fechaCreacion,
                    fechaActualizacion: s.fechaactualizacion || s.fechaActualizacion,
                    fechaVencimiento:   s.fechavencimiento   || s.fechaVencimiento
                }));

                this._cache.payments = (data.payments || []).map(p => ({
                    ...p,
                    serviceId:       p.serviceid       || p.serviceId,
                    fechaVencimiento: p.fechavencimiento || p.fechaVencimiento,
                    isPaid:          p.ispaid !== undefined ? p.ispaid : p.isPaid,
                    fechaPago:       p.fechapago        || p.fechaPago,
                    fechaRegistro:   p.fecharegistro    || p.fechaRegistro
                }));

                this._cache.documents = (data.documents || []).map(d => ({
                    id:        d['id']        || d['ID']        || '',
                    categoria: d['categoría'] || d['categoria'] || d['Categoría'] || d['Categoria'] || '',
                    nombre:    d['nombre']    || d['Nombre']    || '',
                    url:       d['url']       || d['URL']       || ''
                }));

                this._cache.family = (data.family || []).map(f => ({
                    nombre:           f['persona']          || f['nombre']          || f['Persona']          || f['Nombre']          || '',
                    categoria:        f['categoría']        || f['categoria']       || f['Categoría']        || f['Categoria']       || '',
                    cedula:           f['cédula']           || f['cedula']          || f['Cédula']           || f['Cedula']          || '',
                    fechaNacimiento:  f['fechanacimiento']  || f['fechaNacimiento'] || f['FechaNacimiento']  || '',
                    eps:              f['eps']              || f['EPS']             || '',
                    urlEps:           f['url eps']          || f['urleps']          || f['URL EPS']          || f['urlEps']          || '',
                    certificadoEps:   f['certificado eps']  || f['certificadoeps']  || f['CERTIFICADO EPS']  || f['certificadoEps']  || '',
                    certificadoAdres: f['certificado adres']|| f['certificadoadres']|| f['Certificado ADRES']|| f['CertificadoADRES']|| '',
                    grupoSanguineo:   f['grupo sanguíneo']  || f['gruposanguineo']  || f['Grupo Sanguíneo']  || f['grupoSanguineo']  || ''
                }));

                this._cache.housing = (data.housing || []).map(h => ({
                    id:                    h['id']                 || h['ID']                    || '',
                    tipo:                  h['tipo']               || h['Tipo']                  || '',
                    direccion:             h['dirección']          || h['direccion']              || h['Dirección']            || h['Direccion']            || '',
                    ciudad:                h['ciudad']             || h['Ciudad']                || '',
                    pais:                  h['país']               || h['pais']                  || h['País']                 || h['Pais']                 || '',
                    matriculaInmobiliaria: h['número de registro'] || h['numeroderegistro']       || h['Número de Registro']   || h['matriculaInmobiliaria'] || ''
                }));

                this._cache.contacts = (data.contacts || []).map(c => ({
                    nombre:    c['nombre']    || c['Nombre']    || '',
                    relacion:  c['relación']  || c['relacion']  || c['Relación']  || c['Relacion']  || '',
                    detalle:   c['detalle']   || c['Detalle']   || '',
                    telefono:  c['teléfono']  || c['telefono']  || c['Teléfono']  || c['Telefono']  || '',
                    whatsapp:  c['whatsapp']  || c['Whatsapp']  || c['WhatsApp']  || '',
                    ubicacion: c['ubicación'] || c['ubicacion'] || c['Ubicación'] || c['Ubicacion'] || ''
                }));

                this._cache.vehicles = (data.vehicles || []).map(v => ({
                    id:          v['id']          || v['ID']    || '',
                    tipo:        v['tipo']         || v['Tipo']  || '',
                    marca:       v['marca']        || v['Marca'] || '',
                    modelo:      v['modelo']       || v['Modelo']|| '',
                    anio:        v['año']          || v['anio']  || v['Año']  || v['Anio']  || '',
                    placa:       v['placa']        || v['Placa'] || '',
                    fechaCompra: v['fecha compra'] || v['fechacompra'] || v['Fecha Compra'] || v['FechaCompra'] || '',
                    urlTarjeta:  v['tarjeta de propiedad (url)'] || v['tarjeta de propiedad'] || v['Tarjeta de Propiedad (URL)'] || '',
                    urlSoat:     v['soat (url)']   || v['soat']  || v['SOAT (URL)'] || v['SOAT'] || '',
                    urlTecno:    v['tecnomecánica (url)'] || v['tecnomecanica (url)'] || v['tecnomecanica'] || v['Tecnomecánica (URL)'] || '',
                    urlLicencia: v['licencia de conducción (url)'] || v['licencia de conduccion (url)'] || v['licencia de conduccion'] || v['Licencia de Conducción (URL)'] || '',
                    urlFactura:  v['factura compra (url)'] || v['factura de compra (url)'] || v['Factura Compra (URL)'] || v['Factura de Compra (URL)'] || ''
                }));

                this.saveAll({
                    ...this.getAll(),
                    services: this._cache.services,
                    payments: this._cache.payments
                });
            }
        } catch (e) {
            console.warn('No se pudo sincronizar con la nube, usando datos locales.');
        }
    },

    getAll: function() {
        return JSON.parse(localStorage.getItem(this.DB_NAME));
    },

    saveAll: function(data) {
        localStorage.setItem(this.DB_NAME, JSON.stringify(data));
    },

    getServices: async function() {
        return this._cache.services || [];
    },

    getPayments: async function() {
        return this._cache.payments || [];
    },

    saveService: async function(service) {
        if (!service.id) {
            service.id = Date.now();
            service.fechaCreacion = new Date().toISOString();
        }
        service.fechaActualizacion = new Date().toISOString();

        const localData = this.getAll();
        const index = localData.services.findIndex(s => s.id === service.id);
        if (index > -1) localData.services[index] = service;
        else localData.services.push(service);
        this.saveAll(localData);
        this._cache.services = localData.services;

        const apiData = { ...service };
        apiData.linkpago           = service.linkPago;
        apiData.diageneracion      = service.diaGeneracion;
        apiData.diavencimiento     = service.diaVencimiento;
        apiData.fechacreacion      = service.fechaCreacion;
        apiData.fechaactualizacion = service.fechaActualizacion;

        await fetch(this.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'saveService', data: apiData, token: sessionStorage.getItem('hc_token'), timestamp: Date.now().toString() })
        });

        return service;
    },

    deleteService: async function(id) {
        const localData = this.getAll();
        localData.services = localData.services.filter(s => s.id !== id);
        this.saveAll(localData);
        this._cache.services = localData.services;

        await fetch(this.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'deleteService', data: { id: id }, token: sessionStorage.getItem('hc_token'), timestamp: Date.now().toString() })
        });

        return true;
    },

    savePayment: async function(payment) {
        payment.id = Date.now();
        payment.fechaRegistro = new Date().toISOString();

        const localData = this.getAll();
        localData.payments.push(payment);

        const sIndex = localData.services.findIndex(s => s.id === payment.serviceId);
        if (sIndex !== -1) {
            localData.services[sIndex].valor           = payment.valor;
            localData.services[sIndex].estado          = payment.isPaid ? 'Pagado' : 'Pendiente';
            localData.services[sIndex].fechaVencimiento = payment.fechaVencimiento;
            localData.services[sIndex].fechaPago       = payment.isPaid ? payment.fechaPago : null;
            localData.services[sIndex].fechaActualizacion = new Date().toISOString();
        }

        this.saveAll(localData);
        this._cache.services = localData.services;
        this._cache.payments = localData.payments;

        const apiData = { ...payment };
        apiData.serviceid        = payment.serviceId;
        apiData.fechavencimiento = payment.fechaVencimiento;
        apiData.ispaid           = payment.isPaid;
        apiData.fechapago        = payment.fechaPago;
        apiData.fecharegistro    = payment.fechaRegistro;

        await fetch(this.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'savePayment', data: apiData, token: sessionStorage.getItem('hc_token'), timestamp: Date.now().toString() })
        });

        return true;
    },

    getInvoiceDateStats: function() {
        const data = this.getAll();
        const services = data.services || [];
        if (services.length === 0) return null;
        const dias = services.map(s => s.diaGeneracion).filter(d => typeof d === 'number');
        const total = dias.reduce((a, b) => a + b, 0);
        const promedio = Math.round(total / dias.length);
        const min = Math.min(...dias);
        const max = Math.max(...dias);
        const rango = { desde: Math.max(1, promedio - 3), hasta: Math.min(31, promedio + 3) };
        return { promedio, min, max, rango };
    },

    getDocuments: async function() { return this._cache.documents || []; },
    getFamily:    async function() { return this._cache.family    || []; },
    getHousing:   async function() { return this._cache.housing   || []; },
    getContacts:  async function() { return this._cache.contacts  || []; },
    getVehicles:  async function() { return this._cache.vehicles  || []; },

    fetchCredentialSecret: async function(id) {
        if (!id) return '';
        const token = sessionStorage.getItem('hc_token');
        if (!token) return '';

        const body = new URLSearchParams();
        body.append('action', 'getCredentialSecret');
        body.append('token', token);
        body.append('id', id);

        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: body
        });

        if (!response.ok) return '';
        const result = await response.json().catch(() => null);
        return result && result.ok ? String(result.secret || '') : '';
    },

    getCredentials: async function() { return this._cache.credentials || []; }
};

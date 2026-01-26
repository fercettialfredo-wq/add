/* =========================================
   RAVENS ACCESS - ADMINISTRACIÓN (DASHBOARD)
   ========================================= */

/* =========================================
   1. CONFIGURACIÓN Y ESTADO GLOBAL
   ========================================= */
const CONFIG = {
    // Misma URL de Proxy que la app de guardias
    API_PROXY_URL: 'https://proxyoperador.azurewebsites.net/api/ravens-proxy'
};

const STATE = {
    session: {
        isLoggedIn: false,
        condominioId: null,
        usuario: null
    },
    // Almacena los datos actuales mostrados en la tabla
    currentData: [],
    // Control de UI
    activeTab: 'DASHBOARD'
};

/* =========================================
   2. MOTOR DE UI (DASHBOARD LAYOUT)
   ========================================= */

// Función auxiliar para fechas
function formatearFecha(fechaRaw) {
    if (!fechaRaw) return "-";
    const dateObj = new Date(fechaRaw);
    if (isNaN(dateObj)) return fechaRaw;
    return dateObj.toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

// Estructura Principal (Sidebar + Content)
const LAYOUT = (content) => `
    <div class="admin-layout" style="display:flex; height:100vh; font-family: 'Segoe UI', sans-serif; background-color:#f3f4f6;">
        <aside style="width:250px; background-color:#1e293b; color:white; display:flex; flex-direction:column; flex-shrink:0;">
            <div style="padding:20px; text-align:center; border-bottom:1px solid #334155;">
                <img src="icons/logo.png" style="width:60px; margin-bottom:10px;">
                <h2 style="margin:0; font-size:1.2rem; font-weight:600; letter-spacing:1px;">ADMIN PANEL</h2>
                <p style="margin:5px 0 0; font-size:0.8rem; color:#94a3b8;">Ravens Access</p>
            </div>
            
            <nav style="flex:1; padding:20px 0; overflow-y:auto;">
                ${renderMenuItem('DASHBOARD', 'fa-chart-line', 'Inicio')}
                <div style="padding:10px 25px; font-size:0.75rem; color:#64748b; font-weight:bold; margin-top:10px;">BITÁCORAS</div>
                ${renderMenuItem('LOG_VISITAS', 'fa-user-friends', 'Visitas')}
                ${renderMenuItem('LOG_PROVEEDORES', 'fa-truck', 'Proveedores')}
                ${renderMenuItem('LOG_PAQUETERIA', 'fa-box-open', 'Paquetería')}
                ${renderMenuItem('LOG_PERSONAL', 'fa-id-card-alt', 'Personal Servicio')}
                ${renderMenuItem('LOG_INTERNO', 'fa-user-shield', 'Personal Interno')}
                <div style="padding:10px 25px; font-size:0.75rem; color:#64748b; font-weight:bold; margin-top:10px;">ACCESOS DIGITALES</div>
                ${renderMenuItem('LOG_QR_RES', 'fa-qrcode', 'QR Residentes')}
                ${renderMenuItem('LOG_QR_VIS', 'fa-qrcode', 'QR Visitas')}
                ${renderMenuItem('LOG_EVENTOS', 'fa-calendar-check', 'Eventos')}
            </nav>

            <div style="padding:20px; border-top:1px solid #334155;">
                <button onclick="doLogout()" style="width:100%; background:transparent; border:1px solid #ef4444; color:#ef4444; padding:10px; border-radius:6px; cursor:pointer; transition:all 0.2s;">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
            </div>
        </aside>

        <main style="flex:1; overflow-y:auto; position:relative;">
            <header style="background:white; padding:15px 30px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <h2 id="page-title" style="margin:0; font-size:1.5rem; color:#0f172a;">Dashboard</h2>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="text-align:right;">
                        <div style="font-weight:bold; font-size:0.9rem;">Admin</div>
                        <div style="font-size:0.8rem; color:#64748b;">${STATE.session.condominioId || 'Sin Condominio'}</div>
                    </div>
                    <div style="width:40px; height:40px; background:#e2e8f0; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#64748b;">
                        <i class="fas fa-user"></i>
                    </div>
                </div>
            </header>

            <div id="admin-content" style="padding:30px;">
                ${content}
            </div>
        </main>
    </div>
`;

function renderMenuItem(id, icon, label) {
    const active = STATE.activeTab === id ? 'background-color:#334155; color:#38bdf8; border-right:3px solid #38bdf8;' : 'color:#cbd5e1;';
    return `
        <div onclick="navigate('${id}')" style="padding:12px 25px; cursor:pointer; display:flex; align-items:center; gap:15px; transition:background 0.2s; ${active}">
            <i class="fas ${icon}" style="width:20px; text-align:center;"></i>
            <span>${label}</span>
        </div>
    `;
}

// Pantallas
const SCREENS = {
    'LOGIN': `
        <div style="height:100vh; display:flex; justify-content:center; align-items:center; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
            <div style="background:white; padding:40px; border-radius:16px; width:100%; max-width:400px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                <div style="text-align:center; margin-bottom:30px;">
                    <img src="icons/logo.png" style="width:80px;">
                    <h1 style="color:#1e293b; font-size:1.8rem; margin:10px 0 0;">Acceso Administrativo</h1>
                    <p style="color:#64748b;">Ravens Access Control</p>
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:block; color:#475569; font-weight:600; margin-bottom:5px;">Usuario</label>
                    <input type="text" id="login-user" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; outline:none;" placeholder="admin">
                </div>
                <div style="margin-bottom:30px;">
                    <label style="display:block; color:#475569; font-weight:600; margin-bottom:5px;">Contraseña</label>
                    <input type="password" id="login-pass" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; outline:none;" placeholder="••••••">
                </div>
                <button onclick="doLogin()" style="width:100%; padding:14px; background:#2563eb; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">INGRESAR</button>
                <p id="login-error" style="color:#ef4444; text-align:center; margin-top:15px; display:none;"></p>
            </div>
        </div>
    `,
    'DASHBOARD': `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:20px;">
            ${renderCard('Visitas Recientes', 'Ver actividad', 'fa-user-friends', '#3b82f6', "navigate('LOG_VISITAS')")}
            ${renderCard('Paquetería', 'Entradas/Salidas', 'fa-box', '#f59e0b', "navigate('LOG_PAQUETERIA')")}
            ${renderCard('Accesos QR', 'Registro Digital', 'fa-qrcode', '#10b981', "navigate('LOG_QR_RES')")}
            ${renderCard('Proveedores', 'Historial', 'fa-truck', '#6366f1', "navigate('LOG_PROVEEDORES')")}
        </div>
        <div style="margin-top:40px; background:white; padding:30px; border-radius:12px; text-align:center; color:#64748b;">
            <i class="fas fa-chart-pie fa-3x" style="margin-bottom:20px; color:#cbd5e1;"></i>
            <h3>Bienvenido al Panel de Administración</h3>
            <p>Seleccione una opción del menú lateral para auditar los registros del condominio.</p>
        </div>
    `,
    'TABLE_VIEW': `
        <div style="background:white; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); overflow:hidden;">
            <div style="padding:20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between;">
                <input type="text" id="table-search" placeholder="Buscar en esta lista..." onkeyup="filterTable()" style="padding:10px; border:1px solid #cbd5e1; border-radius:6px; width:300px;">
                <button onclick="reloadCurrentTable()" style="padding:10px 20px; background:#f1f5f9; border:none; border-radius:6px; cursor:pointer; color:#475569;"><i class="fas fa-sync-alt"></i> Actualizar</button>
            </div>
            <div class="table-container" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                    <thead style="background:#f8fafc; color:#475569; text-align:left;">
                        <tr id="table-headers"></tr>
                    </thead>
                    <tbody id="table-body">
                        <tr><td colspan="5" style="padding:30px; text-align:center;">Cargando datos...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `
};

function renderCard(title, subtitle, icon, color, action) {
    return `
        <div onclick="${action}" style="background:white; padding:25px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); cursor:pointer; transition:transform 0.2s; display:flex; align-items:center; gap:20px;">
            <div style="width:60px; height:60px; border-radius:12px; background:${color}20; color:${color}; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                <i class="fas ${icon}"></i>
            </div>
            <div>
                <h3 style="margin:0; color:#1e293b; font-size:1.1rem;">${title}</h3>
                <p style="margin:5px 0 0; color:#64748b; font-size:0.9rem;">${subtitle}</p>
            </div>
        </div>
    `;
}

/* =========================================
   3. LÓGICA Y DATOS
   ========================================= */

async function callBackend(action, extraData = {}) {
    if (!STATE.session.condominioId && action !== 'login') {
        doLogout();
        return { success: false, message: "Sesión expirada" };
    }

    try {
        const payload = { 
            action, 
            condominio: STATE.session.condominioId, 
            usuario: STATE.session.usuario || "admin_web", 
            ...extraData 
        };
        
        const response = await fetch(CONFIG.API_PROXY_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Backend Error:", error);
        return { success: false, message: error.message };
    }
}

// --- SESIÓN ---
async function doLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');
    
    // Simulación simple de seguridad administrativa (En prod, validar rol en backend)
    // Para efectos de este código, validamos contra la misma API que el guardia
    if(!user || !pass) return;
    
    errorMsg.style.display = 'none';
    const btn = document.querySelector('button');
    btn.innerText = "Verificando...";
    btn.disabled = true;

    const res = await callBackend('login', { username: user, password: pass });

    if (res && res.success) {
        // Extraer ID Condominio (Soporte para diferentes respuestas de tu API)
        const condId = res.condominioId || res.condominio || (res.data && res.data.condominioId);
        if(!condId) {
             errorMsg.innerText = "Error: Usuario sin condominio asignado.";
             errorMsg.style.display = 'block';
             btn.disabled = false; btn.innerText = "INGRESAR";
             return;
        }

        STATE.session = { isLoggedIn: true, condominioId: condId, usuario: user };
        localStorage.setItem('ravensAdmin', JSON.stringify(STATE.session));
        navigate('DASHBOARD');
    } else {
        errorMsg.innerText = res.message || "Credenciales inválidas";
        errorMsg.style.display = 'block';
        btn.disabled = false; btn.innerText = "INGRESAR";
    }
}

function checkSession() { 
    const saved = localStorage.getItem('ravensAdmin'); 
    if (saved) { 
        STATE.session = JSON.parse(saved); 
        navigate('DASHBOARD'); 
    } else { 
        document.getElementById('viewport').innerHTML = SCREENS['LOGIN']; 
    } 
}

function doLogout() { 
    localStorage.removeItem('ravensAdmin'); 
    STATE.session = { isLoggedIn: false, condominioId: null, usuario: null }; 
    document.getElementById('viewport').innerHTML = SCREENS['LOGIN']; 
}

// --- NAVEGACIÓN ---
function navigate(screenId) {
    STATE.activeTab = screenId;
    
    // Si es Login
    if(screenId === 'LOGIN') { document.getElementById('viewport').innerHTML = SCREENS['LOGIN']; return; }

    // Renderizar Layout General
    let innerContent = '';
    let title = 'Panel de Control';

    // Determinar contenido
    if (screenId === 'DASHBOARD') {
        innerContent = SCREENS['DASHBOARD'];
        title = 'Inicio';
    } else {
        // Es una vista de tabla
        innerContent = SCREENS['TABLE_VIEW'];
        title = getTitleForScreen(screenId);
        // Cargar datos asíncronamente después de renderizar
        setTimeout(() => loadTableData(screenId), 100);
    }

    document.getElementById('viewport').innerHTML = LAYOUT(innerContent);
    const titleEl = document.getElementById('page-title');
    if(titleEl) titleEl.innerText = title;
}

function getTitleForScreen(id) {
    const map = {
        'LOG_VISITAS': 'Historial de Visitas',
        'LOG_PROVEEDORES': 'Bitácora de Proveedores',
        'LOG_PAQUETERIA': 'Entradas y Salidas de Paquetería',
        'LOG_PERSONAL': 'Personal de Servicio',
        'LOG_INTERNO': 'Bitácora Personal Interno',
        'LOG_QR_RES': 'Accesos QR Residentes',
        'LOG_QR_VIS': 'Accesos QR Visitas',
        'LOG_EVENTOS': 'Accesos a Eventos'
    };
    return map[id] || 'Registros';
}

// --- CARGA DE DATOS (TABLAS) ---
async function loadTableData(screenId) {
    // Mapeo Screen -> Tipo Lista Logic App
    const typeMap = {
        'LOG_VISITAS': 'VISITA',
        'LOG_PROVEEDORES': 'PROVEEDOR',
        'LOG_PAQUETERIA': 'PAQUETERIA_RECEPCION', // Por defecto carga Recepción, luego unimos Entrega
        'LOG_PERSONAL': 'PERSONAL_DE_SERVICIO',
        'LOG_INTERNO': 'PERSONAL_INTERNO',
        'LOG_QR_RES': 'QR_RESIDENTE',
        'LOG_QR_VIS': 'QR_VISITA',
        'LOG_EVENTOS': 'EVENTO'
    };

    const logicAppType = typeMap[screenId];
    if(!logicAppType) return;

    // Loading State
    const tbody = document.getElementById('table-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="padding:30px; text-align:center; color:#64748b;"><i class="fas fa-spinner fa-spin"></i> Cargando datos del servidor...</td></tr>';

    // Call Backend
    const res = await callBackend('get_history', { tipo_lista: logicAppType });
    
    let data = (res && res.data) ? res.data : [];

    // CASO ESPECIAL: PAQUETERÍA (Unir Entradas y Salidas)
    if (screenId === 'LOG_PAQUETERIA') {
        const resEntrega = await callBackend('get_history', { tipo_lista: 'PAQUETERIA_ENTREGA' });
        const dataEntrega = (resEntrega && resEntrega.data) ? resEntrega.data : [];
        // Combinar y ordenar
        data = [...data, ...dataEntrega].sort((a,b) => new Date(b.Fecha || b.Created) - new Date(a.Fecha || a.Created));
    }

    STATE.currentData = data;
    renderTable(screenId, data);
}

// --- RENDERIZADO DE TABLAS ---
function renderTable(screenId, data) {
    const thead = document.getElementById('table-headers');
    const tbody = document.getElementById('table-body');
    
    if(!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="padding:30px; text-align:center; color:#64748b;">No se encontraron registros recientes.</td></tr>';
        return;
    }

    // Definir columnas según la pantalla
    let columns = [];
    
    if (screenId === 'LOG_VISITAS') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Visitante', key: 'Nombre' },
            { header: 'Residente', key: 'Residente' },
            { header: 'Destino', key: 'Torre', format: (row) => `${row.Torre || '-'} ${row.Departamento || '-'}` },
            { header: 'Motivo', key: 'Motivo' },
            { header: 'Placa', key: 'Placa' },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    } else if (screenId === 'LOG_PAQUETERIA') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Tipo', key: 'Paqueteria', format: (row) => row.Recibio ? `<span style="color:#f59e0b; font-weight:bold;">ENTREGA</span>` : `<span style="color:#3b82f6; font-weight:bold;">RECEPCIÓN</span>` },
            { header: 'Paquetería/Quien Recibió', key: 'Paqueteria', format: (row) => row.Paqueteria || row.Recibio },
            { header: 'Para (Residente)', key: 'Residente' },
            { header: 'Destino', key: 'Torre', format: (row) => `${row.Torre || '-'} ${row.Departamento || '-'}` },
            { header: 'Evidencia', key: 'Foto', type: 'photo' }
        ];
    } else if (screenId === 'LOG_PROVEEDORES') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Empresa', key: 'Empresa' },
            { header: 'Nombre', key: 'Nombre' },
            { header: 'Residente', key: 'Residente' },
            { header: 'Asunto', key: 'Asunto' },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    } else if (screenId.includes('QR')) {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre' },
            { header: 'Residente', key: 'Residente' },
            { header: 'Ubicación', key: 'Torre', format: (row) => `${row.Torre || '-'} ${row.Departamento || '-'}` },
            { header: 'Tipo', key: 'Relación ', fallback: 'Visitante' },
            { header: 'Validación', key: 'Estatus', type: 'status' }
        ];
    } else if (screenId === 'LOG_INTERNO') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre' },
            { header: 'Movimiento', key: 'TipoMarca', format: (row) => row.TipoMarca === 'Entrada' ? '<span style="color:green">ENTRADA</span>' : '<span style="color:red">SALIDA</span>' },
            { header: 'Cargo', key: 'Cargo' }
        ];
    } else {
        // Genérico
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre' },
            { header: 'Detalle', key: 'Residente' },
            { header: 'Estatus', key: 'Estatus' }
        ];
    }

    // Render Headers
    thead.innerHTML = columns.map(col => `<th style="padding:15px; border-bottom:1px solid #e2e8f0;">${col.header}</th>`).join('') + '<th style="padding:15px; border-bottom:1px solid #e2e8f0;">Detalle</th>';

    // Render Rows
    tbody.innerHTML = data.map((row, index) => {
        const cells = columns.map(col => {
            let content = '-';
            
            // Lógica de formateo
            if (col.format) {
                content = col.format(row);
            } else if (col.type === 'date') {
                content = formatearFecha(row[col.key] || row.Fechayhora || row.Created);
            } else if (col.type === 'status') {
                content = getStatusBadge(row[col.key]);
            } else if (col.type === 'photo') {
                const imgUrl = row.Foto || row.FotoBase64;
                content = imgUrl ? '<i class="fas fa-camera" style="color:#64748b;"></i>' : '-';
            } else {
                content = row[col.key] || row[col.fallback] || '-';
            }

            return `<td style="padding:15px; border-bottom:1px solid #f1f5f9; color:#334155;">${content}</td>`;
        }).join('');

        return `<tr style="hover:background-color:#f8fafc;">${cells}<td style="padding:15px; border-bottom:1px solid #f1f5f9; text-align:center;"><button onclick="showAdminDetails(${index})" style="background:#e0f2fe; color:#0284c7; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;">Ver</button></td></tr>`;
    }).join('');
}

function getStatusBadge(status) {
    if (!status) return '<span style="padding:4px 8px; border-radius:12px; font-size:0.75rem; background:#f1f5f9; color:#64748b;">N/A</span>';
    const s = status.toString().toLowerCase().trim();
    let color = '#3b82f6'; let bg = '#eff6ff'; // Azul default
    
    if (['aceptado', 'entrada', 'autorizado', 'entregado'].includes(s)) { color = '#16a34a'; bg = '#dcfce7'; }
    if (['rechazado', 'salida', 'dañado', 'denegado'].includes(s)) { color = '#dc2626'; bg = '#fee2e2'; }
    if (['nuevo', 'pendiente'].includes(s)) { color = '#f59e0b'; bg = '#fef3c7'; }

    return `<span style="padding:4px 8px; border-radius:12px; font-size:0.75rem; background:${bg}; color:${color}; font-weight:600; text-transform:uppercase;">${status}</span>`;
}

// --- FILTRADO ---
function filterTable() {
    const term = document.getElementById('table-search').value.toLowerCase();
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

function reloadCurrentTable() {
    if(STATE.activeTab && STATE.activeTab.startsWith('LOG_')) {
        loadTableData(STATE.activeTab);
    }
}

// --- MODAL DETALLES ---
function showAdminDetails(index) {
    const item = STATE.currentData[index];
    if(!item) return;

    let contentHtml = '';
    const ignoreKeys = ['odata.type', 'ID', 'Id', 'Foto', 'FotoBase64', 'FirmaBase64', 'formulario'];

    // Tabla de propiedades
    for (const [key, value] of Object.entries(item)) {
        if (!ignoreKeys.includes(key) && value) {
            let displayVal = value;
            if (key.includes('Fecha') || key === 'Created') displayVal = formatearFecha(value);
            contentHtml += `
                <div style="display:flex; border-bottom:1px solid #f1f5f9; padding:8px 0;">
                    <strong style="width:140px; color:#64748b;">${key}:</strong>
                    <span style="flex:1; color:#0f172a;">${displayVal}</span>
                </div>
            `;
        }
    }

    // Imágenes
    let imgsHtml = '';
    const foto = item.Foto || item.FotoBase64;
    const firma = item.FirmaBase64;
    
    if(foto) {
        const src = foto.startsWith('http') || foto.startsWith('data:') ? foto : 'data:image/jpeg;base64,'+foto;
        imgsHtml += `<div style="margin-top:20px;"><p style="font-weight:bold; margin-bottom:5px;">Evidencia Fotográfica</p><img src="${src}" style="max-width:100%; border-radius:8px; border:1px solid #cbd5e1;"></div>`;
    }
    if(firma) {
        const src = firma.startsWith('http') || firma.startsWith('data:') ? firma : 'data:image/png;base64,'+firma;
        imgsHtml += `<div style="margin-top:20px;"><p style="font-weight:bold; margin-bottom:5px;">Firma de Conformidad</p><img src="${src}" style="max-width:100%; border-radius:8px; border:1px solid #cbd5e1; background:white;"></div>`;
    }

    const modal = `
        <div id="admin-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;">
            <div style="background:white; width:90%; max-width:600px; max-height:90vh; border-radius:12px; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
                <div style="padding:20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; font-size:1.2rem;">Detalles del Registro</h3>
                    <button onclick="document.getElementById('admin-modal').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;">&times;</button>
                </div>
                <div style="padding:20px; overflow-y:auto; flex:1;">
                    ${contentHtml}
                    ${imgsHtml}
                </div>
                <div style="padding:20px; border-top:1px solid #e2e8f0; text-align:right;">
                    <button onclick="document.getElementById('admin-modal').remove()" style="padding:10px 20px; background:#334155; color:white; border:none; border-radius:6px; cursor:pointer;">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Inicialización
window.onload = () => { checkSession(); };

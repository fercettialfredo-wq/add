/* =========================================
   RAVENS ACCESS - ADMINISTRACIÓN (DASHBOARD)
   ========================================= */

/* =========================================
   1. CONFIGURACIÓN Y ESTADO GLOBAL
   ========================================= */
const CONFIG = {
    // URL de tu NUEVO Proxy Admin (Python)
    API_PROXY_URL: 'https://proxyadmin-cyh0etgyf5c9hch6.mexicocentral-01.azurewebsites.net/api/ravens-admin-proxy'
};

const STATE = {
    session: {
        isLoggedIn: false,
        condominioId: null,
        usuario: null
    },
    currentData: [],
    activeTab: 'DASHBOARD'
};

/* =========================================
   2. MOTOR DE UI
   ========================================= */

function formatearFecha(fechaRaw) {
    if (!fechaRaw) return "-";
    const dateObj = new Date(fechaRaw);
    if (isNaN(dateObj)) return fechaRaw;
    return dateObj.toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

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
                
                <div style="padding:10px 25px; font-size:0.75rem; color:#64748b; font-weight:bold; margin-top:10px;">ADMINISTRACIÓN</div>
                ${renderMenuItem('LOG_RESIDENTES', 'fa-users', 'Residentes')}
                
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
            ${renderCard('Gestión Residentes', 'Altas y Bajas', 'fa-users', '#8b5cf6', "navigate('LOG_RESIDENTES')")}
            ${renderCard('Visitas Recientes', 'Ver actividad', 'fa-user-friends', '#3b82f6', "navigate('LOG_VISITAS')")}
            ${renderCard('Paquetería', 'Entradas/Salidas', 'fa-box', '#f59e0b', "navigate('LOG_PAQUETERIA')")}
            ${renderCard('Accesos QR', 'Registro Digital', 'fa-qrcode', '#10b981', "navigate('LOG_QR_RES')")}
        </div>
        <div style="margin-top:40px; background:white; padding:30px; border-radius:12px; text-align:center; color:#64748b;">
            <i class="fas fa-chart-pie fa-3x" style="margin-bottom:20px; color:#cbd5e1;"></i>
            <h3>Bienvenido al Panel de Administración</h3>
            <p>Seleccione una opción para gestionar o auditar el condominio.</p>
        </div>
    `,
    'TABLE_VIEW': `
        <div style="background:white; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); overflow:hidden;">
            <div style="padding:20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; gap:15px;">
                <div style="display:flex; gap:10px; flex:1;">
                    <input type="text" id="table-search" placeholder="Buscar..." onkeyup="filterTable()" style="padding:10px; border:1px solid #cbd5e1; border-radius:6px; width:300px;">
                    <button id="btn-add-entity" style="display:none; padding:10px 20px; background:#16a34a; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;" onclick="showAddUserForm()">+ Nuevo</button>
                </div>
                <button onclick="reloadCurrentTable()" style="padding:10px 20px; background:#f1f5f9; border:none; border-radius:6px; cursor:pointer; color:#475569;"><i class="fas fa-sync-alt"></i> Actualizar</button>
            </div>
            <div class="table-container" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                    <thead style="background:#f8fafc; color:#475569; text-align:left;">
                        <tr id="table-headers"></tr>
                    </thead>
                    <tbody id="table-body">
                        <tr><td colspan="10" style="padding:30px; text-align:center;">Cargando...</td></tr>
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
        
        return await response.json();

    } catch (error) {
        console.error("Backend Error:", error);
        return { success: false, message: error.message };
    }
}

async function doLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');
    if(!user || !pass) return;
    
    errorMsg.style.display = 'none';
    const btn = document.querySelector('button');
    btn.innerText = "Verificando..."; btn.disabled = true;

    const res = await callBackend('login', { username: user, password: pass });

    if (res && res.success) {
        const condId = res.condominioId || res.condominio || (res.data && res.data.condominioId);
        if(!condId) {
             errorMsg.innerText = "Error: Sin condominio asignado.";
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

function navigate(screenId) {
    STATE.activeTab = screenId;
    if(screenId === 'LOGIN') { document.getElementById('viewport').innerHTML = SCREENS['LOGIN']; return; }

    let innerContent = (screenId === 'DASHBOARD') ? SCREENS['DASHBOARD'] : SCREENS['TABLE_VIEW'];
    document.getElementById('viewport').innerHTML = LAYOUT(innerContent);
    
    const titleEl = document.getElementById('page-title');
    if(titleEl) titleEl.innerText = getTitleForScreen(screenId);

    // Mostrar botón "Nuevo" si estamos en Residentes
    const btnAdd = document.getElementById('btn-add-entity');
    if(btnAdd) btnAdd.style.display = (screenId === 'LOG_RESIDENTES') ? 'block' : 'none';

    if (screenId !== 'DASHBOARD') {
        setTimeout(() => loadTableData(screenId), 100);
    }
}

function getTitleForScreen(id) {
    const map = {
        'LOG_RESIDENTES': 'Gestión de Residentes',
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

/* =========================================
   4. CARGA Y RENDER DE TABLAS
   ========================================= */

async function loadTableData(screenId) {
    const typeMap = {
        'LOG_RESIDENTES': 'RESIDENTE',
        'LOG_VISITAS': 'VISITA',
        'LOG_PROVEEDORES': 'PROVEEDOR',
        'LOG_PAQUETERIA': 'PAQUETERIA_RECEPCION',
        'LOG_PERSONAL': 'PERSONAL_DE_SERVICIO',
        'LOG_INTERNO': 'PERSONAL_INTERNO',
        'LOG_QR_RES': 'QR_RESIDENTE',
        'LOG_QR_VIS': 'QR_VISITA',
        'LOG_EVENTOS': 'EVENTO'
    };

    const tbody = document.getElementById('table-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="padding:30px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    const res = await callBackend('get_history', { tipo_lista: typeMap[screenId] });
    let data = (res && res.data) ? res.data : [];

    if (screenId === 'LOG_PAQUETERIA') {
        const resE = await callBackend('get_history', { tipo_lista: 'PAQUETERIA_ENTREGA' });
        if(resE.data) data = [...data, ...resE.data].sort((a,b) => new Date(b.Fecha || b.Created) - new Date(a.Fecha || a.Created));
    }

    STATE.currentData = data;
    renderTable(screenId, data);
}

function renderTable(screenId, data) {
    const thead = document.getElementById('table-headers');
    const tbody = document.getElementById('table-body');
    if(!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="padding:30px; text-align:center;">Sin registros.</td></tr>';
        return;
    }

    let columns = [];
    if (screenId === 'LOG_RESIDENTES') {
        columns = [
            { header: 'Nombre', key: 'Nombre' },
            { header: 'Unidad', key: 'Unidad', format: (row) => `${row.Torre || ''} ${row.Departamento || row.Unidad || ''}` },
            { header: 'Teléfono', key: 'Telefono' },
            { header: 'Estatus', key: 'Activo', format: (row) => row.Activo ? '<span style="color:green">Activo</span>' : '<span style="color:red">Inactivo</span>' }
        ];
    } else if (screenId === 'LOG_VISITAS') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Visitante', key: 'Nombre' },
            { header: 'Residente', key: 'Residente' },
            { header: 'Destino', format: (row) => `${row.Torre || ''} ${row.Departamento || ''}` },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    } else {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre' },
            { header: 'Detalle', key: 'Residente' },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    }

    thead.innerHTML = columns.map(col => `<th style="padding:15px; border-bottom:1px solid #e2e8f0;">${col.header}</th>`).join('') + '<th style="padding:15px; border-bottom:1px solid #e2e8f0; text-align:center;">Acción</th>';

    tbody.innerHTML = data.map((row, index) => {
        const cells = columns.map(col => {
            let val = row[col.key] || '-';
            if (col.format) val = col.format(row);
            else if (col.type === 'date') val = formatearFecha(row[col.key] || row.Created);
            else if (col.type === 'status') val = getStatusBadge(row[col.key]);
            return `<td style="padding:15px; border-bottom:1px solid #f1f5f9;">${val}</td>`;
        }).join('');

        const actionBtn = (screenId === 'LOG_RESIDENTES') 
            ? `<button onclick="deleteUser('${row.ID || row.id}')" style="background:#fee2e2; color:#dc2626; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Baja</button>`
            : `<button onclick="showAdminDetails(${index})" style="background:#e0f2fe; color:#0284c7; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Ver</button>`;

        return `<tr>${cells}<td style="padding:15px; border-bottom:1px solid #f1f5f9; text-align:center;">${actionBtn}</td></tr>`;
    }).join('');
}

function getStatusBadge(status) {
    if (!status) return '-';
    const s = status.toString().toLowerCase();
    let color = '#3b82f6'; let bg = '#eff6ff';
    if (['aceptado', 'entrada', 'autorizado'].includes(s)) { color = '#16a34a'; bg = '#dcfce7'; }
    if (['rechazado', 'salida'].includes(s)) { color = '#dc2626'; bg = '#fee2e2'; }
    return `<span style="padding:4px 8px; border-radius:12px; font-size:0.75rem; background:${bg}; color:${color}; font-weight:600;">${status}</span>`;
}

/* =========================================
   5. ALTAS Y BAJAS (MODALS)
   ========================================= */

function showAddUserForm() {
    const modal = `
        <div id="admin-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;">
            <div style="background:white; width:90%; max-width:450px; border-radius:12px; padding:25px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                <h3 style="margin:0 0 20px; color:#1e293b;">Nuevo Residente</h3>
                <label style="display:block; font-size:0.85rem; font-weight:600;">Nombre Completo</label>
                <input type="text" id="new-name" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #cbd5e1; border-radius:6px;">
                
                <label style="display:block; font-size:0.85rem; font-weight:600;">Torre / Casa</label>
                <input type="text" id="new-torre" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #cbd5e1; border-radius:6px;">
                
                <label style="display:block; font-size:0.85rem; font-weight:600;">Departamento / Núm.</label>
                <input type="text" id="new-depto" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #cbd5e1; border-radius:6px;">
                
                <label style="display:block; font-size:0.85rem; font-weight:600;">WhatsApp</label>
                <input type="text" id="new-phone" placeholder="+52..." style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #cbd5e1; border-radius:6px;">
                
                <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:10px;">
                    <button onclick="document.getElementById('admin-modal').remove()" style="padding:10px 20px; background:#f1f5f9; border:none; border-radius:6px; cursor:pointer;">Cancelar</button>
                    <button onclick="saveNewUser()" id="btn-save" style="padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">GUARDAR</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

async function saveNewUser() {
    const data = {
        nombre: document.getElementById('new-name').value,
        torre: document.getElementById('new-torre').value,
        departamento: document.getElementById('new-depto').value,
        telefono: document.getElementById('new-phone').value,
        activo: true
    };

    if(!data.nombre || !data.departamento) return alert("Nombre y Depto son obligatorios");

    const btn = document.getElementById('btn-save');
    btn.innerText = "Guardando..."; btn.disabled = true;

    const res = await callBackend('add_user', { data });
    if(res.success) {
        alert("Residente registrado");
        document.getElementById('admin-modal').remove();
        loadTableData('LOG_RESIDENTES');
    } else {
        alert("Error: " + res.message);
        btn.innerText = "GUARDAR"; btn.disabled = false;
    }
}

async function deleteUser(id) {
    if(!confirm("¿Dar de baja a este residente?")) return;
    const res = await callBackend('delete_user', { data: { id } });
    if(res.success) {
        alert("Baja procesada correctamente");
        loadTableData('LOG_RESIDENTES');
    }
}

/* =========================================
   6. OTROS
   ========================================= */

function filterTable() {
    const term = document.getElementById('table-search').value.toLowerCase();
    document.querySelectorAll('#table-body tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
}

function reloadCurrentTable() {
    if(STATE.activeTab && STATE.activeTab.startsWith('LOG_')) loadTableData(STATE.activeTab);
}

function showAdminDetails(index) {
    const item = STATE.currentData[index];
    if(!item) return;
    let contentHtml = '';
    const ignore = ['odata.type', 'ID', 'Id', 'Foto', 'FotoBase64', 'FirmaBase64'];

    for (const [key, value] of Object.entries(item)) {
        if (!ignore.includes(key) && value) {
            contentHtml += `<div style="padding:8px 0; border-bottom:1px solid #eee;"><strong style="color:#64748b;">${key}:</strong> ${value}</div>`;
        }
    }

    const modal = `
        <div id="admin-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;">
            <div style="background:white; width:90%; max-width:500px; border-radius:12px; display:flex; flex-direction:column; max-height:85vh;">
                <div style="padding:15px 20px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                    <h3>Detalles</h3>
                    <button onclick="document.getElementById('admin-modal').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div style="padding:20px; overflow-y:auto;">${contentHtml}</div>
                <div style="padding:15px; border-top:1px solid #eee; text-align:right;">
                    <button onclick="document.getElementById('admin-modal').remove()" style="padding:8px 15px; background:#1e293b; color:white; border:none; border-radius:6px; cursor:pointer;">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

window.onload = checkSession;

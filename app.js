/* =========================================
   RAVENS ACCESS - ADMINISTRACIÓN (DASHBOARD)
   ========================================= */

/* =========================================
   1. CONFIGURACIÓN Y ESTADO GLOBAL
   ========================================= */
const CONFIG = {
    // URL de tu Proxy Admin (Azure Function)
    API_PROXY_URL: 'https://proxyadmin-cyh0etgyf5c9hch6.mexicocentral-01.azurewebsites.net/api/ravens-admin-proxy',
    
    // CLAVE MAESTRA PARA EL LOGIN
    LOGIN_ROUTING_KEY: 'AUTH_REQ' 
};

const STATE = {
    session: JSON.parse(localStorage.getItem('ravensAdmin')) || { 
        isLoggedIn: false, 
        condominioId: null, 
        usuario: null 
    },
    currentData: [],
    activeTab: 'DASHBOARD'
};

/* =========================================
   2. MOTOR DE UI (LAYOUT & SCREENS)
   ========================================= */

function formatearFecha(fechaRaw) {
    if (!fechaRaw) return "-";
    const dateObj = new Date(fechaRaw);
    if (isNaN(dateObj.getTime())) return fechaRaw; 
    
    return dateObj.toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

const LAYOUT = (content) => `
    <div class="admin-layout" style="display:flex; height:100vh; font-family: 'Inter', 'Segoe UI', sans-serif; background-color:#f3f4f6;">
        <aside style="width:260px; background-color:#1e293b; color:white; display:flex; flex-direction:column; flex-shrink:0; box-shadow: 2px 0 5px rgba(0,0,0,0.1);">
            <div style="padding:25px 20px; text-align:center; border-bottom:1px solid #334155;">
                <img src="icons/logo.png" onerror="this.style.display='none'" style="width:60px; margin-bottom:10px;">
                <h2 style="margin:0; font-size:1.1rem; font-weight:700; letter-spacing:0.5px;">RAVENS ADMIN</h2>
                <p style="margin:5px 0 0; font-size:0.75rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Panel de Control</p>
            </div>
            
            <nav style="flex:1; padding:20px 0; overflow-y:auto;">
                ${renderMenuItem('DASHBOARD', 'icons/incidencias.svg', 'Dashboard')} 
                
                <div style="padding:15px 25px 5px; font-size:0.7rem; color:#64748b; font-weight:bold; text-transform:uppercase;">Gestión</div>
                ${renderMenuItem('LOG_RESIDENTES', 'icons/residente.svg', 'Residentes')}
                
                <div style="padding:15px 25px 5px; font-size:0.7rem; color:#64748b; font-weight:bold; text-transform:uppercase;">Bitácoras</div>
                ${renderMenuItem('LOG_VISITAS', 'icons/visita.svg', 'Visitas')}
                ${renderMenuItem('LOG_PROVEEDORES', 'icons/servicio.svg', 'Proveedores')}
                ${renderMenuItem('LOG_PAQUETERIA', 'icons/incidencias.svg', 'Paquetería')}
                ${renderMenuItem('LOG_INTERNO', 'icons/residente.svg', 'Personal Interno')}
                
                <div style="padding:15px 25px 5px; font-size:0.7rem; color:#64748b; font-weight:bold; text-transform:uppercase;">Digital</div>
                ${renderMenuItem('LOG_PERSONAL', 'icons/servicio.svg', 'Personal Servicio')}
                ${renderMenuItem('LOG_QR_RES', 'icons/qr.svg', 'QR Residentes')}
                ${renderMenuItem('LOG_QR_VIS', 'icons/qr.svg', 'QR Visitas')}
                ${renderMenuItem('LOG_EVENTOS', 'icons/evento.svg', 'Eventos')}
                ${renderMenuItem('LOG_NIP_PROV', 'icons/qr.svg', 'Accesos NIP (Prov)')}
            </nav>

            <div style="padding:20px; border-top:1px solid #334155;">
                <button onclick="doLogout()" style="width:100%; background:rgba(239, 68, 68, 0.1); border:1px solid #ef4444; color:#ef4444; padding:12px; border-radius:8px; cursor:pointer; font-weight:600; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.2s;">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
            </div>
        </aside>

        <main style="flex:1; overflow-y:auto; position:relative; display:flex; flex-direction:column;">
            <header style="background:white; padding:15px 30px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100;">
                <div>
                    <h2 id="page-title" style="margin:0; font-size:1.4rem; color:#0f172a;">Dashboard</h2>
                    <p style="margin:0; font-size:0.85rem; color:#64748b;">Bienvenido de nuevo</p>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="text-align:right;">
                        <div style="font-weight:700; font-size:0.9rem; color:#1e293b;">Admin</div>
                        <div style="font-size:0.75rem; color:#3b82f6; font-weight:600; background:#eff6ff; padding:2px 8px; border-radius:10px; display:inline-block;">
                            ${STATE.session.condominioId || 'Sin Conexión'}
                        </div>
                    </div>
                    <div style="width:42px; height:42px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#64748b; border:2px solid #e2e8f0;">
                        <img src="icons/logo.png" style="width:25px; opacity:0.7;">
                    </div>
                </div>
            </header>

            <div id="admin-content" style="padding:30px; flex:1;">
                ${content}
            </div>
        </main>
    </div>
`;

function renderMenuItem(id, iconPath, label) {
    const isActive = STATE.activeTab === id;
    
    // Estilos
    const containerStyle = isActive 
        ? 'background:rgba(255, 255, 255, 0.05); color:white; border-right:3px solid #38bdf8;' 
        : 'color:#94a3b8; border-right:3px solid transparent;';
    
    const activeFilter = 'invert(66%) sepia(61%) saturate(1448%) hue-rotate(174deg) brightness(103%) contrast(96%)'; 
    const inactiveFilter = 'invert(69%) sepia(11%) saturate(468%) hue-rotate(178deg) brightness(91%) contrast(87%)'; 
    const iconFilter = isActive ? activeFilter : inactiveFilter;

    return `
        <div onclick="navigate('${id}')" style="padding:12px 25px; cursor:pointer; display:flex; align-items:center; gap:12px; font-size:0.9rem; transition:all 0.2s; ${containerStyle}" onmouseover="this.style.color='white'" onmouseout="if('${!isActive}') this.style.color='#94a3b8'">
            <img src="${iconPath}" style="width:20px; height:20px; object-fit:contain; filter: ${iconFilter}; transition:filter 0.2s;">
            <span style="${isActive ? 'font-weight:600;' : ''}">${label}</span>
        </div>
    `;
}

const SCREENS = {
    // === LOGIN ===
    'LOGIN': `
        <div style="height:100vh; display:flex; justify-content:center; align-items:center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
            <div style="background:white; padding:40px; border-radius:16px; width:100%; max-width:400px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
                <div style="text-align:center; margin-bottom:30px;">
                    <img src="icons/logo.png" onerror="this.style.display='none'" style="width:80px; margin-bottom:15px;">
                    <h1 style="color:#1e293b; font-size:1.5rem; font-weight:700; margin:0;">Ravens Access</h1>
                    <p style="color:#64748b; margin-top:5px; font-size:0.9rem;">Panel Administrativo</p>
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:block; color:#475569; font-size:0.85rem; font-weight:600; margin-bottom:8px;">Usuario</label>
                    <input type="text" id="login-user" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; outline:none; font-size:0.95rem; box-sizing:border-box;" placeholder="admin">
                </div>
                <div style="margin-bottom:30px;">
                    <label style="display:block; color:#475569; font-size:0.85rem; font-weight:600; margin-bottom:8px;">Contraseña</label>
                    <input type="password" id="login-pass" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; outline:none; font-size:0.95rem; box-sizing:border-box;" placeholder="••••••">
                </div>
                <button onclick="doLogin()" id="btn-login" style="width:100%; padding:12px; background:#2563eb; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; font-size:1rem; transition:background 0.2s;">INICIAR SESIÓN</button>
                <p id="login-error" style="color:#ef4444; text-align:center; margin-top:15px; font-size:0.85rem; display:none; background:#fee2e2; padding:10px; border-radius:6px;"></p>
            </div>
        </div>
    `,
    
    // === DASHBOARD ===
    'DASHBOARD': `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:20px; margin-bottom:30px;">
            ${renderCard('Accesos Hoy', '<span id="stat-access"><i class="fas fa-spinner fa-spin"></i></span>', 'icons/visita.svg', '#3b82f6', "navigate('LOG_VISITAS')")}
            ${renderCard('Paquetes', '<span id="stat-packages"><i class="fas fa-spinner fa-spin"></i></span>', 'icons/incidencias.svg', '#f59e0b', "navigate('LOG_PAQUETERIA')")}
            ${renderCard('Residentes', '<span id="stat-residents">--</span>', 'icons/residente.svg', '#10b981', "navigate('LOG_RESIDENTES')")}
            ${renderCard('Eventos', '0', 'icons/evento.svg', '#ef4444', "navigate('LOG_EVENTOS')")}
        </div>

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:25px; align-items:start;">
            <div style="background:white; padding:25px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); border:1px solid #f1f5f9;">
                <h3 style="margin:0 0 20px; color:#1e293b; font-size:1.1rem;">Flujo de Accesos (Semanal)</h3>
                <div style="height:300px; width:100%;">
                    <canvas id="mainChart"></canvas>
                </div>
            </div>

            <div style="background:white; padding:25px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); border:1px solid #f1f5f9; height:340px; overflow:hidden; display:flex; flex-direction:column;">
                <h3 style="margin:0 0 15px; color:#1e293b; font-size:1.1rem;">Actividad Reciente</h3>
                <div id="recent-activity-list" style="flex:1; overflow-y:auto; padding-right:5px;">
                    <p style="color:#64748b; font-size:0.9rem; text-align:center; margin-top:20px;">Cargando...</p>
                </div>
                <button onclick="navigate('LOG_VISITAS')" style="margin-top:15px; width:100%; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; color:#475569; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600;">Ver Todo</button>
            </div>
        </div>
    `,
    
    // === TABLAS ===
    'TABLE_VIEW': `
        <div style="background:white; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); border:1px solid #f1f5f9; overflow:hidden;">
            <div style="padding:20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; gap:15px; flex-wrap:wrap;">
                <div style="display:flex; gap:10px; flex:1; min-width:300px;">
                    <div style="position:relative; flex:1;">
                        <input type="text" id="table-search" placeholder="Buscar en registros..." onkeyup="filterTable()" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px; outline:none; box-sizing:border-box;">
                    </div>
                    <button id="btn-add-entity" style="display:none; padding:10px 20px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; align-items:center; gap:5px;" onclick="showAddUserForm()">
                        + Nuevo
                    </button>
                </div>
                <button onclick="reloadCurrentTable()" style="padding:10px 15px; background:white; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer; color:#475569; font-weight:600; transition:all 0.2s;">
                    Actualizar
                </button>
            </div>
            <div class="table-container" style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:0.9rem; min-width:800px;">
                    <thead style="background:#f8fafc; color:#64748b; text-align:left; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.5px;">
                        <tr id="table-headers"></tr>
                    </thead>
                    <tbody id="table-body">
                        <tr><td colspan="10" style="padding:40px; text-align:center; color:#94a3b8;">Cargando datos...</td></tr>
                    </tbody>
                </table>
            </div>
            <div style="padding:15px 20px; border-top:1px solid #f1f5f9; color:#94a3b8; font-size:0.8rem; text-align:right;">
                Mostrando últimos 50 registros
            </div>
        </div>
    `
};

function renderCard(title, valueHtml, iconPath, color, action) {
    return `
        <div onclick="${action}" style="background:white; padding:20px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); border:1px solid #f1f5f9; cursor:pointer; transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <p style="margin:0 0 5px; color:#64748b; font-size:0.85rem; font-weight:600;">${title}</p>
                    <h3 style="margin:0; color:#1e293b; font-size:1.8rem; font-weight:700;">${valueHtml}</h3>
                </div>
                <div style="width:45px; height:45px; border-radius:10px; background:${color}15; display:flex; align-items:center; justify-content:center;">
                    <img src="${iconPath}" style="width:24px; height:24px; object-fit:contain;">
                </div>
            </div>
        </div>
    `;
}

/* =========================================
   3. LÓGICA Y CONEXIÓN (BACKEND)
   ========================================= */

async function callBackend(action, extraData = {}) {
    if (!STATE.session.condominioId && !extraData.condominio && action !== 'login') {
        doLogout();
        return { success: false, message: "Sesión expirada" };
    }

    try {
        const payload = { 
            action, 
            condominio: extraData.condominio || STATE.session.condominioId, 
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
        return { success: false, message: "Error de conexión con el servidor" };
    }
}

// FUNCIÓN DE LOGIN
async function doLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    const errorMsg = document.getElementById('login-error');
    const btn = document.getElementById('btn-login');

    if(!user || !pass) return;
    
    errorMsg.style.display = 'none';
    btn.innerText = "Verificando..."; btn.disabled = true; btn.style.opacity = "0.7";

    const res = await callBackend('login', { 
        username: user, 
        password: pass,
        condominio: CONFIG.LOGIN_ROUTING_KEY 
    });

    if (res && res.success) {
        const condId = res.condominioId || res.condominio || "DESCONOCIDO";
        STATE.session = { isLoggedIn: true, condominioId: condId, usuario: user };
        localStorage.setItem('ravensAdmin', JSON.stringify(STATE.session));
        navigate('DASHBOARD');
    } else {
        errorMsg.innerText = res.message || "Usuario o contraseña incorrectos";
        errorMsg.style.display = 'block';
        btn.disabled = false; btn.innerText = "INICIAR SESIÓN"; btn.style.opacity = "1";
    }
}

// CHEQUEO DE SESIÓN AL INICIAR
function checkSession() { 
    const saved = localStorage.getItem('ravensAdmin'); 
    if (saved) { 
        try {
            STATE.session = JSON.parse(saved); 
            if(STATE.session.isLoggedIn && STATE.session.condominioId) {
                navigate('DASHBOARD'); 
                return;
            }
        } catch(e) { console.error("Error parsing session", e); }
    } 
    document.getElementById('viewport').innerHTML = SCREENS['LOGIN']; 
}

function doLogout() { 
    localStorage.removeItem('ravensAdmin'); 
    STATE.session = { isLoggedIn: false, condominioId: null, usuario: null }; 
    document.getElementById('viewport').innerHTML = SCREENS['LOGIN']; 
}

function navigate(screenId) {
    STATE.activeTab = screenId;
    if(screenId === 'LOGIN') { document.getElementById('viewport').innerHTML = SCREENS['LOGIN']; return; }

    const innerContent = (screenId === 'DASHBOARD') ? SCREENS['DASHBOARD'] : SCREENS['TABLE_VIEW'];
    document.getElementById('viewport').innerHTML = LAYOUT(innerContent);
    
    const titleEl = document.getElementById('page-title');
    if(titleEl) titleEl.innerText = getTitleForScreen(screenId);

    const btnAdd = document.getElementById('btn-add-entity');
    if(btnAdd) btnAdd.style.display = (screenId === 'LOG_RESIDENTES') ? 'flex' : 'none';

    if (screenId === 'DASHBOARD') {
        loadDashboardStats(); 
    } else {
        setTimeout(() => loadTableData(screenId), 100);
    }
}

function getTitleForScreen(id) {
    const map = {
        'LOG_RESIDENTES': 'Directorio de Residentes',
        'LOG_VISITAS': 'Historial de Visitas',
        'LOG_PROVEEDORES': 'Bitácora de Proveedores',
        'LOG_NIP_PROV': 'Bitácora de Accesos NIP',
        'LOG_PAQUETERIA': 'Gestión de Paquetería',
        'LOG_PERSONAL': 'Personal de Servicio',
        'LOG_INTERNO': 'Personal Interno',
        'LOG_QR_RES': 'Accesos QR (Residentes)',
        'LOG_QR_VIS': 'Accesos QR (Visitas)',
        'LOG_EVENTOS': 'Eventos y Amenidades'
    };
    return map[id] || 'Dashboard';
}

/* =========================================
   4. DASHBOARD & GRÁFICAS
   ========================================= */

async function loadDashboardStats() {
    // Para el dashboard usamos solo recepción para contar paquetes
    const [resVisitas, resPaquetes] = await Promise.all([
        callBackend('get_history', { tipo_lista: 'VISITA' }),
        callBackend('get_history', { tipo_lista: 'PAQUETERIA_RECEPCION' })
    ]);

    const visitas = resVisitas.data || [];
    const paquetes = resPaquetes.data || [];

    const hoy = new Date().toISOString().split('T')[0];
    const visitasHoy = visitas.filter(v => (v.Fecha || v.Created || v.Fechayhora || '').startsWith(hoy)).length;
    const paquetesPendientes = paquetes.filter(p => !p.Estatus || p.Estatus.toLowerCase().includes('recibido')).length;

    document.getElementById('stat-access').innerText = visitasHoy;
    document.getElementById('stat-packages').innerText = paquetesPendientes;
    document.getElementById('stat-residents').innerText = "--"; 

    renderRecentActivity(visitas.slice(0, 5));
    renderChart(visitas);
}

function renderRecentActivity(items) {
    const container = document.getElementById('recent-activity-list');
    if (!items.length) {
        container.innerHTML = '<p style="text-align:center; color:#94a3b8; margin-top:20px;">Sin actividad reciente.</p>';
        return;
    }
    
    const html = items.map(item => `
        <div style="display:flex; gap:15px; padding:12px 0; border-bottom:1px solid #f1f5f9; align-items:center;">
            <div style="width:35px; height:35px; background:#eff6ff; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <img src="icons/visita.svg" style="width:18px;">
            </div>
            <div style="flex:1;">
                <div style="font-weight:600; color:#334155; font-size:0.9rem;">${item.Nombre || 'Desconocido'}</div>
                <div style="font-size:0.8rem; color:#94a3b8;">${item.Torre || ''} ${item.Departamento || ''} - ${item.Residente || ''}</div>
            </div>
            <div style="font-size:0.8rem; color:#64748b; font-weight:500;">
                ${formatearFecha(item.Fecha || item.Fechayhora).split(',')[1] || ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function renderChart(data) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    data.forEach(item => {
        const d = new Date(item.Fecha || item.Fechayhora || item.Created);
        if (!isNaN(d)) {
            counts[d.getDay()]++;
        }
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Accesos',
                data: counts,
                backgroundColor: '#3b82f6',
                borderRadius: 4,
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

/* =========================================
   5. TABLAS Y DATOS (CRUD)
   ========================================= */

async function loadTableData(screenId) {
    // Si es PAQUETERIA, necesitamos unir dos fuentes de datos
    if (screenId === 'LOG_PAQUETERIA') {
        const tbody = document.getElementById('table-body');
        if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="padding:40px; text-align:center; color:#64748b;"><i class="fas fa-spinner fa-spin"></i> Cargando paquetería...</td></tr>';

        // Hacemos las dos llamadas en paralelo
        const [resRec, resEnt] = await Promise.all([
            callBackend('get_history', { tipo_lista: 'PAQUETERIA_RECEPCION' }),
            callBackend('get_history', { tipo_lista: 'PAQUETERIA_ENTREGA' })
        ]);

        let listRec = (resRec && resRec.data) ? resRec.data : [];
        let listEnt = (resEnt && resEnt.data) ? resEnt.data : [];

        // Normalizamos los datos para que tengan una estructura común antes de unirlos
        listRec = listRec.map(item => ({ ...item, _origen: 'RECEPCION' }));
        listEnt = listEnt.map(item => ({ ...item, _origen: 'ENTREGA' }));

        let merged = [...listRec, ...listEnt];
        
        // Ordenar por fecha descendente
        merged.sort((a, b) => {
            const dateA = new Date(a.Fecha || 0);
            const dateB = new Date(b.Fecha || 0);
            return dateB - dateA;
        });

        STATE.currentData = merged;
        renderTable(screenId, merged);
        return;
    }

    // Lógica normal para las demás listas
    const typeMap = {
        'LOG_RESIDENTES': 'RESIDENTE',
        'LOG_VISITAS': 'VISITA',
        'LOG_PROVEEDORES': 'PROVEEDOR',
        'LOG_NIP_PROV': 'NIP_PROVEEDOR',
        'LOG_PERSONAL': 'PERSONAL_DE_SERVICIO',
        'LOG_INTERNO': 'PERSONAL_INTERNO',
        'LOG_QR_RES': 'QR_RESIDENTE',
        'LOG_QR_VIS': 'QR_VISITA',
        'LOG_EVENTOS': 'EVENTO'
    };

    const tbody = document.getElementById('table-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="10" style="padding:40px; text-align:center; color:#64748b;"><i class="fas fa-spinner fa-spin"></i> Cargando registros...</td></tr>';

    const res = await callBackend('get_history', { tipo_lista: typeMap[screenId] });
    let data = (res && res.data) ? res.data : [];

    // === FILTRADO ===
    // Solo para NIP, QR Visita y Eventos
    const tabsToFilter = ['LOG_NIP_PROV', 'LOG_QR_VIS', 'LOG_EVENTOS'];
    
    if (tabsToFilter.includes(screenId) && data.length > 0) {
        data = data.filter(item => {
            const status = (item.Estatus || item.Estado || '').trim().toLowerCase();
            if (!status || status === 'nuevo') return false;
            return true;
        });
    }

    STATE.currentData = data;
    renderTable(screenId, data);
}

function renderTable(screenId, data) {
    const thead = document.getElementById('table-headers');
    const tbody = document.getElementById('table-body');
    
    if(!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="padding:40px; text-align:center; color:#94a3b8;">No se encontraron registros.</td></tr>';
        return;
    }

    let columns = [];
    
    if (screenId === 'LOG_RESIDENTES') {
        columns = [
            { header: 'Nombre', key: 'Nombre', bold: true },
            { header: 'Torre', key: 'Torre' },
            { header: 'Departamento', key: 'Departamento' },
            { header: 'Teléfono', key: 'Telefono' }
        ];
    } else if (screenId === 'LOG_VISITAS') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Visitante', key: 'Nombre', bold: true },
            { header: 'Residente', key: 'Residente' },
            { header: 'Torre', key: 'Torre' },
            { header: 'Departamento', key: 'Departamento' },
            { header: 'Motivo', key: 'Motivo' },
            { header: 'Placa', key: 'Placa' },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    } else if (screenId === 'LOG_PROVEEDORES') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Empresa', key: 'Empresa', bold: true },
            { header: 'Personal', key: 'Nombre' },
            { header: 'Asunto', key: 'Asunto' },
            { header: 'Torre', key: 'Torre' },
            { header: 'Departamento', key: 'Departamento' },
            { header: 'Residente', key: 'Residente' },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    } else if (screenId === 'LOG_NIP_PROV') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre', bold: true },
            { header: 'Empresa', key: 'Empresa' },
            { header: 'Asunto', key: 'Asunto' },
            { header: 'Residente', key: 'Residente' },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    } else if (screenId === 'LOG_PAQUETERIA') {
        // Lógica especial para unir las columnas de las dos fuentes
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { 
                header: 'Tipo Movimiento', 
                format: (row) => row._origen === 'RECEPCION' 
                    ? '<span style="color:#2563eb; font-weight:600;">Recepción Caseta</span>' 
                    : '<span style="color:#16a34a; font-weight:600;">Entrega a Residente</span>'
            },
            { 
                header: 'Detalle (Paquetería/Recibió)', 
                format: (row) => row._origen === 'RECEPCION' ? row.Paqueteria : row.Recibio,
                bold: true
            },
            { header: 'Residente', key: 'Residente' },
            { header: 'Torre', key: 'Torre' },
            { header: 'Depto', key: 'Departamento' },
            { header: 'Foto/Firma', type: 'image' } // Nueva columna de imagen
        ];
    } else if (screenId === 'LOG_PERSONAL') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre', bold: true },
            { header: 'Cargo', key: 'Cargo' },
            { header: 'Responsable', key: 'Residente' },
            { header: 'Torre', key: 'Torre' },
            { header: 'Departamento', key: 'Departamento' },
            { header: 'Estatus', key: 'Estatus', type: 'status' },
            { header: 'Foto', type: 'image' }
        ];
    } else if (screenId === 'LOG_INTERNO') {
         columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre', bold: true },
            { header: 'Cargo', key: 'Cargo' },
            { header: 'Tipo Marca', key: 'TipoMarca' },
            { header: 'Residente', key: 'Residente' },
            { header: 'Torre', key: 'Torre' },
            { header: 'Departamento', key: 'Departamento' }
        ];
    } else if (screenId === 'LOG_EVENTOS') {
        columns = [
            { header: 'Fecha Evento', key: 'Fecha', type: 'date' },
            { header: 'Nombre Evento', key: 'Nombre', bold: true },
            { header: 'Anfitrión', key: 'Residente' },
            { header: 'Torre', key: 'Torre' },
            { header: 'Departamento', key: 'Departamento' },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    } else if (screenId === 'LOG_QR_VIS') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre', bold: true },
            { header: 'Residente', key: 'Residente' },
            { header: 'Torre', key: 'Torre' },
            { header: 'Departamento', key: 'Departamento' },
            { header: 'Motivo', key: 'Motivo' },
            { header: 'Estatus', key: 'Estatus', type: 'status' }
        ];
    } else if (screenId === 'LOG_QR_RES') {
        columns = [
            { header: 'Fecha', key: 'Fecha', type: 'date' },
            { header: 'Nombre', key: 'Nombre', bold: true },
            { header: 'Residente', key: 'Residente' },
            { header: 'Torre', key: 'Torre' },
            { header: 'Departamento', key: 'Departamento' }
        ];
    } else {
        columns = [ { header: 'Nombre', key: 'Nombre', bold: true } ];
    }

    thead.innerHTML = columns.map(col => `<th style="padding:15px;">${col.header}</th>`).join('') + '<th style="padding:15px; text-align:center;">Acciones</th>';

    tbody.innerHTML = data.map((row, index) => {
        const cells = columns.map(col => {
            let val = '-';
            
            // Prioridad: 1. Format custom, 2. Key map
            if (col.format) {
                val = col.format(row);
            } else if (col.type === 'image') {
                // Lógica para detectar foto
                const imgData = row.FotoBase64 || row.FirmaBase64 || row.Foto;
                if(imgData) {
                    val = `<div style="width:30px; height:30px; background:#f1f5f9; border-radius:4px; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="showDetails(${index})"><i class="fas fa-image" style="color:#64748b;"></i></div>`;
                } else {
                    val = '<span style="color:#cbd5e1; font-size:0.7rem;">Sin foto</span>';
                }
            } else if (row[col.key]) {
                val = row[col.key];
            }

            if (val === undefined || val === null) val = '-';

            if (col.type === 'date') val = `<span style="color:#64748b; font-size:0.85rem;">${formatearFecha(val)}</span>`;
            if (col.type === 'status') val = getStatusBadge(val);
            if (col.type === 'bool') val = row.Activo ? '<span style="color:#16a34a; background:#dcfce7; padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:600;">Activo</span>' : '<span style="color:#94a3b8; background:#f1f5f9; padding:2px 8px; border-radius:10px; font-size:0.75rem;">Inactivo</span>';
            if (col.bold && !col.format) val = `<span style="font-weight:600; color:#334155;">${val}</span>`;

            return `<td style="padding:15px; border-bottom:1px solid #f8fafc;">${val}</td>`;
        }).join('');

        const btnStyle = "border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600; transition:background 0.2s;";
        const actions = (screenId === 'LOG_RESIDENTES')
            ? `<button onclick="deleteUser('${row.ID || row.id}')" style="${btnStyle} background:#fee2e2; color:#dc2626;">Baja</button>`
            : `<button onclick="showDetails(${index})" style="${btnStyle} background:#f1f5f9; color:#475569;">Ver</button>`;

        return `<tr style="transition:background 0.1s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">${cells}<td style="padding:15px; border-bottom:1px solid #f8fafc; text-align:center;">${actions}</td></tr>`;
    }).join('');
}

function getStatusBadge(status) {
    if (!status || status === '-') return '-';
    const s = status.toString().toLowerCase();
    let color = '#3b82f6'; let bg = '#eff6ff'; 
    if (s.includes('entrada') || s.includes('aceptado') || s.includes('autorizado') || s.includes('entregado')) { color = '#16a34a'; bg = '#dcfce7'; }
    if (s.includes('salida') || s.includes('rechazado') || s.includes('denegado')) { color = '#dc2626'; bg = '#fee2e2'; }
    if (s.includes('pendiente') || s.includes('recibido') || s.includes('nuevo')) { color = '#d97706'; bg = '#fef3c7'; }
    return `<span style="color:${color}; background:${bg}; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:600; text-transform:capitalize;">${status}</span>`;
}

/* =========================================
   6. MODALES Y FORMULARIOS
   ========================================= */

function showAddUserForm() {
    const modalHtml = `
        <div id="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.6); display:flex; justify-content:center; align-items:center; z-index:9999; backdrop-filter:blur(2px);">
            <div style="background:white; width:90%; max-width:450px; border-radius:12px; padding:30px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); animation: slideIn 0.2s ease-out;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="margin:0; color:#1e293b;">Nuevo Residente</h3>
                    <button onclick="closeModal()" style="background:none; border:none; font-size:1.2rem; color:#94a3b8; cursor:pointer;">&times;</button>
                </div>
                <div style="display:grid; gap:15px;">
                    <div>
                        <label style="display:block; font-size:0.85rem; font-weight:600; color:#475569; margin-bottom:5px;">Nombre Completo</label>
                        <input type="text" id="new-name" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; outline:none; box-sizing:border-box;">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label style="display:block; font-size:0.85rem; font-weight:600; color:#475569; margin-bottom:5px;">Torre</label>
                            <input type="text" id="new-torre" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; outline:none; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.85rem; font-weight:600; color:#475569; margin-bottom:5px;">Depto</label>
                            <input type="text" id="new-depto" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; outline:none; box-sizing:border-box;">
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.85rem; font-weight:600; color:#475569; margin-bottom:5px;">Teléfono</label>
                        <input type="text" id="new-phone" placeholder="+52..." style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; outline:none; box-sizing:border-box;">
                    </div>
                </div>
                <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:25px;">
                    <button onclick="closeModal()" style="padding:10px 20px; background:white; border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; color:#64748b; font-weight:600;">Cancelar</button>
                    <button onclick="saveNewUser()" id="btn-save" style="padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Guardar Residente</button>
                </div>
            </div>
        </div>
        <style>@keyframes slideIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }</style>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function showDetails(index) {
    const item = STATE.currentData[index];
    if(!item) return;
    
    let listHtml = '';
    // Ignoramos claves técnicas o imágenes para que no salgan como texto
    const ignore = ['odata.type', 'ID', 'Id', 'ItemInternalId', 'Foto', 'FotoBase64', 'FirmaBase64', '_origen'];

    for (const [key, value] of Object.entries(item)) {
        if (!ignore.includes(key) && value) {
            
            let displayValue = value;
            if (key.includes('Fecha') || key.includes('Date') || key === 'Created' || key === 'Fechayhora') {
                displayValue = formatearFecha(value);
            }

            listHtml += `
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f1f5f9;">
                    <span style="color:#64748b; font-size:0.9rem;">${key}</span>
                    <span style="color:#1e293b; font-weight:500; font-size:0.9rem; text-align:right; max-width:60%; word-break: break-word;">${displayValue}</span>
                </div>`;
        }
    }

    // Lógica robusta para mostrar imágenes (Prioridad Base64, luego URL)
    let imagesHtml = '';
    
    // Foto Base64
    if(item.FotoBase64) {
        imagesHtml += `
            <div style="margin-top:15px; text-align:center;">
                 <span style="display:block; color:#64748b; font-size:0.9rem; margin-bottom:5px;">Evidencia (Foto)</span>
                 <img src="data:image/png;base64,${item.FotoBase64}" style="max-width:100%; border-radius:8px; border:1px solid #e2e8f0;">
            </div>`;
    } 
    // Firma Base64
    if (item.FirmaBase64) {
        imagesHtml += `
            <div style="margin-top:15px; text-align:center;">
                 <span style="display:block; color:#64748b; font-size:0.9rem; margin-bottom:5px;">Firma</span>
                 <img src="data:image/png;base64,${item.FirmaBase64}" style="max-width:100%; border-radius:8px; border:1px solid #e2e8f0;">
            </div>`;
    }
    // Foto URL (como fallback o si viene directo de SP sin base64)
    if (item.Foto && !item.FotoBase64) {
         imagesHtml += `
            <div style="margin-top:15px; text-align:center;">
                 <span style="display:block; color:#64748b; font-size:0.9rem; margin-bottom:5px;">Evidencia (URL)</span>
                 <img src="${item.Foto}" alt="Imagen no disponible" style="max-width:100%; border-radius:8px; border:1px solid #e2e8f0;" onerror="this.style.display='none'">
                 <p style="font-size:0.7rem; color:#94a3b8;">Si no ve la imagen, puede requerir inicio de sesión en SharePoint.</p>
            </div>`;
    }

    const modalHtml = `
        <div id="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.6); display:flex; justify-content:center; align-items:center; z-index:9999; backdrop-filter:blur(2px);">
            <div style="background:white; width:90%; max-width:500px; border-radius:12px; display:flex; flex-direction:column; max-height:85vh; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
                <div style="padding:20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#1e293b;">Detalles del Registro</h3>
                    <button onclick="closeModal()" style="background:none; border:none; font-size:1.5rem; color:#94a3b8; cursor:pointer;">&times;</button>
                </div>
                <div style="padding:20px; overflow-y:auto;">
                    ${listHtml}
                    ${imagesHtml}
                </div>
                <div style="padding:20px; border-top:1px solid #f1f5f9; text-align:right;">
                    <button onclick="closeModal()" style="padding:10px 20px; background:#1e293b; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeModal() {
    const el = document.getElementById('modal-overlay');
    if(el) el.remove();
}

async function saveNewUser() {
    const data = {
        nombre: document.getElementById('new-name').value,
        torre: document.getElementById('new-torre').value,
        departamento: document.getElementById('new-depto').value,
        telefono: document.getElementById('new-phone').value,
        activo: true
    };

    if(!data.nombre || !data.departamento) return alert("Nombre y Departamento son obligatorios");

    const btn = document.getElementById('btn-save');
    btn.innerText = "Guardando..."; btn.disabled = true;

    const res = await callBackend('add_user', { data });
    
    if(res.success) {
        closeModal();
        loadTableData('LOG_RESIDENTES');
    } else {
        alert("Error: " + res.message);
        btn.innerText = "Guardar Residente"; btn.disabled = false;
    }
}

async function deleteUser(id) {
    if(!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) return;
    const res = await callBackend('delete_user', { data: { id } });
    if(res.success) {
        loadTableData('LOG_RESIDENTES');
    } else {
        alert("No se pudo eliminar: " + res.message);
    }
}

/* =========================================
   7. UTILIDADES
   ========================================= */

function filterTable() {
    const term = document.getElementById('table-search').value.toLowerCase();
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

function reloadCurrentTable() {
    if(STATE.activeTab.startsWith('LOG_')) loadTableData(STATE.activeTab);
    if(STATE.activeTab === 'DASHBOARD') loadDashboardStats();
}

// INICIO - PUNTO DE ENTRADA
window.onload = checkSession;


        // ===== STATE =====
    const STAFF_PIN = '0114';
    const menu = {
        'latte': {name: 'Iced Latte', price: 3.50 },
    'hot-choc': {name: 'Hot Chocolate', price: 3.00 },
    'tea': {name: 'Chai Tea', price: 2.75 },
    'croissant': {name: 'Butter Croissant', price: 2.50 },
    'muffin': {name: 'Blueberry Muffin', price: 2.25 },
    'sandwich': {name: 'Turkey Sandwich', price: 4.75 },
        };

    let qtys = {latte: 0, 'hot-choc': 0, tea: 0, croissant: 0, muffin: 0, sandwich: 0 };
    let staffUnlocked = false;
    let currentOrderStatus = null;

    // ===== LOCALSTORAGE =====
    function saveOrders() {
        localStorage.setItem('decadash_orders', JSON.stringify(orders));
    localStorage.setItem('decadash_counter', orderCounter);
        }

    function loadOrders() {
            try {
                const saved = localStorage.getItem('decadash_orders');
    const counter = localStorage.getItem('decadash_counter');
    orders = saved ? JSON.parse(saved) : [];
    orderCounter = counter ? parseInt(counter) : 1;
            } catch (e) {
        orders = [];
    orderCounter = 1;
            }
        }

    // Load saved orders immediately on page start
    loadOrders();

        // ===== AUTO-LOCK: lock staff on tab hide, page close, or reload =====
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) lockDashboard();
        });
        window.addEventListener('beforeunload', () => lockDashboard());

    // ===== NAV =====
    function showScreen(screen) {
        document.getElementById('teacher-screen').style.display = screen === 'teacher' ? 'block' : 'none';
    document.getElementById('staff-screen').style.display = screen === 'staff' ? 'block' : 'none';
            document.querySelectorAll('.nav-tab').forEach((t, i) => t.classList.toggle('active', (screen === 'teacher' && i === 0) || (screen === 'staff' && i === 1)));
    document.getElementById('logout-btn').classList.toggle('visible', screen === 'staff' && staffUnlocked);
    if (screen === 'staff') renderOrders();
        }

    // ===== MENU LOGIC =====
    function toggleItem(id) {
            if (qtys[id] === 0) changeQty(id, 1);
        }

    function changeQty(id, delta) {
        qtys[id] = Math.max(0, qtys[id] + delta);
    document.getElementById('qty-' + id).textContent = qtys[id];
            document.getElementById('item-' + id).classList.toggle('selected', qtys[id] > 0);
    updateSummary();
        }

    function updateSummary() {
            const items = Object.entries(qtys).filter(([k, v]) => v > 0);
            const subtotal = items.reduce((sum, [k, v]) => sum + menu[k].price * v, 0);

    const total = subtotal;

    document.getElementById('subtotal').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('total').textContent = '$' + total.toFixed(2);

    const cartDiv = document.getElementById('cart-items');
    if (items.length === 0) {
        cartDiv.innerHTML = '<div class="empty-cart"><div class="icon">🛒</div>Select items from the menu</div>';
            } else {
        cartDiv.innerHTML = items.map(([k, v]) => `
        <div class="summary-line">
          <span>${menu[k].name} × ${v}</span>
          <span>$${(menu[k].price * v).toFixed(2)}</span>
        </div>`).join('');
            }

            const hasItems = items.length > 0;
    const hasName = document.getElementById('teacher-name').value.trim() !== '';
    const hasRoom = document.getElementById('room-number').value.trim() !== '';
    document.getElementById('submit-btn').disabled = !(hasItems && hasName && hasRoom);
        }

    document.getElementById('teacher-name').addEventListener('input', updateSummary);
    document.getElementById('room-number').addEventListener('input', updateSummary);

    // ===== SUBMIT ORDER =====
    function submitOrder() {
            const name = document.getElementById('teacher-name').value.trim();
    const room = document.getElementById('room-number').value.trim();
    const notes = document.getElementById('special-notes').value.trim();
            const items = Object.entries(qtys).filter(([k, v]) => v > 0).map(([k, v]) => ({...menu[k], qty: v, id: k }));
            const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const total = subtotal * 1.08;

    const order = {
        id: 'DD-' + String(orderCounter++).padStart(3, '0'),
    name, room, notes, items, total,
    status: 'received',
    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit' })
            };

    orders.unshift(order);
    currentOrderStatus = order.id;
    saveOrders();

    // Show status tracker
    document.getElementById('display-order-id').textContent = '#' + order.id;
    showStatus('received');
    document.getElementById('status-tracker').classList.add('visible');
    document.getElementById('status-tracker').scrollIntoView({behavior: 'smooth', block: 'start' });

            // Reset form
            Object.keys(qtys).forEach(k => {qtys[k] = 0; document.getElementById('qty-' + k).textContent = 0; document.getElementById('item-' + k).classList.remove('selected'); });
    document.getElementById('teacher-name').value = '';
    document.getElementById('room-number').value = '';
    document.getElementById('special-notes').value = '';
    updateSummary();

    renderOrders();
        }

    // ===== STATUS TRACKER =====
    function showStatus(status) {
            const s1 = document.getElementById('step1');
    const s2 = document.getElementById('step2');
    const s3 = document.getElementById('step3');
    const c1 = document.getElementById('conn1');
    const c2 = document.getElementById('conn2');
    const msg = document.getElementById('status-msg');
    const txt = document.getElementById('status-text');

    s1.className = 'step-bubble'; s2.className = 'step-bubble'; s3.className = 'step-bubble';
    c1.className = 'step-connector'; c2.className = 'step-connector';

    if (status === 'received') {
        s1.className += ' done'; s1.textContent = '✓';
    s2.className += ' active'; s2.textContent = '2';
    s3.textContent = '3';
    msg.className = 'status-msg';
    txt.textContent = 'Order received! Our team is on it.';
            } else if (status === 'in-progress') {
        s1.className += ' done'; s1.textContent = '✓';
    c1.className += ' done';
    s2.className += ' done'; s2.textContent = '✓';
    s3.className += ' active'; s3.textContent = '3';
    msg.className = 'status-msg';
    txt.textContent = 'Your order is being prepared right now!';
            } else if (status === 'ready') {
        s1.className += ' done'; s1.textContent = '✓';
    s2.className += ' done'; s2.textContent = '✓';
    c1.className += ' done'; c2.className += ' done';
    s3.className += ' done'; s3.textContent = '✓';
    msg.className = 'status-msg ready';
    txt.textContent = '🎉 Your order is ready for pickup at the DECA Cafe!';
            }
        }

    // ===== STAFF LOGIC =====
    function checkPin() {
            const val = document.getElementById('pin-input').value;
    if (val === STAFF_PIN) {
        document.getElementById('pin-gate').style.display = 'none';
    document.getElementById('staff-dashboard').style.display = 'block';
    document.getElementById('logout-btn').classList.add('visible');
    staffUnlocked = true;
    renderOrders();
            } else if (val.length === 4) {
        document.getElementById('pin-error').textContent = 'Incorrect PIN. Try again.';
            }
        }

    function lockDashboard() {
        document.getElementById('pin-gate').style.display = 'block';
    document.getElementById('staff-dashboard').style.display = 'none';
    document.getElementById('pin-input').value = '';
    document.getElementById('pin-error').textContent = '';
    document.getElementById('logout-btn').classList.remove('visible');
    staffUnlocked = false;
        }

    function logout() {lockDashboard(); showScreen('staff'); }

    function updateOrderStatus(id, newStatus) {
            const order = orders.find(o => o.id === id);
    if (order) {
        order.status = newStatus;
    if (currentOrderStatus === id) showStatus(newStatus);
    saveOrders();
    renderOrders();
            }
        }

    function renderOrders() {
            const grid = document.getElementById('orders-grid');
    const countBadge = document.getElementById('order-count');
            const active = orders.filter(o => o.status !== 'ready');
    countBadge.textContent = orders.length;

    if (orders.length === 0) {
        grid.innerHTML = '<div class="empty-state">No orders yet! Teachers will appear here when they place orders.</div>';
    return;
            }

            grid.innerHTML = orders.map(o => {
                const itemsText = o.items.map(i => `${i.qty}× ${i.name}`).join(', ');
    const statusLabel = {received: 'Order Received', 'in-progress': 'In Progress', ready: 'Ready!' }[o.status];
    const statusClass = {received: 'status-received', 'in-progress': 'status-in-progress', ready: 'status-ready' }[o.status];
    const cardClass = o.status === 'in-progress' ? 'in-progress' : o.status === 'ready' ? 'ready' : '';

    let btns = '';
    if (o.status === 'received') {
        btns = `<button class="btn-sm btn-start" onclick="updateOrderStatus('${o.id}','in-progress')">Start preparing</button>
                <button class="btn-sm btn-ready" onclick="updateOrderStatus('${o.id}','ready')">Mark ready</button>`;
                } else if (o.status === 'in-progress') {
        btns = `<button class="btn-sm btn-ready" onclick="updateOrderStatus('${o.id}','ready')" style="flex:1">Mark as Ready ✓</button>`;
                } else {
        btns = `<button class="btn-sm btn-done" style="flex:1" disabled>Completed</button>`;
                }

    return `
    <div class="order-card ${cardClass}">
        <div class="order-card-header">
            <div class="teacher-name">${o.name}</div>
            <div class="room-badge">${o.room}</div>
        </div>
        <div class="status-pill ${statusClass}">${statusLabel}</div>
        <div class="order-time">Placed at ${o.time}</div>
        <div class="order-items-list">${itemsText}</div>
        ${o.notes ? `<div class="order-notes">📝 ${o.notes}</div>` : ''}
        <div class="order-total">Total: $${o.total.toFixed(2)}</div>
        <div class="action-btns">${btns}</div>
    </div>`;
            }).join('');
        }
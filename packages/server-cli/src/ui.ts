export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flags Local — Modern Feature Management</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: { 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
            darkbg: '#0f172a',
            cardbg: '#1e293b'
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #0b0f19; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  </style>
</head>
<body class="text-slate-100 min-h-screen">
  <!-- Top Navigation -->
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
          <i class="fa-solid fa-flag"></i>
        </div>
        <span class="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">flags-local</span>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">v1.0.0</span>
      </div>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live SSE Streaming Active</span>
        </div>
        <button onclick="openModal()" class="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-indigo-600/25">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Create Flag</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Quick Stats & Environment Selector -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Environment</div>
        <div class="mt-2 flex items-center justify-between">
          <select id="envSelect" onchange="loadFlags()" class="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2">
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
        </div>
      </div>
      <div class="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Flags</div>
        <div class="mt-2 text-2xl font-bold text-slate-100" id="statTotal">0</div>
      </div>
      <div class="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Enabled Flags</div>
        <div class="mt-2 text-2xl font-bold text-emerald-400" id="statEnabled">0</div>
      </div>
      <div class="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider">Targeted / Rollout</div>
        <div class="mt-2 text-2xl font-bold text-indigo-400" id="statTargeted">0</div>
      </div>
    </div>

    <!-- Flags Table Card -->
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-200">Feature Flags</h2>
        <input type="text" id="searchBox" oninput="filterFlags()" placeholder="Search flags..." class="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 w-64" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="text-xs uppercase bg-slate-800/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th scope="col" class="px-6 py-4">Flag Key & Name</th>
              <th scope="col" class="px-6 py-4">Environment Status</th>
              <th scope="col" class="px-6 py-4">Rollout %</th>
              <th scope="col" class="px-6 py-4">Targeting Rules</th>
              <th scope="col" class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="flagsTableBody" class="divide-y divide-slate-800">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- Create / Edit Flag Modal -->
  <div id="flagModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-6 shadow-2xl relative">
      <h3 id="modalTitle" class="text-lg font-bold text-slate-100 mb-4">Create New Feature Flag</h3>
      
      <form id="flagForm" onsubmit="saveFlag(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Flag Key (ID)</label>
          <input type="text" id="modalFlagId" required placeholder="e.g. new-checkout-v2" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Display Name</label>
          <input type="text" id="modalFlagName" required placeholder="e.g. New Checkout Flow" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
          <textarea id="modalFlagDesc" rows="2" placeholder="Brief description of this feature..." class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"></textarea>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Rollout Percentage (0-100%)</label>
          <input type="number" id="modalFlagPercentage" min="0" max="100" placeholder="100 for all users" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>

        <div class="pt-4 flex justify-end space-x-3 border-t border-slate-800">
          <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700">Cancel</button>
          <button type="submit" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25">Save Flag</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let flagsData = [];

    async function loadFlags() {
      try {
        const res = await fetch('/api/v1/flags');
        flagsData = await res.json();
        renderTable();
      } catch (err) {
        console.error('Error fetching flags:', err);
      }
    }

    function renderTable() {
      const env = document.getElementById('envSelect').value;
      const search = (document.getElementById('searchBox').value || '').toLowerCase();
      const tbody = document.getElementById('flagsTableBody');
      tbody.innerHTML = '';

      let enabledCount = 0;
      let targetedCount = 0;

      const filtered = flagsData.filter(f => f.id.toLowerCase().includes(search) || f.name.toLowerCase().includes(search));

      filtered.forEach(flag => {
        const isEnabled = flag.environments?.[env] !== undefined ? flag.environments[env] : flag.enabled;
        if (isEnabled) enabledCount++;
        if (flag.percentage !== undefined && flag.percentage < 100) targetedCount++;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/40 transition";
        tr.innerHTML = \`
          <td class="px-6 py-4">
            <div class="font-bold text-slate-100">\${escapeHtml(flag.name)}</div>
            <div class="font-mono text-xs text-indigo-400">\${escapeHtml(flag.id)}</div>
            <div class="text-xs text-slate-400 mt-0.5">\${escapeHtml(flag.description || '')}</div>
          </td>
          <td class="px-6 py-4">
            <button onclick="toggleFlag('\${flag.id}', '\${env}', \${!isEnabled})" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none \${isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}">
              <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out \${isEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
          </td>
          <td class="px-6 py-4">
            \${flag.percentage !== undefined ? \`<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">\${flag.percentage}% Rollout</span>\` : \`<span class="text-xs text-slate-500">100% (All)</span>\`}
          </td>
          <td class="px-6 py-4">
            \${flag.rules && flag.rules.length ? \`<span class="text-xs text-amber-400">\${flag.rules.length} rule(s)</span>\` : \`<span class="text-xs text-slate-500">None</span>\`}
          </td>
          <td class="px-6 py-4 text-right space-x-2">
            <button onclick="deleteFlag('\${flag.id}')" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-950/40 transition">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });

      document.getElementById('statTotal').innerText = flagsData.length;
      document.getElementById('statEnabled').innerText = enabledCount;
      document.getElementById('statTargeted').innerText = targetedCount;
    }

    async function toggleFlag(id, env, nextState) {
      const flag = flagsData.find(f => f.id === id);
      if (!flag) return;
      if (!flag.environments) flag.environments = {};
      flag.environments[env] = nextState;
      await fetch('/api/v1/flags/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flag)
      });
      loadFlags();
    }

    async function deleteFlag(id) {
      if (!confirm('Are you sure you want to delete flag "' + id + '"?')) return;
      await fetch('/api/v1/flags/' + id, { method: 'DELETE' });
      loadFlags();
    }

    function openModal() {
      document.getElementById('modalFlagId').value = '';
      document.getElementById('modalFlagId').disabled = false;
      document.getElementById('modalFlagName').value = '';
      document.getElementById('modalFlagDesc').value = '';
      document.getElementById('modalFlagPercentage').value = '100';
      document.getElementById('flagModal').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('flagModal').classList.add('hidden');
    }

    async function saveFlag(e) {
      e.preventDefault();
      const id = document.getElementById('modalFlagId').value.trim();
      const name = document.getElementById('modalFlagName').value.trim();
      const description = document.getElementById('modalFlagDesc').value.trim();
      const percentageRaw = document.getElementById('modalFlagPercentage').value;
      const percentage = percentageRaw ? parseInt(percentageRaw, 10) : undefined;

      const flag = {
        id,
        name,
        description,
        enabled: true,
        percentage,
        environments: { development: true, staging: true, production: false }
      };

      await fetch('/api/v1/flags/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flag)
      });

      closeModal();
      loadFlags();
    }

    function filterFlags() {
      renderTable();
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Connect SSE Stream
    const eventSource = new EventSource('/api/v1/flags/stream');
    eventSource.onmessage = (event) => {
      try {
        flagsData = JSON.parse(event.data);
        renderTable();
      } catch (err) {}
    };

    loadFlags();
  </script>
</body>
</html>`;
}

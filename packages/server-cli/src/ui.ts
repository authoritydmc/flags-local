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
            brand: { 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' }
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { background-color: #0b0f19; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    .glass { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); }
  </style>
</head>
<body class="text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white pb-16">
  <!-- Top Navigation -->
  <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
          <i class="fa-solid fa-flag text-lg"></i>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">flags-local</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">v1.1.0</span>
          </div>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <button onclick="openTesterModal()" class="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3.5 py-2 rounded-lg text-sm border border-slate-700 transition">
          <i class="fa-solid fa-vial text-indigo-400"></i>
          <span>Live Evaluator</span>
        </button>
        <button onclick="openCreateModal()" class="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-indigo-600/30 active:scale-95">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Create Flag</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Environment Switcher -->
      <div class="glass border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Active Environment</span>
          <i class="fa-solid fa-layer-group text-slate-500"></i>
        </div>
        <div class="mt-3">
          <select id="envSelect" onchange="loadFlags()" class="bg-slate-800/90 border border-slate-700 text-slate-100 font-semibold text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none block w-full p-2.5">
            <option value="development">🟢 Development</option>
            <option value="staging">🟡 Staging</option>
            <option value="production">🔴 Production</option>
          </select>
        </div>
      </div>

      <!-- Total Flags -->
      <div class="glass border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Total Flags</span>
          <i class="fa-solid fa-list-check text-slate-500"></i>
        </div>
        <div class="mt-2 text-3xl font-extrabold text-slate-100" id="statTotal">0</div>
      </div>

      <!-- Enabled in Env -->
      <div class="glass border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Active in Environment</span>
          <i class="fa-solid fa-circle-check text-emerald-500"></i>
        </div>
        <div class="mt-2 text-3xl font-extrabold text-emerald-400" id="statEnabled">0</div>
      </div>

      <!-- Live Stream Status -->
      <div class="glass border border-slate-800/80 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>SSE Protocol</span>
          <i class="fa-solid fa-satellite-dish text-indigo-400"></i>
        </div>
        <div class="mt-2 flex items-center space-x-2">
          <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-sm font-semibold text-slate-200">Real-Time Sync</span>
        </div>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div class="relative w-full sm:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-500 text-sm"></i>
        <input type="text" id="searchBox" oninput="filterFlags()" placeholder="Filter by key, name, tag..." class="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
      </div>
    </div>

    <!-- Flags Card Container -->
    <div class="space-y-3" id="flagsContainer">
      <!-- Flags rendered dynamically -->
    </div>
  </main>

  <!-- Create / Edit Flag Modal (Full CRUD) -->
  <div id="flagModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md hidden p-4 overflow-y-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-8">
      <div class="flex items-center justify-between mb-5 border-b border-slate-800 pb-4">
        <h3 id="modalTitle" class="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <i class="fa-solid fa-sliders text-indigo-400"></i>
          <span id="modalHeading">Create New Feature Flag</span>
        </h3>
        <button onclick="closeModal()" class="text-slate-500 hover:text-slate-300 text-lg"><i class="fa-solid fa-xmark"></i></button>
      </div>
      
      <form id="flagForm" onsubmit="saveFlag(event)" class="space-y-4">
        <input type="hidden" id="modalIsEdit" value="false" />
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Flag Key (ID)</label>
            <input type="text" id="modalFlagId" required placeholder="e.g. new-checkout-v2" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Display Name</label>
            <input type="text" id="modalFlagName" required placeholder="e.g. New Checkout Flow" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
          <textarea id="modalFlagDesc" rows="2" placeholder="Brief description of this feature..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Rollout % (0-100)</label>
            <input type="number" id="modalFlagPercentage" min="0" max="100" placeholder="100" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tags (comma separated)</label>
            <input type="text" id="modalFlagTags" placeholder="core, billing" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <!-- Environments Configuration -->
        <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Environment Defaults</label>
          <div class="grid grid-cols-3 gap-4">
            <label class="flex items-center space-x-2 text-sm text-slate-200 cursor-pointer">
              <input type="checkbox" id="modalEnvDev" class="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-0" />
              <span>Development</span>
            </label>
            <label class="flex items-center space-x-2 text-sm text-slate-200 cursor-pointer">
              <input type="checkbox" id="modalEnvStaging" class="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-0" />
              <span>Staging</span>
            </label>
            <label class="flex items-center space-x-2 text-sm text-slate-200 cursor-pointer">
              <input type="checkbox" id="modalEnvProd" class="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-0" />
              <span>Production</span>
            </label>
          </div>
        </div>

        <!-- Dynamic JSON Value (Optional config) -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Payload / Config Value (Optional JSON or String)</label>
          <input type="text" id="modalFlagValue" placeholder='{"theme": "dark", "maxRetries": 3}' class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500" />
        </div>

        <div class="pt-4 flex justify-end space-x-3 border-t border-slate-800">
          <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition">Cancel</button>
          <button type="submit" class="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition">Save Flag</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Live Rule Tester Modal -->
  <div id="testerModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md hidden p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <i class="fa-solid fa-vial text-indigo-400"></i>
          <span>Interactive Flag Evaluator</span>
        </h3>
        <button onclick="closeTesterModal()" class="text-slate-500 hover:text-slate-300"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Flag</label>
          <select id="evalFlagSelect" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"></select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">User Key (ID)</label>
          <input type="text" id="evalUserKey" placeholder="e.g. user_12345" value="user_123" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <button onclick="runEvaluation()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition">Evaluate State</button>

        <div id="evalResultBox" class="hidden p-4 rounded-xl border bg-slate-800/80 border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase text-slate-400">Evaluation Result</span>
            <span id="evalBadge" class="px-2.5 py-0.5 rounded-full text-xs font-bold"></span>
          </div>
          <div id="evalReason" class="mt-2 text-xs font-mono text-slate-300"></div>
          <div id="evalPayload" class="mt-2 text-xs font-mono text-indigo-400"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let flagsData = [];

    async function loadFlags() {
      try {
        const res = await fetch('/api/v1/flags');
        flagsData = await res.json();
        renderCards();
      } catch (err) {
        console.error('Error fetching flags:', err);
      }
    }

    function renderCards() {
      const env = document.getElementById('envSelect').value;
      const search = (document.getElementById('searchBox').value || '').toLowerCase();
      const container = document.getElementById('flagsContainer');
      container.innerHTML = '';

      let enabledCount = 0;

      const filtered = flagsData.filter(f => 
        f.id.toLowerCase().includes(search) || 
        f.name.toLowerCase().includes(search) ||
        (f.tags && f.tags.some(t => t.toLowerCase().includes(search)))
      );

      filtered.forEach(flag => {
        const isEnabled = flag.environments?.[env] !== undefined ? flag.environments[env] : flag.enabled;
        if (isEnabled) enabledCount++;

        const card = document.createElement('div');
        card.className = "glass border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4";
        
        const tagsHtml = (flag.tags || []).map(t => \`<span class="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-800 text-slate-400 border border-slate-700/60">#\${escapeHtml(t)}</span>\`).join(' ');

        card.innerHTML = \`
          <div class="flex items-start space-x-4">
            <div class="w-10 h-10 rounded-xl \${isEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'} flex items-center justify-center flex-shrink-0 font-bold text-base">
              <i class="fa-solid \${isEnabled ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-100 text-base">\${escapeHtml(flag.name)}</span>
                <span class="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">\${escapeHtml(flag.id)}</span>
                \${tagsHtml}
              </div>
              <div class="text-xs text-slate-400 mt-1 max-w-2xl">\${escapeHtml(flag.description || 'No description provided')}</div>
              <div class="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                <span><i class="fa-solid fa-chart-pie mr-1"></i>\${flag.percentage !== undefined ? flag.percentage + '%' : '100%'} Rollout</span>
                <span><i class="fa-solid fa-filter mr-1"></i>\${flag.rules && flag.rules.length ? flag.rules.length + ' rule(s)' : 'No rules'}</span>
                <span><i class="fa-regular fa-clock mr-1"></i>\${new Date(flag.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3 self-end sm:self-center">
            <!-- Toggle Switch -->
            <button onclick="toggleFlag('\${flag.id}', '\${env}', \${!isEnabled})" class="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none \${isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}">
              <span class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out \${isEnabled ? 'translate-x-5' : 'translate-x-0'}"></span>
            </button>
            
            <!-- Edit Button -->
            <button onclick="openEditModal('\${flag.id}')" title="Edit Flag" class="text-slate-400 hover:text-indigo-400 p-2 rounded-lg hover:bg-slate-800 transition">
              <i class="fa-solid fa-pen-to-square text-sm"></i>
            </button>

            <!-- Delete Button -->
            <button onclick="deleteFlag('\${flag.id}')" title="Delete Flag" class="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition">
              <i class="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        \`;
        container.appendChild(card);
      });

      document.getElementById('statTotal').innerText = flagsData.length;
      document.getElementById('statEnabled').innerText = enabledCount;
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

    function openCreateModal() {
      document.getElementById('modalHeading').innerText = 'Create New Feature Flag';
      document.getElementById('modalIsEdit').value = 'false';
      document.getElementById('modalFlagId').disabled = false;
      document.getElementById('modalFlagId').value = '';
      document.getElementById('modalFlagName').value = '';
      document.getElementById('modalFlagDesc').value = '';
      document.getElementById('modalFlagPercentage').value = '100';
      document.getElementById('modalFlagTags').value = '';
      document.getElementById('modalFlagValue').value = '';
      document.getElementById('modalEnvDev').checked = true;
      document.getElementById('modalEnvStaging').checked = true;
      document.getElementById('modalEnvProd').checked = false;
      document.getElementById('flagModal').classList.remove('hidden');
    }

    function openEditModal(flagId) {
      const flag = flagsData.find(f => f.id === flagId);
      if (!flag) return;

      document.getElementById('modalHeading').innerText = 'Edit Feature Flag: ' + flag.id;
      document.getElementById('modalIsEdit').value = 'true';
      document.getElementById('modalFlagId').disabled = true;
      document.getElementById('modalFlagId').value = flag.id;
      document.getElementById('modalFlagName').value = flag.name || '';
      document.getElementById('modalFlagDesc').value = flag.description || '';
      document.getElementById('modalFlagPercentage').value = flag.percentage !== undefined ? flag.percentage : 100;
      document.getElementById('modalFlagTags').value = (flag.tags || []).join(', ');
      document.getElementById('modalFlagValue').value = flag.value !== undefined ? (typeof flag.value === 'object' ? JSON.stringify(flag.value) : flag.value) : '';
      
      document.getElementById('modalEnvDev').checked = flag.environments?.development !== false;
      document.getElementById('modalEnvStaging').checked = flag.environments?.staging === true;
      document.getElementById('modalEnvProd').checked = flag.environments?.production === true;

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
      const tags = document.getElementById('modalFlagTags').value.split(',').map(t => t.trim()).filter(Boolean);
      
      let customValue = undefined;
      const rawVal = document.getElementById('modalFlagValue').value.trim();
      if (rawVal) {
        try {
          customValue = JSON.parse(rawVal);
        } catch {
          customValue = rawVal;
        }
      }

      const existing = flagsData.find(f => f.id === id);

      const flag = {
        id,
        name,
        description,
        enabled: true,
        percentage,
        tags,
        value: customValue,
        environments: {
          development: document.getElementById('modalEnvDev').checked,
          staging: document.getElementById('modalEnvStaging').checked,
          production: document.getElementById('modalEnvProd').checked,
        },
        rules: existing?.rules || [],
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await fetch('/api/v1/flags/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flag)
      });

      closeModal();
      loadFlags();
    }

    function openTesterModal() {
      const select = document.getElementById('evalFlagSelect');
      select.innerHTML = '';
      flagsData.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.innerText = f.name + ' (' + f.id + ')';
        select.appendChild(opt);
      });
      document.getElementById('evalResultBox').classList.add('hidden');
      document.getElementById('testerModal').classList.remove('hidden');
    }

    function closeTesterModal() {
      document.getElementById('testerModal').classList.add('hidden');
    }

    async function runEvaluation() {
      const flagId = document.getElementById('evalFlagSelect').value;
      const key = document.getElementById('evalUserKey').value.trim();
      const env = document.getElementById('envSelect').value;

      const res = await fetch('/api/v1/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId, context: { key, environment: env } })
      });
      const data = await res.json();

      const resultBox = document.getElementById('evalResultBox');
      const badge = document.getElementById('evalBadge');
      const reason = document.getElementById('evalReason');
      const payload = document.getElementById('evalPayload');

      resultBox.classList.remove('hidden');
      if (data.enabled) {
        badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
        badge.innerText = "ENABLED";
      } else {
        badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30";
        badge.innerText = "DISABLED";
      }
      reason.innerText = 'Reason: ' + (data.reason || 'Evaluated successfully');
      payload.innerText = data.value !== undefined ? 'Payload: ' + JSON.stringify(data.value) : '';
    }

    function filterFlags() {
      renderCards();
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Connect SSE Stream
    const eventSource = new EventSource('/api/v1/flags/stream');
    eventSource.onmessage = (event) => {
      try {
        flagsData = JSON.parse(event.data);
        renderCards();
      } catch (err) {}
    };

    loadFlags();
  </script>
</body>
</html>`;
}

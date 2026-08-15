// AutoPrint Spooler Agent - Core Frontend Application Controller

class AutoPrintApp {
  constructor() {
    this.isPaired = false;
    this.logs = [];
    this.jobs = [];
    
    // Cache UI elements
    this.btnPair = document.getElementById('btn-pair');
    this.shopIdInput = document.getElementById('shop-id');
    this.pairingTokenInput = document.getElementById('pairing-token');
    this.printerSelect = document.getElementById('printer-select');
    this.btnRefreshPrinters = document.getElementById('btn-refresh-printers');
    this.btnTestPrint = document.getElementById('btn-test-print');
    this.connectionStatus = document.getElementById('connection-status');
    this.pairedHubText = document.getElementById('paired-hub-text');
    this.liveTime = document.getElementById('live-time');
    this.jobList = document.getElementById('job-list');
    this.logConsole = document.getElementById('log-console');
    this.btnClearLogs = document.getElementById('btn-clear-logs');
    this.queueCountBadge = document.getElementById('queue-count-badge');
    
    // Gauges elements caching
    this.printerDetailsPanel = document.getElementById('printer-details-panel');
    this.detailStatus = document.getElementById('detail-status');
    this.detailToner = document.getElementById('detail-toner');
    this.detailPaper = document.getElementById('detail-paper');
    this.tonerBar = document.getElementById('toner-bar');
    this.paperBar = document.getElementById('paper-bar');

    this.detectedPrinters = [];

    this.initEventListeners();
    this.startClock();
    this.loadPrinters();
    
    // Start polling daemon for UI state updates (queue & logs)
    setInterval(() => this.pollState(), 2000);
  }

  // Check if running inside Tauri sandbox
  hasTauri() {
    return window.__TAURI__ !== undefined;
  }

  initEventListeners() {
    this.btnPair.addEventListener('click', () => this.handlePairing());
    this.btnRefreshPrinters.addEventListener('click', () => this.loadPrinters());
    this.btnTestPrint.addEventListener('click', () => this.handleTestPrint());
    this.btnClearLogs.addEventListener('click', () => this.clearLogs());
    this.printerSelect.addEventListener('change', (e) => this.handlePrinterChange(e.target.value));
  }

  startClock() {
    setInterval(() => {
      const now = new Date();
      this.liveTime.textContent = now.toTimeString().split(' ')[0];
    }, 1000);
  }

  addLog(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `log-line ${level.toLowerCase()}`;
    line.textContent = `[${timestamp}] [${level}] ${message}`;
    this.logConsole.appendChild(line);
    this.logConsole.scrollTop = this.logConsole.scrollHeight;
  }

  clearLogs() {
    this.logConsole.innerHTML = '';
    this.addLog('INFO', 'Log console cleared.');
  }

  async handlePairing() {
    const shopId = this.shopIdInput.value.trim();
    const token = this.pairingTokenInput.value.trim();

    if (!shopId || !token) {
      alert('Please fill in both Shop ID and Pairing Token.');
      return;
    }

    this.addLog('INFO', `Attempting hub pairing to ${shopId}...`);

    if (this.hasTauri()) {
      try {
        const response = await window.__TAURI__.invoke('pair_agent', {
          shopId,
          token,
          serverUrl: "http://localhost:3000"
        });

        if (response === 'SUCCESS') {
          this.markAsPaired(shopId);
        }
      } catch (err) {
        this.addLog('ERROR', `Pairing failed: ${err}`);
      }
    } else {
      // Mock Browser fallback
      setTimeout(() => {
        this.markAsPaired(shopId);
      }, 800);
    }
  }

  markAsPaired(shopId) {
    this.isPaired = true;
    this.connectionStatus.textContent = 'Active & Spooling';
    this.connectionStatus.className = 'status-badge online';
    this.pairedHubText.textContent = `Connected Hub: ${shopId}`;
    this.addLog('SUCCESS', `Paired with shop ${shopId}. Telemetry established.`);
  }

  async loadPrinters() {
    this.addLog('INFO', 'Querying local print spooler hardware...');
    let printers = [];

    if (this.hasTauri()) {
      try {
        printers = await window.__TAURI__.invoke('get_printers');
      } catch (err) {
        this.addLog('ERROR', `Failed to load printers: ${err}`);
      }
    } else {
      // Mock fallback including detailed metrics for gauges
      printers = [
        { id: 'ptr-1', name: 'Canon imageRUNNER ADVANCE C5535i', status: 'online', toner_level: 88, paper_level: 95 },
        { id: 'ptr-2', name: 'HP LaserJet Pro MFP M428fdw', status: 'online', toner_level: 72, paper_level: 40 },
        { id: 'ptr-3', name: 'Epson EcoTank L3150 Wi-Fi', status: 'error_no_paper', toner_level: 15, paper_level: 0 },
        { id: 'ptr-4', name: 'Brother HL-L2321D Duplex', status: 'error_ink_low', toner_level: 5, paper_level: 90 },
        { id: 'ptr-5', name: 'Ricoh Aficio MP 2014AD', status: 'offline', toner_level: 0, paper_level: 0 }
      ];
    }

    this.detectedPrinters = printers;
    this.printerSelect.innerHTML = '';
    
    printers.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = `${p.name} (${p.status.replace('_', ' ')})`;
      this.printerSelect.appendChild(opt);
    });

    this.addLog('INFO', `Detected ${printers.length} printing nodes.`);
    
    if (printers.length > 0) {
      this.handlePrinterChange(printers[0].name);
    }
  }

  async handlePrinterChange(printerName) {
    if (this.hasTauri()) {
      await window.__TAURI__.invoke('select_printer', { printerName });
    } else {
      this.addLog('INFO', `Selected printer: ${printerName}`);
    }

    // Find the printer details to update status indicators in sidebar
    const printer = this.detectedPrinters.find(p => p.name === printerName);
    if (printer) {
      this.printerDetailsPanel.style.display = 'block';
      this.detailStatus.textContent = printer.status.toUpperCase().replace('_', ' ');
      
      // Clear previous classes
      this.detailStatus.className = 'job-status-pill';
      if (printer.status === 'online') {
        this.detailStatus.classList.add('success');
      } else if (printer.status.startsWith('error')) {
        this.detailStatus.classList.add('pending');
      } else {
        this.detailStatus.style.background = 'rgba(239, 68, 68, 0.2)';
        this.detailStatus.style.color = 'var(--danger-color)';
      }

      // Toner
      const toner = printer.toner_level ?? 90;
      this.detailToner.textContent = `${toner}%`;
      this.tonerBar.style.width = `${toner}%`;
      this.tonerBar.className = 'progress-bar ' + (toner < 15 ? 'amber' : 'blue');

      // Paper
      const paper = printer.paper_level ?? 85;
      this.detailPaper.textContent = `${paper}%`;
      this.paperBar.style.width = `${paper}%`;
      this.paperBar.className = 'progress-bar ' + (paper === 0 ? 'red' : paper < 30 ? 'amber' : 'green');
    }
  }

  async handleTestPrint() {
    if (!this.isPaired) {
      alert('Pair the agent with a shop hub before dispatching print jobs.');
      return;
    }

    const orderNumber = `MP-${Math.floor(100000 + Math.random() * 900000)}`;
    this.addLog('INFO', `Dispatching test job request for Order #${orderNumber}`);

    if (this.hasTauri()) {
      await window.__TAURI__.invoke('trigger_manual_job', {
        orderNumber,
        customerName: 'Guest Tester',
        fileName: 'Sample_Print_Test.pdf',
        downloadUrl: 'http://localhost:3000/docs/sample.pdf',
        copies: 1
      });
    } else {
      // Mock spooler loop in browser preview
      this.addLog('INFO', `Spooler: Downloading Document for ${orderNumber}`);
      setTimeout(() => {
        this.addLog('SUCCESS', `Spooler: Printing cover sheet & document for ${orderNumber}`);
      }, 1500);
    }
  }

  async pollState() {
    if (!this.isPaired) return;

    if (this.hasTauri()) {
      try {
        const jobs = await window.__TAURI__.invoke('get_queue_jobs');
        const logs = await window.__TAURI__.invoke('get_logs_stream');
        
        this.renderQueue(jobs);
        this.renderBackendLogs(logs);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }
  }

  renderQueue(jobs) {
    this.queueCountBadge.textContent = `${jobs.length} Jobs`;
    
    if (jobs.length === 0) {
      this.jobList.innerHTML = '<div class="empty-state">No jobs in local queue. Ready to print.</div>';
      return;
    }

    this.jobList.innerHTML = '';
    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'job-card';
      card.innerHTML = `
        <div class="job-details">
          <h4>Order #${job.order_number}</h4>
          <p>${job.file_name} • Copies: ${job.copies} • Retry: ${job.retry_count}</p>
        </div>
        <span class="job-status-pill pending">${job.status}</span>
      `;
      this.jobList.appendChild(card);
    });
  }

  renderBackendLogs(logs) {
    // Only display new lines
    const currentCount = this.logConsole.children.length;
    if (logs.length > currentCount) {
      for (let i = currentCount; i < logs.length; i++) {
        const line = document.createElement('div');
        line.className = `log-line ${logs[i].level.toLowerCase()}`;
        line.textContent = `[${logs[i].timestamp}] [${logs[i].level}] ${logs[i].message}`;
        this.logConsole.appendChild(line);
      }
      this.logConsole.scrollTop = this.logConsole.scrollHeight;
    }
  }
}

// Instantiate App
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AutoPrintApp();
});

console.log("Pushbridge options page loaded");const h=["Send","Messages","Notifications","Subscriptions","SMS/MMS"];class L{constructor(){this.settings={soundEnabled:!0,defaultDevice:"all",notificationsEnabled:!0,autoReconnect:!0,defaultSmsDevice:"",autoOpenPushLinksAsTab:!1,optionOrder:h.slice(),hiddenTabs:[]},this.devices=[],this.smsDevices=[],this.pendingSmsDeviceChange=null}async init(){await this.loadSettings(),await this.loadDevices(),await this.loadSmsDevices(),this.render(),this.setupEventListeners()}async loadSettings(){try{const e=await chrome.storage.local.get(["pb_settings"]);e.pb_settings?this.settings={...this.settings,...e.pb_settings}:await chrome.storage.local.set({pb_settings:this.settings}),e.pb_settings?.autoOpenPushLinksAsTab!==void 0?this.settings.autoOpenPushLinksAsTab=e.pb_settings.autoOpenPushLinksAsTab:await chrome.storage.local.set({pb_settings:{...this.settings,autoOpenPushLinksAsTab:this.settings.autoOpenPushLinksAsTab}});const s=await chrome.storage.local.get("defaultSmsDevice");s.defaultSmsDevice&&(this.settings.defaultSmsDevice=s.defaultSmsDevice);const t=new Set(h),o=g=>{const n=new Set,c=[];if(Array.isArray(g)){for(const l of g)if(typeof l=="string"&&t.has(l)&&!n.has(l)){const a=l;n.add(a),c.push(a)}}for(const l of h)n.has(l)||c.push(l);return c},v=g=>{if(!Array.isArray(g))return[];const n=new Set;for(const c of g)typeof c=="string"&&t.has(c)&&n.add(c);return Array.from(n)},r=e.pb_settings?.optionOrder??this.settings.optionOrder,p=e.pb_settings?.hiddenTabs??this.settings.hiddenTabs??[],f=o(r),m=v(p),y=JSON.stringify(r)!==JSON.stringify(f),D=JSON.stringify(p)!==JSON.stringify(m);this.settings.optionOrder=f,this.settings.hiddenTabs=m,(y||D)&&await this.saveSettings()}catch(e){console.error("Failed to load settings:",e)}}async setOptionOrder(e){const s=new Set(h),t=e.filter((o,v,r)=>typeof o=="string"&&s.has(o)&&r.indexOf(o)===v);for(const o of h)t.includes(o)||t.push(o);this.settings.optionOrder=t,await this.saveSettings()}async loadDevices(){try{const e=await chrome.runtime.sendMessage({cmd:"getDevices"});e.ok&&(this.devices=e.devices||[])}catch(e){console.error("Failed to load devices:",e)}}async loadSmsDevices(){try{const e=await chrome.runtime.sendMessage({cmd:"GET_SMS_CAPABLE_DEVICES"});e.success&&(this.smsDevices=e.devices||[])}catch(e){console.error("Failed to load SMS devices:",e)}}getDeviceDisplayName(e){return e.nickname?e.nickname:e.manufacturer&&e.model?`${e.manufacturer} ${e.model}`:e.model?e.model:"Unknown Device"}async saveSettings(){try{await chrome.storage.local.set({pb_settings:this.settings}),this.showMessage("Settings saved successfully!","success")}catch(e){console.error("Failed to save settings:",e),this.showMessage("Failed to save settings","error")}}async updateSmsDevice(){if(this.pendingSmsDeviceChange)try{const e=document.getElementById("update-sms-device");e&&(e.disabled=!0,e.textContent="Updating...");const s=await chrome.runtime.sendMessage({cmd:"SET_DEFAULT_SMS_DEVICE",deviceIden:this.pendingSmsDeviceChange});s.success?(this.settings.defaultSmsDevice=this.pendingSmsDeviceChange,this.pendingSmsDeviceChange=null,await chrome.storage.local.set({defaultSmsDevice:this.settings.defaultSmsDevice}),this.showMessage("SMS device updated successfully!","success"),this.render(),this.setupEventListeners()):this.showMessage(`Failed to update SMS device: ${s.error}`,"error")}catch(e){console.error("Failed to update SMS device:",e),this.showMessage("Failed to update SMS device","error")}finally{const e=document.getElementById("update-sms-device");e&&(e.disabled=!1,e.textContent="Update")}}async testWebSocket(){try{const e=await chrome.runtime.sendMessage({cmd:"testWebSocket"});e.ok?this.showMessage(`WebSocket test successful! Last heartbeat: ${e.lastHeartbeat}`,"success"):this.showMessage(`WebSocket test failed: ${e.error}`,"error")}catch{this.showMessage("WebSocket test failed","error")}}async exportDebugLog(){try{const e=await chrome.runtime.sendMessage({cmd:"getDebugLog"});if(e.ok){const s=new Blob([e.log],{type:"text/plain"}),t=URL.createObjectURL(s),o=document.createElement("a");o.href=t,o.download=`pushbridge-debug-${new Date().toISOString().split("T")[0]}.log`,o.click(),URL.revokeObjectURL(t),this.showMessage("Debug log exported successfully!","success")}else this.showMessage("Failed to export debug log","error")}catch{this.showMessage("Failed to export debug log","error")}}showMessage(e,s){const t=document.getElementById("message");t&&(t.textContent=e,t.className=`message ${s}`,t.style.display="block",setTimeout(()=>{t.style.display="none"},3e3))}setupEventListeners(){const e=document.getElementById("sound-toggle");e&&(e.checked=this.settings.soundEnabled,e.addEventListener("change",n=>{this.settings.soundEnabled=n.target.checked,this.saveSettings()}));const s=document.getElementById("notifications-toggle");s&&(s.checked=this.settings.notificationsEnabled,s.addEventListener("change",n=>{this.settings.notificationsEnabled=n.target.checked,this.saveSettings()}));const t=document.getElementById("option-order");if(t){let n=function(a,i){const d=Array.from(a.querySelectorAll("li:not(.dragging)"));let u=Number.NEGATIVE_INFINITY,w=null;for(const E of d){const b=E.getBoundingClientRect(),S=i-b.top-b.height/2;S<0&&S>u&&(u=S,w=E)}return w};const c=()=>{const a=this.settings.optionOrder.filter(i=>i!=="SMS/MMS"||this.smsDevices.length>0);t.innerHTML=a.map(i=>{const d=this.settings.hiddenTabs?.includes(i);return`
              <li draggable="true" data-key="${i}" class="dnd-item">
                <span class="handle" aria-hidden="true">⋮⋮</span>
                <span class="label">${i}</span>
                <button type="button"
                        class="toggle-visibility"
                        data-key="${i}"
                        data-state="${d?"show":"hide"}">
                  ${d?'<span class="material-symbols-outlined" style="font-size: 14px;">visibility</span>':'<span class="material-symbols-outlined" style="font-size: 14px;">visibility_off</span>'}
                </button>
              </li>
            `}).join("")};c(),t.addEventListener("click",async a=>{const i=a.target.closest(".toggle-visibility");if(!i)return;a.preventDefault();const d=i.dataset.key;if(!d)return;this.settings.hiddenTabs=Array.isArray(this.settings.hiddenTabs)?this.settings.hiddenTabs:[];const u=new Set(this.settings.hiddenTabs),w=u.has(d),E=h.filter(b=>b==="SMS/MMS"?this.smsDevices.length>0:!0);if(w)u.delete(d);else{if(E.filter(S=>!u.has(S)).length<=1){this.showMessage("At least one tab must remain visible.","error");return}u.add(d)}this.settings.hiddenTabs=Array.from(u),await this.saveSettings(),c()});let l=null;t.addEventListener("dragstart",a=>{if(a.target.closest(".toggle-visibility")){a.preventDefault();return}const i=a.target?.closest("li");i&&(l=i,i.classList.add("dragging"),a.dataTransfer?.setData("text/plain",i.dataset.key||""),a.dataTransfer?.setDragImage(i,10,10))}),t.addEventListener("dragover",a=>{a.preventDefault();const i=n(t,a.clientY);l&&(i?t.insertBefore(l,i):t.appendChild(l))}),t.addEventListener("dragend",async()=>{l&&l.classList.remove("dragging"),l=null;const a=Array.from(t.querySelectorAll("li")).map(i=>i.getAttribute("data-key"));await this.setOptionOrder(a),c()})}const o=document.getElementById("auto-reconnect-toggle");o&&(o.checked=this.settings.autoReconnect,o.addEventListener("change",n=>{this.settings.autoReconnect=n.target.checked,this.saveSettings()}));const v=document.getElementById("auto-open-links-toggle");v&&(v.checked=this.settings.autoOpenPushLinksAsTab,v.addEventListener("change",n=>{this.settings.autoOpenPushLinksAsTab=n.target.checked,this.saveSettings()}));const r=document.getElementById("default-device");r&&(r.value=this.settings.defaultDevice,r.addEventListener("change",n=>{this.settings.defaultDevice=n.target.value,this.saveSettings()}));const p=document.getElementById("default-sms-device");p&&(p.value=this.settings.defaultSmsDevice,p.addEventListener("change",n=>{const c=n.target.value;this.pendingSmsDeviceChange=c!==this.settings.defaultSmsDevice?c:null,this.updateSmsDeviceButtonState()}));const f=document.getElementById("test-websocket");f&&f.addEventListener("click",()=>this.testWebSocket());const m=document.getElementById("export-log");m&&m.addEventListener("click",()=>this.exportDebugLog());const y=document.getElementById("reset-settings");y&&y.addEventListener("click",()=>this.resetSettings());const D=document.getElementById("reset-all-data");D&&D.addEventListener("click",()=>this.resetAllData());const g=document.getElementById("update-sms-device");g&&g.addEventListener("click",()=>this.updateSmsDevice())}updateSmsDeviceButtonState(){const e=document.getElementById("update-sms-device");e&&(e.disabled=!this.pendingSmsDeviceChange,e.textContent=(this.pendingSmsDeviceChange,"Update SMS Device"))}async resetSettings(){confirm("Are you sure you want to reset all settings to defaults?")&&(this.settings={soundEnabled:!0,defaultDevice:"all",notificationsEnabled:!0,autoReconnect:!0,defaultSmsDevice:"",autoOpenPushLinksAsTab:!1,optionOrder:h.slice(),hiddenTabs:[]},this.pendingSmsDeviceChange=null,await this.saveSettings(),await chrome.storage.local.set({defaultSmsDevice:""}),this.render(),this.setupEventListeners())}async resetAllData(){if(confirm("Are you sure you want to reset ALL data? This will clear all cached data, cursors, and settings. You will need to re-authenticate."))try{await chrome.runtime.sendMessage({cmd:"clearAllData"}),this.showMessage("All data cleared successfully. Please refresh the page.","success"),this.settings={soundEnabled:!0,defaultDevice:"all",notificationsEnabled:!0,autoReconnect:!0,defaultSmsDevice:"",autoOpenPushLinksAsTab:!1,optionOrder:h.slice(),hiddenTabs:[]},this.pendingSmsDeviceChange=null,await this.saveSettings(),await chrome.storage.local.set({defaultSmsDevice:""}),this.render(),this.setupEventListeners()}catch(e){console.error("Failed to reset all data:",e),this.showMessage("Failed to reset all data. Please try again.","error")}}render(){const e=document.querySelector(".container");e&&(e.innerHTML=`
      <div class="options-header">
        <h1>Pushbridge Settings</h1>
        <p class="subtitle">Configure your Pushbridge extension preferences</p>
      </div>

      <div id="message" class="message" style="display: none;"></div>

      <div class="settings-section">
        <h2>Notifications</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <label for="notifications-toggle">Enable notifications</label>
            <p>Show Chrome notifications for incoming pushes and mirrored notifications</p>
          </div>
          <div class="setting-control">
            <input type="checkbox" id="notifications-toggle" class="toggle">
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label for="sound-toggle">Play notification sound</label>
            <p>Play a sound when receiving notifications</p>
          </div>
          <div class="setting-control">
            <input type="checkbox" id="sound-toggle" class="toggle">
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>Customization</h2>

        <div class="setting-item">
          <div class="setting-info">
            <label>Navigation order</label>
            <p>Drag to rearrange and click the eye icon to toggle visibility</p>
          </div>
          <div class="setting-control">
            <ul id="option-order" class="dnd-list"></ul>
          </div>
        </div>

      </div>

      <div class="settings-section">
        <h2>Default Settings</h2>

        <div class="setting-item">
          <div class="setting-info">
            <label for="default-device">Default target device</label>
            <p>Choose which device receives pushes by default</p>
          </div>
          <div class="setting-control">
            <select id="default-device" class="select">
              <option value="all">All devices</option>
              ${this.devices.map(s=>`<option value="${s.iden}">${this.getDeviceDisplayName(s)} (${s.type})</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label for="default-sms-device">Default SMS device</label>
            <p>Choose which device to use for SMS functionality</p>
          </div>
          <div class="setting-control sms-device-control">
            <select id="default-sms-device" class="select">
              <option value="">No SMS device selected</option>
              ${this.smsDevices.map(s=>`<option value="${s.iden}">${this.getDeviceDisplayName(s)} (${s.type})</option>`).join("")}
            </select>
            <button id="update-sms-device" class="button secondary" disabled>
              Update SMS Device
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label for="auto-open-links-toggle">Auto Open Push Links as Tabs</label>
            <p>Automatically open link pushes in new browser tabs when received</p>
          </div>
          <div class="setting-control">
            <input type="checkbox" id="auto-open-links-toggle" class="toggle">
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>Connection</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <label for="auto-reconnect-toggle">Auto-reconnect</label>
            <p>Automatically reconnect to Pushbullet when connection is lost</p>
          </div>
          <div class="setting-control">
            <input type="checkbox" id="auto-reconnect-toggle" class="toggle">
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>Diagnostics</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <label>WebSocket connection</label>
            <p>Test the connection to Pushbullet's real-time stream</p>
          </div>
          <div class="setting-control">
            <button id="test-websocket" class="button secondary">Test Connection</button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Debug log</label>
            <p>Export debug information for troubleshooting</p>
          </div>
          <div class="setting-control">
            <button id="export-log" class="button secondary">Export Log</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>Advanced</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <label>Reset settings</label>
            <p>Reset all settings to their default values</p>
          </div>
          <div class="setting-control">
            <button id="reset-settings" class="button danger">Reset All Settings</button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label>Reset all data</label>
            <p>Clear all cached data, cursors, and settings. You will need to re-authenticate.</p>
          </div>
          <div class="setting-control">
            <button id="reset-all-data" class="button danger">Reset All Data</button>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Pushbridge v1.3.1 · <a href="https://github.com/manish001in/pushbridge" target="_blank">GitHub</a> · <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a></p>
        <p class="disclaimer">This is an unofficial extension and is not affiliated with Pushbullet Inc.</p>
      </div>
    `)}}document.addEventListener("DOMContentLoaded",()=>{console.log("Options DOM ready"),new L().init()});

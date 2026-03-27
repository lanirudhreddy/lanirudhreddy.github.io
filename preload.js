const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("configApi", {
  loadConfig: () => ipcRenderer.invoke("config:load"),
  saveConfig: (config) => ipcRenderer.invoke("config:save", config),
  pickLoadConfig: () => ipcRenderer.invoke("config:pick-load")
});

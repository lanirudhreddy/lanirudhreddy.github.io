const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs/promises");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "config.json");

function createDefaultConfig() {
  return {
    timeSettingsEnabled: true,
    hourMode: "12",
    showSeconds: "off",
    showMilliseconds: "off",
    showMeridiem: "off",
    blinkColon: "off",
    timeDraggable: "off",
    fontSettingsEnabled: true,
    fontFamily: "'Google Sans Flex', sans-serif",
    fontWeight: "400",
    fontSize: "120",
    lineHeight: "1",
    letterSpacing: "0",
    fontStyle: "normal",
    textColor: "#ffffff",
    bgColor: "#000000",
    textSettingsEnabled: true,
    textDefaultFont: "'Google Sans Flex', sans-serif",
    customTextInput: "",
    textSize: "38",
    textTracking: "0",
    textLineHeight: "1.1",
    textWeight: "400",
    textStyle: "normal",
    textFillColor: "#ffffff",
    theme: "dark",
    nextTextId: 1,
    textHistory: [],
    floatingBlocks: [],
    clockDragged: false,
    clockPosition: {
      left: "50%",
      top: "50%",
      leftRatio: null,
      topRatio: null,
      transform: "translate(-50%, -50%)"
    }
  };
}

async function ensureConfigFile() {
  try {
    await fs.access(CONFIG_PATH);
  } catch {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(createDefaultConfig(), null, 2));
  }
}

async function readConfig() {
  await ensureConfigFile();
  try {
    const content = await fs.readFile(CONFIG_PATH, "utf8");
    return JSON.parse(content);
  } catch {
    const fallback = createDefaultConfig();
    await fs.writeFile(CONFIG_PATH, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function writeConfig(config) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

async function readConfigFromPath(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile("index.html");
}

ipcMain.handle("config:load", async () => readConfig());
ipcMain.handle("config:save", async (_event, config) => {
  await writeConfig(config);
  return { ok: true };
});
ipcMain.handle("config:pick-load", async () => {
  const window = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const result = await dialog.showOpenDialog(window, {
    title: "Load Config",
    properties: ["openFile"],
    filters: [
      { name: "JSON Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });

  if (result.canceled || !result.filePaths.length) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const config = await readConfigFromPath(filePath);
  return { canceled: false, filePath, config };
});

app.whenReady().then(async () => {
  await ensureConfigFile();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

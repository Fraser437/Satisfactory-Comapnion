import { createRequire as e } from "node:module";
// \0rolldown/runtime.js
var t = /* @__PURE__ */ e(import.meta.url), { app: n, BrowserWindow: r, ipcMain: i } = t("electron"), a = t("path");
function o() {
	let e = new r({
		width: 1400,
		height: 900,
		minWidth: 1e3,
		minHeight: 700,
		webPreferences: {
			preload: a.join(__dirname, "preload.js"),
			contextIsolation: !0,
			nodeIntegration: !1
		},
		titleBarStyle: "hidden",
		titleBarOverlay: {
			color: "#1a1a1a",
			symbolColor: "#ffffff",
			height: 36
		},
		backgroundColor: "#0d0d0d"
	});
	process.env.VITE_DEV_SERVER_URL ? (e.loadURL(process.env.VITE_DEV_SERVER_URL), e.webContents.openDevTools()) : e.loadFile(a.join(__dirname, "dist/index.html"));
}
n.whenReady().then(() => {
	o(), n.on("activate", () => {
		r.getAllWindows().length === 0 && o();
	});
}), n.on("window-all-closed", () => {
	process.platform !== "darwin" && n.quit();
}), i.on("window-minimize", () => {
	let e = r.getFocusedWindow();
	e && e.minimize();
}), i.on("window-maximize", () => {
	let e = r.getFocusedWindow();
	e && (e.isMaximized() ? e.unmaximize() : e.maximize());
}), i.on("window-close", () => {
	let e = r.getFocusedWindow();
	e && e.close();
});
export {};

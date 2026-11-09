import { createRequire as e } from "node:module";
// preload.js
var { contextBridge: t, ipcRenderer: n } = (/* @__PURE__ */ e(import.meta.url))("electron");
t.exposeInMainWorld("electronAPI", {
	minimize: () => n.send("window-minimize"),
	maximize: () => n.send("window-maximize"),
	close: () => n.send("window-close"),
	onMaximizeChange: (e) => (n.on("window-maximize-change", (t, n) => e(n)), () => n.removeAllListeners("window-maximize-change"))
}), t.exposeInMainWorld("store", {
	get: (e) => n.invoke("store-get", e),
	set: (e, t) => n.invoke("store-set", e, t)
});
export {};

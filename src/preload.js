/*
*preload.js 的核心作用是通过 contextBridge 安全地暴露部分 ipcRenderer 功能给渲染进程，同时限制了可用的 IPC 通信渠道，确保应用的安全性和功能性
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-30 09:49:43
 * @LastEditors:
 * @LastEditTime: 2023-01-11 12:32:02
 */

import { contextBridge, ipcRenderer } from "electron";

console.log("BACKEND_URL=>", process.env.BACKEND_URL);

contextBridge.exposeInMainWorld('envVars', {
  backend_url: process.env.BACKEND_URL
});

// Expose protected methods that allow the renderer process to use the ipcRenderer without exposing the entire object. Reference: https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
contextBridge.exposeInMainWorld('ipcRenderer', {
  receive: (channel, func) => {
    if (
      ['fromMain','getWebBounds', 'tabs-update', 'remove-account-session'].includes(
        channel
      )
    ) {
      ipcRenderer.on(channel, (event, ...args) => func(...args)); // Deliberately strip the event as it includes the sender.
    } // end if
  },
  send: (channel, data) => {
    if (
      [
        'close-tab',
        'toMain',
        'new-tab',
        'switch-tab',
        'refresh-tab',
        'back-tab',
        'forward-tab',
        'control-ready',
        'webBounds'
      ].includes(channel)
    ) {
      ipcRenderer.send(channel, data);
    } // end if
  },
});

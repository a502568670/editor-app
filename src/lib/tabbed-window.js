/*
 * @Description: the tabbed window builder
 * @Version: 1.1.2.20220304
 * @Author: hulufei
 * @Date: 2022-02-19 21:02:04
 * @Last Editors: Arvin Zhao
 * @LastEditTime: 2023-01-11 14:53:36
 */

// The tabbed window builder is inspired by electron-as-browser (https://github.com/hulufei/electron-as-browser, Commit 23eec2e1f4db09a6786313a5ca2a4a3700791cb3). Most of the builder's APIs are almost the same as those of electron-as-browser (https://hulufei.github.io/electron-as-browser/#browserlikewindow). However, the control view is rendered on the browser window rather than a separate browser view to take advantage of the Windows Controls Overlay APIs (https://github.com/WICG/window-controls-overlay/blob/main/explainer.md).
import { BrowserWindow, BrowserView, ipcMain, ipcRenderer } from "electron";
import log from "electron-log";
import EventEmitter from "events";
import global from './global'
const verbose_log = global.utils.verbose_log;
const verbose_error = global.utils.verbose_error;
var dog=require('debug')('editor:tabbed-window')

const path = require("path");

log.transports.file.level = global.common.MIN_LOG_LEVEL;

/**
 * @typedef {number} TabID
 * @description BrowserView's ID as the tab ID.
 */

/**
 * @typedef {object} Tab
 * @property {string} url the tab's url (the address bar).
 * @property {string} href the tab's loaded page url (location.href).
 * @property {string} title the tab's title.
 * @property {string} favicon the tab's favicon url.
 * @property {boolean} isLoading
 * @property {boolean} canGoBack
 * @property {boolean} canGoForward
 */

/**
 * @typedef {Object.<TabID, Tab>} Tabs
 */

/**
 * @typedef {object} Bounds
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */


// TabbedWindow类负责管理标签页的创建、切换和销毁，并通过 ipcMain 向渲染进程发送消息。
export class TabbedWindow extends EventEmitter {
  /**
   * The constructor for defining a tabbed window.
   * @param {object} options the options for building a tabbed window.
   * @param {string} [options.ver] the app ver.
   * @param {string} [options.blankPage = ''] the blank page to load on new tab.
   * @param {string} options.blankTitle the blank page's title.
   * @param {number} options.controlHeight the control interface's height.
   * @param {string} options.controlPanel the control interface path to load.
   * @param {object} [options.controlReferences] the additional web peferences for the control panel view.
   * @param {boolean} [options.debug] toggle debug.
   * @param {number} options.height the tabbed window's height.
   * @param {function} [options.onNewWindow] - the custom web content `new-window` event handler.
   * @param {string} [options.startPage = ''] the start page to load on the tabbed window open.
   * @param {object} [options.viewReferences] the additional web preferences for every tab view.
   * @param {number} options.width the tabbed window's width.
   * @param {object} [options.winOptions] the tabbed window options.
   */
  constructor(options) {
    super();
    this.options = options;

    const { controlPanel, controlReferences, height, width, ver, winOptions = {} } = options;

    this.commonWebPreferences = {
      minimumFontSize: 12,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      devTools: this.options.debug,
      nodeIntegrationInSubFrames: false,
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION, // See https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info.
      preload: path.join(__dirname, 'preload.js'),
      allowDisplayingInsecureContent: true,
      allowRunningInsecureContent: true,
      webSecurity: false,
      plugins: true,
      sandbox: true // Support window.opener. See https://github.com/electron/electron/issues/1865#issuecomment-249989894 for more info.
    };
    verbose_log('this.commonWebPreferences=>', this.commonWebPreferences);
    this.defCurrentViewId = null;
    this.defTabConfigs = {};
    this.ipc = null; // IPC channel.
    this.tabs = []; // Keep order.
    this.views = {}; // Prevent browser views garbage collected.
    this.win = new BrowserWindow({
      ...winOptions,
      frame: true,
      height,
      show: true,
      width,
      // icon: path.join(__dirname, 'icon.ico'), // 设置Windows图标
      webPreferences: {
        ...this.commonWebPreferences,
        ...controlReferences // Put it here to overwrite existing values in the above properties.
      }
    });
    verbose_log('controlPanel=>', controlPanel);
    verbose_log('width=>', width);
    verbose_log('height=>', height);
    this.win.loadURL(controlPanel).then(() => {
      if (ver) {
        const newTitle = `${this.win.title}-v${ver}`;
        verbose_log('setTitle to =>', newTitle);
        this.win.title = newTitle;
      }
    });
    this.setChannel();
  } // end constructor

  /**
   * The current tab view.
   */
  get currentView() {
    return this.currentViewId ? this.views[this.currentViewId] : null;
  }

  /**
   * The current tab view ID.
   */
  get currentViewId() {
    return this.defCurrentViewId;
  }

  set currentViewId(id) {
    this.defCurrentViewId = id;
    this.setContentBounds();

    if (this.ipc) {
      this.ipc.reply('active-update', id);
    } // end if
  }

  /**
   * The current tab view's web contents.
   */
  get currentWebContents() {
    const { webContents } = this.currentView || {};
    return webContents;
  }

  /**
   * The tab configurations.
   */
  get tabConfigs() {
    return this.defTabConfigs;
  }

  // 2.标签页数据 (tabs) 的获取
  set tabConfigs(v) {
    this.defTabConfigs = v;

    if (this.ipc) {
      this.ipc.reply('tabs-update', {
        confs: v,
        tabs: this.tabs
      });
    } // end if
  }

  /**
   * 销毁标签页
   * @param {TabID} viewId the tab view ID.
   * @ignore
   */
  destroyView(viewId) {
    verbose_log('indestroyView', viewId, this.views, this.views[viewId]);
    const view = this.views[viewId];
    if (view && view.webContents && !view.webContents.isDestroyed() && !this.win.isDestroyed()) {
      verbose_log('before removeBrowserView');
      this.win.removeBrowserView(view);
      view.webContents.stop();
      view.webContents.close({ waitForBeforeUnload: global.common.WAIT_FOR_BEFORE_UNLOAD });
      this.views[viewId] = null;
    } // end if
  } // end function destoryView

  /**
   * Get the control view's bounds.
   * @returns the bounds of the control view excluding the window's frame.
   */
  getControlBounds() {
    const contentBounds = this.win.getContentBounds();
    return {
      height: this.options.controlHeight,
      width: contentBounds.width - this.options.controlWidth,
      x: 0,
      y: 0
    };
  } // end function getControlBounds

  /**
   * Load the URL on the view.
   * @param {string} url the URL to load.
   * @ignore
   */
  loadURL(url) {
    const { currentView } = this;

    if (!currentView) {
      return;
    } // end if
    console.log('打印当前视图', currentView.webContents.__IS_INITIALIZED__);
    const { id, webContents } = currentView;
    const MARKS = '__IS_INITIALIZED__';

    // Prevent addEventListeners on the same webContents when entering urls in the same tab.
    if (webContents[MARKS]) {
      if (url) {
        webContents.loadURL(url);
      }
      return;
    } // end if

    const onNewWindow = async (e, newUrl, frameName, disposition, winOptions) => {
      // Handle newUrl = "about:blank" in some cases.
      if (!new URL(newUrl).host) {
        return;
      } // end if

      e.preventDefault();
      if (disposition === 'new-window') {
        verbose_log('new-window');
        e.newGuest = new BrowserWindow(winOptions);
      } else if (disposition === 'foreground-tab') {
        verbose_log('foreground-tab');
        await this.newTab(newUrl, id);
        e.newGuest = new BrowserWindow({ ...winOptions, show: false }); // `newGuest` must be set to prevent freeze the trigger tab. The window will be destroyed automatically on the trigger tab closed.
      } else {
        verbose_log('other');
        webContents.loadURL(newUrl);
        //await this.newTab(newUrl, id);
      } // end nested if...else
    };

    webContents.on('new-window', this.options.onNewWindow || onNewWindow);

    // Keep the events in order.
    webContents
      .on('did-start-navigation', (e, href, isInPlace, isMainFrame) => {
        if (isMainFrame) {
          this.setTabConfig(id, { url: href, href });
          /**
           * The url-updated event.
           * @event TabbedWindow#url-updated
           * @returns the current tab view.
           * @returns the updated URL.
           */
          this.emit('url-updated', { view: currentView, href });
        } // end if
      })
      .on('will-redirect', (e, href) => {
        this.setTabConfig(id, { url: href, href });
        this.emit('url-updated', { view: currentView, href });
      })
      .on('dom-ready', () => {
        webContents.focus();
      });
    if (url) {
      webContents.loadURL(url);
    }
    webContents[MARKS] = true;

    this.setContentBounds();
  } // end function loadURL

  /**
   * Create a tab.
   * @param {string} [url=this.options.blankPage] the URL to load.
   * @param {number} [appendTo] the specified tab ID to add the new tab next to the specific tab.
   * @param {object} [references=this.options.viewReferences] the custom web preferences to the new tab.
   * @fires TabbedWindow#new-tab
   */
  async newTab(url, appendTo, references) {
    console.log('创建新标签：', url, appendTo, references);
    verbose_log('newTab url=>', url);
    if (typeof url === 'object') {
      // 如果已经有这个窗口实例便切换标签，没有再执行创建
      console.log('打印tabConfigs 第一次', this.tabConfigs);
      for (let key in this.tabConfigs) {
        if (this.tabConfigs[key] && this.tabConfigs[key].account_id == url.id) {
          this.switchTab(parseInt(key));
          verbose_log('is return from newTab...');
          return;
        }
      }
    }
    let viewKey = typeof url === 'object' ? url.id : url;
    // 窗口独立缓存需要的唯一值
    let partition = 'persist:' + viewKey;
    verbose_log('this.commonWebPreferences=>', this.commonWebPreferences);
    // 创建视图
    const view = new BrowserView({
      webPreferences: {
        partition: partition,
        ...this.commonWebPreferences,
        ...(references || this.options.viewReferences) // Put it here to overwrite existing values in the above properties.
      }
    });
    view.setAutoResize({ height: true, width: true });
    view.id = view.webContents.id;

    // custom window.open() action
    view.webContents.setWindowOpenHandler(details => {
      verbose_log('details=>', details);
      if (details.url == 'about:blank') {
        return { action: 'deny' };
      }
      view.webContents.loadURL(details.url, {
        httpReferrer: details.referrer
      });
      return { action: 'deny' };
    });

    if (appendTo) {
      const prevIndex = this.tabs.indexOf(appendTo);
      this.tabs.splice(prevIndex + 1, 0, view.id);
    } else {
      this.tabs.push(view.id);
    }

    this.views[view.id] = view;
    console.log('打印tabs', this.tabs);
    console.log('打印views', this.views);

    // 保存下更新前的视图id
    const lastView = this.currentView;
    console.log('打印lastView', this.currentView);
    // 设置当前的视图
    this.setCurrentView(view.id);
    if (typeof url === 'object') {
      verbose_log('url 是一个对象，根据 url.platform_id 加载相应的平台模块:');
      this.loadURL('');

      // view.id 是 view.webContents.id
      // viewKey 是 url.id
      this.setTabConfig(view.id, {
        account_id: viewKey
      });

      let companyMap = {};
      verbose_log('调试url.platform_id:', url.platform_id);
      switch (parseInt(url.platform_id)) {
        case 1:
          companyMap.bxgs = require('./blbl');
          break;
        case 2:
          companyMap.bxgs = require('./toutiao');
          break;
        case 3:
          companyMap.bxgs = require('./baijia');
          break;
        case 4:
          companyMap.bxgs = require('./wechat');
          break;
      }
      companyMap.window_id = view.id;
      companyMap.id = url.id;
      if (url.session_id) {
        url.session_id = JSON.parse(url.session_id);
      }
      companyMap.user = url;
      companyMap.partition = partition;
      companyMap.webview = view;
      companyMap.tabWin = this;
      verbose_log('调试companyMap.bxgs:', companyMap.bxgs);
      if (companyMap.bxgs) {
        companyMap.bxgs.init(companyMap);
      }
      this.setTabConfig(view.id, {
        title: url.name
      });
    } else {
      this.loadURL(url || this.options.blankPage);
      this.setTabConfig(view.id, {
        title: this.options.blankTitle
      });
    }
    /**
     * The new-tab event.
     * @event TabbedWindow#new-tab
     * @returns the current tab view.
     * @returns the loaded URL.
     * @returns the previous active view.
     */
    this.emit('new-tab', view, { openedURL: url, lastView });
    return view;
  } // end function newTab

  /**
   * Set the tabbed window event channel.
   * @ignore
   */
  setChannel() {
    const webContentsAct = actionName => {
      const webContents = this.currentWebContents;
      const action = webContents && webContents[actionName];
      if (typeof action === 'function') {
        if (actionName === 'reload' && webContents.getURL() === '') {
          return;
        } // end if
        action.call(webContents);
      } else {
        log.warn('Invalid tabbed window web content action:', actionName);
      } // end if...else
    };

    const channels = Object.entries({
      act: (e, actName) => webContentsAct(actName),
      'remove-tab': async (e, id) => {
        dog('remove-tab', id, this.currentViewId);
        var view = this.views[id || this.currentViewId];
        if (view) {
          this.win.removeBrowserView(view);
        }
      },
      'close-tab': async (e, id) => {
        verbose_log('== channel listened close-tab===', id, this.currentViewId);
        if (id) {
          // 判断删除的标签页是否是最后一个，是则将前一个设为当前页，不是则将后一个设为当前页
          if (id === this.currentViewId) {
            const removeIndex = this.tabs.indexOf(id);
            if (removeIndex > -1) {
              const nextIndex = removeIndex === this.tabs.length - 1 ? removeIndex - 1 : removeIndex + 1;
              this.setCurrentView(this.tabs[nextIndex]);
            }
          }

          this.tabs = this.tabs.filter(v => v !== id);
          this.tabConfigs = {
            ...this.tabConfigs,
            [id]: null
          };
          this.destroyView(id);

          /**
           * The close-tab event.
           * @event TabbedWindow#close-tab
           * @returns the tab item index.
           */
          this.emit('close-tab', id);
        } else {
          // 清除所有标签页
          for (let a of this.tabs) {
            this.destroyView(a);
          }
          this.tabs = [];
          this.tabConfigs = {};
        }
      },
      'control-ready': async (e, icon) => {
        this.ipc = e;
        //await this.newTab(this.options.startPage || "");
        //this.win.show();

        /**
         * The control-ready event.
         * @event TabbedWindow#control-ready
         * @type {IpcMainEvent}
         */
        this.emit('control-ready', e);
      },
      'new-tab': (e, url, references) => {
        verbose_log('主进程接收到的new-tab url', url);
        verbose_log('主进程接收到的new-tab references', references);
        this.newTab(url, null, references);
      },
      'switch-tab': (e, id) => {
        this.switchTab(id);
      },
      'refresh-tab': (e, id) => {
        this.refresh(id);
      },
      'back-tab': (e, id) => {
        if (this.currentView && !this.currentView.webContents.isDestroyed()) {
          this.currentView.webContents.goBack();
        }
      },
      'forward-tab': (e, id) => {
        if (this.currentView && !this.currentView.webContents.isDestroyed()) {
          this.currentView.webContents.goForward();
        }
      },
      'url-change': (e, url) => {
        this.setTabConfig(this.currentViewId, { url });
      },
      'url-enter': (e, url) => {
        this.loadURL(url);
      }
    });

    channels
      .map(([name, listener]) => [
        name,
        (e, ...args) => {
          // Support multiple tabbed windows.
          if (this.win && !this.win.isDestroyed() && e.sender === this.win.webContents) {
            listener(e, ...args);
          } // end if
        }
      ])
      .forEach(([name, listener]) => ipcMain.on(name, listener));

    this.win.on('closed', () => {
      channels.forEach(([name, listener]) => ipcMain.removeListener(name, listener)); // Remember to clear all ipcMain events as ipcMain bind on every new tabbed window instance.

      this.tabs.forEach(id => this.destroyView(id)); // Prevent BrowserView memory leak on close.

      /**
       * The closed event.
       * @event TabbedWindow#closed
       */
      this.emit('closed');
    });
  } // end function setChannel

  /**
   * Set the web content view's bounds automatically.
   * @ignore
   */
  setContentBounds() {
    const [contentWidth, contentHeight] = this.win.getContentSize();
    const controlBounds = this.getControlBounds();
    if (this.currentView && !this.currentView.webContents.isDestroyed()) {
      ipcMain.removeAllListeners(['webBounds']);
      ipcMain.on('webBounds', async (event, data) => {
        if (this.currentView && !this.currentView.webContents.isDestroyed()) {
          this.currentView.setBounds({
            height: data.height,
            width: data.width,
            x: data.x,
            y: data.y
          });
        }
      });
      this.win.webContents.send('getWebBounds');
      this.currentView.setBounds({
        height: contentHeight - controlBounds.height,
        width: contentWidth - 400,
        x: 400,
        y: controlBounds.y + controlBounds.height
      });
    } // end if
  } // end function setControlBounds

  /**
   * 切换当前标签页
   * @param {number} viewId the tab view ID.
   * @ignore
   */
  setCurrentView(viewId) {
    if (!this.views[viewId]) {
      return;
    }
    if (this.currentView) this.win.removeBrowserView(this.currentView);
    this.win.addBrowserView(this.views[viewId]);

    this.currentViewId = viewId;
    verbose_log('tabbed-window.js::setCurrentView');
    this.win.webContents.send('fromMain', { currentTabId: viewId });
    this.currentWebContents.focus();
  } // end function setCurrentView

  raiseRenderAct(event, ...args) {
    // verbose_log('this.win.webContents=>', this.win.webContents)
    this.win.webContents.send(event, ...args);
    if (event === 'remove-account-session') {
      // verbose_log("currentView:", this.currentView)
      if (this.currentView) {
        const session = this.currentView.webContents.session;
        session.clearStorageData(
          {
            storages: ['cookies', 'localstorage', 'caches']
          },
          function (data) {
            verbose_log('clearStorageData', data);
          }
        );
        // 考虑关闭tab
        // sendCloseTab(this.currentView.id)
        // this.destroyView(this.currentView.id);
      }
    } else if (event === 'account_check_login') {
      verbose_log('in main print account_check_login:', args);
    }
  }

  /**
   * 设置标签页配置
   * @param {number} viewId the tab view ID.
   * @param {object} kv the configurations.
   * @returns the tab configurations
   * @ignore
   */
  setTabConfig(viewId, kv) {
    const tab = this.tabConfigs[viewId];
    const { webContents } = this.views[viewId] || {};
    verbose_log('-----setTabConfig------', viewId, kv);
    this.tabConfigs = {
      ...this.tabConfigs,
      [viewId]: {
        ...tab,
        canGoBack: webContents && webContents.canGoBack(),
        canGoForward: webContents && webContents.canGoForward(),
        ...kv // Put it here to overwrite existing values in the above properties.
      }
    };
    return this.tabConfigs;
  } // end function setTabConfig

  /**
   * 切换到指定标签页
   * @param {TabID} viewId the tab view ID.
   */
  switchTab(viewId) {
    this.setCurrentView(viewId);
  } // end function switchTab
  refresh(viewId) {
    if (!viewId) {
      return;
    } // end if
    if (this.currentView && !this.currentView.webContents.isDestroyed()) {
      this.currentView.webContents.reloadIgnoringCache();
    }
  } // end function setCurrentView
} // end class TabbedWindow

const sendAct = (actName) => ipcRenderer.send("act", actName);

/**
 * Tell the tab view URL in the address bar changed.
 * @param {string} url the tab view URL in the address bar.
 */
export const sendChangeURL = (url) => ipcRenderer.send("url-change", url);

/**
 * Tell the tab view to close the tab.
 * @param {TabID} id the tab view ID.
 */
export const sendCloseTab = (id) => ipcRenderer.send("close-tab", id);

/**
 * Tell the tab view to load the URL.
 * @param {string} url the URL to load.
 */
export const sendEnterURL = (url) => ipcRenderer.send("url-enter", url);

/**
 * Tell the tab view to go back.
 */
export const sendGoBack = () => sendAct("goBack");

/**
 * Tell the tab view to go forward.
 */
export const sendGoForward = () => sendAct("goForward");

/**
 * Create a new tab.
 * @param {string} [url] the URL to load.
 * @param {object} [references] the custom web preferences to the new tab.
 */
export const sendNewTab = (url, references) =>
  ipcRenderer.send("new-tab", url, references);

/**
 * Tell the tab view to reload.
 */
export const sendReload = () => sendAct("reload");

/**
 * Tell the tab view to stop loading.
 */
export const sendStop = () => sendAct("stop");

/**
 * Tell the tab view to switch to the specified tab.
 * @param {TabID} id the tab view ID.
 */
export const sendSwitchTab = (id) => ipcRenderer.send("switch-tab", id);

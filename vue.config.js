/*
 * @Descripttion:
 * @Author:
 * @Date: 2022-12-30 11:56:06
 * @LastEditors:
 * @LastEditTime: 2023-05-22 16:11:06
 */
const Components = require('unplugin-vue-components/webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {ElementPlusResolver} = require('unplugin-vue-components/resolvers')

const IconsResolver = require('unplugin-icons/resolver')

module.exports = {
  configureWebpack: {
    devtool: "source-map",
    plugins: [
      // elementPlus组件自动按需导入
      Components({
        resolvers: [
          IconsResolver({
            prefix: false,  // 不要前缀
            enabledCollections: ['ep'], // 启用的svg图标集合
          }),
          ElementPlusResolver()]
      }),
      // 自动按需导入elementPlus图标
      require('unplugin-icons/webpack')({autoInstall: true,}),
      new CopyWebpackPlugin({
        patterns: [
          { from: './src/preload', to: '', toType: 'dir' },
          { from: './public/download-progress.html', to: 'download-progress.html' }
        ]
      })
    ],
    resolve:{
      fallback: {
        "path": false,
        "fs": false
        // "path": require.resolve("path-browserify")
      }
    }
  },
  // publicPath: './',
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].title = '稿轻松'
      return args
    })
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        publish: [
          {
            provider: 'github',
            owner: 'a502568670',
            repo: 'editor-app'
          },
          {
            provider: 'generic',
            url: 'https://static.dajiala.com:9224/static/gaoqingsong/autoupdate'
          }
        ],
        appId: "com.electron.client",  // 保持与 0.5.9 相同，确保可以自动更新
        artifactName: "${name}_${version}_${os}_${arch}.${ext}",
        generateUpdatesFilesForAllChannels: true,
        nsis: {
          allowElevation: true,
          createStartMenuShortcut: true,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: "always",
          shortcutName: "稿轻松",  // 固定的快捷方式名称
          installerLanguages: "zh_CN",
          language: "2052",
          oneClick: false,
          perMachine: false,  // 改为 false，允许每个用户独立安装
          runAfterFinish: false,
          unicode: true,
          deleteAppDataOnUninstall: false,  // 卸载时不删除应用数据
          include: "build/installer.nsh",  // 自定义安装脚本（可选）
        },
        asar: true,
        win: {
          target: [
            {
              target: "nsis",  // 生成 NSIS 安装程序
              arch: ["x64"]
            }
          ],
          icon: "./build/icon.ico",
          requestedExecutionLevel: 'asInvoker',  // 启动模式，普通用户或管理员权限
          verifyUpdateCodeSignature: false,
          signDlls: false,
          sign: undefined
        },
        protocols: {
            "name": "app",
            "schemes": [
                "app"
            ]
        },
        mac: {
          category: "public.app-category.utilities",
          target: [
            {
              target: "dmg",  // 生成 DMG
              arch: ["x64", "arm64"]
            }
          ],
          // icon: "./build/icon.ico",  // 暂时注释掉，使用默认图标
          hardenedRuntime: false,
          gatekeeperAssess: false,
          entitlements: null,
          entitlementsInherit: null
        },
      },
      mainProcessWatch: ['src/lib'],
      preload: './src/preload.js'
    },
  }, // Reference: https://www.electron.build/configuration/configuration
  runtimeCompiler: true,
};

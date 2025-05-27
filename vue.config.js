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
          { from: './src/preload', to: '', toType: 'dir' }
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
            provider: 'generic',
            url: 'http://47.96.22.8:8006/autoupdate'
          }
        ],
        appId: "com.electron.client",
        artifactName: "${name}_${version}_${os}_${arch}.${ext}",
        generateUpdatesFilesForAllChannels: true,
        nsis: {
          allowElevation: true,
          createStartMenuShortcut: true,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: "always",
          shortcutName: "稿轻松",
          installerLanguages: "zh_CN",
          language: "2052",
          oneClick: false,
          perMachine: true,
          runAfterFinish: false,
        },
        asar: false,
        win: {
          target: "nsis",  // 打包为免安装应用，可以改为portable,但是启动要十几秒
          icon: "./build/icon.ico",
          requestedExecutionLevel: 'asInvoker',  // 启动模式，普通用户或管理员权限
          verifyUpdateCodeSignature: false
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
              arch: ["arm64", "x64"],
              target: "default", // Squirrel.Mac requires the zip target. Reference: https://www.electron.build/auto-update#quick-setup-guide
            },
          ],
          extendInfo: "app"
        },
      },
      preload: './src/preload.js'
    },
  }, // Reference: https://www.electron.build/configuration/configuration
  runtimeCompiler: true,
};

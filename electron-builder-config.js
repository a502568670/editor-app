const dotenv = require("dotenv");
dotenv.config();

const config = {
  appId: "com.dajiala.jzl.editor",
  productName: "jzl_editor",
  artifactName: "jzl_editor.${ext}",
  buildVersion: `0.1.0`,
  copyright: `Copyright ${process.env.AUTHOR}`,
  extraMetadata: {
      author: {
          name: `${process.env.AUTHOR}`,
          email: `474804@qq.com`
      }
  },
  files: [
      "./build/**/*"
  ],
  win: {
      icon: "icons/icon.ico",
      target: "msi"
  },
  linux: {
      icon: "icons/icon.png",
      category: "app.tools",
      executableName: "schild.report",
      target: [
          "AppImage",
          "snap",
          "deb",
          "rpm"
      ]
  },
  mac: {
      icon: "icons/icon.icns",
      target: "dmg"
  },
  dmg: {
      icon: "icons/icon.icns",
      contents: [
          {
              x: 130,
              y: 220
          },
          {
              x: 550,
              y: 22,
              type: "link",
              path: "/Applications"
          }
      ],
      window: {
          width: 680,
          height: 42
      }
  }
}
module.exports = config
import type {
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
} from './types/config'
import { LinkPreset } from './types/config'

export const siteConfig: SiteConfig = {
  title: 'Kellen',
  subtitle: 'Demo Site',
  lang: 'zh_CN',         // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko'
  themeColor: {
    hue: 250,         // 主题颜色的默认色调，从 0 到 360。红色：0，青色：200，青色：250，粉色：345
    fixed: false,     // 为访客隐藏主题颜色选择器
  },
  banner: {
    enable: true,
    src: 'assets/images/banner.png',   // 相对于/src 目录。如果以“/"开头，则相对于/pubLic目录
    position: 'center',      // 相当于object-position，只支持'top'，'center'，'bottom'。默认为 'center' 
    credit: {
      enable: false,         // 显示横幅图像的信用文本
      text: '',              // 示的信用文本
      url: ''                // (可选)原始艺术作品或艺术家页面的URL链接
    }
  },
  toc: {
    enable: true,           // 在帖子右侧显示目录
    depth: 2                // 表中显示的最大标题深度，从 1 到 3
  },
  favicon: [    // Leave this array empty to use the default favicon
    // {
    //   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
    //   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
    //   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
    // }
  ]
}

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.About,
    {
      name: 'GitHub',
      url: 'https://github.com/kellen-ming',     // 内部链接不应包含基本路径，因为它是自动添加的
      external: true,                               // 显示外部链接图标并将在新选项卡中打开
    },
  ],
}

export const profileConfig: ProfileConfig = {
  avatar: 'assets/images/author.png',  //相对于/src目录。如果以“/”开头，则相对于 /public 目录
  name: 'Kellen',
  bio: '慢慢来，比较快。',
  /**
   * 图标库 https://icones.js.org/获取图标代码
   * 如果尚未包含，则需要安装相应的图标集
   * pnpm add @iconify-json/<icon-set-name>`
   */
  links: [
    {
      name: 'Juejin',
      icon: 'simple-icons:juejin',                                          
      url: 'https://juejin.cn/user/1007587030991165',
    },
    {
      name: 'GitHub',
      icon: 'fa6-brands:github',
      url: 'https://github.com/kellen-ming',
    },
  ],
}

export const licenseConfig: LicenseConfig = {
  enable: true,
  name: 'CC BY-NC-SA 4.0',
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
}

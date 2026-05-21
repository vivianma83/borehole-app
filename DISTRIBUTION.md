# 怎么发给客户

> 当前 `borehole-app/` 已经能在 Mac 上 build 出 `.dmg`。Windows 需要在 Win 机器或 CI 上 build。

## 现状

| 包 | 状态 | 大小 |
|---|---|---|
| `钻孔柱状图_0.1.0_x64.dmg` (macOS Intel) | ✅ 已有 | 4.1 MB |
| `钻孔柱状图_0.1.0_aarch64.dmg` (macOS Apple Silicon) | ⏳ 需在 M 系列 Mac 或 CI 上 build | 预计 4 MB |
| `钻孔柱状图_0.1.0_x64-setup.exe` (Windows NSIS) | ⏳ 需 Windows 机器或 CI | 预计 6-8 MB |
| `钻孔柱状图_0.1.0_x64_en-US.msi` (Windows MSI) | ⏳ 需 Windows 机器或 CI | 预计 6-8 MB |

---

## 三条路线

### 🅰 推荐：用 GitHub Actions 一键出三平台包

适合：以后还会迭代很多次，每次都不想手动 build。

#### 一次性配置（10 分钟）

1. **在 GitHub 上建一个仓库**（私有/公开都行）
   - 比如 `synxdata/borehole-app`
2. **本地把代码推上去**
   ```bash
   cd /Users/xiaojingma/workspace/myh/borehole-app
   git init                                   # 如果还没初始化
   git add .
   git commit -m "v0.1.0 first cut"
   git remote add origin git@github.com:你的用户名/borehole-app.git
   git push -u origin main
   ```
3. `.github/workflows/release.yml` 已经写好了，push 上去就自动生效

#### 出包

只要打个 tag 就触发：
```bash
git tag v0.1.0
git push origin v0.1.0
```

10 分钟左右，GitHub Actions 会同时跑三个平台 runner：
- macOS Intel → 出 `*-x64.dmg`
- macOS Apple Silicon → 出 `*-aarch64.dmg`
- Windows → 出 `*-setup.exe` + `*.msi`

去 GitHub 仓库的 **Releases** 页面，会看到一个 **Draft Release** v0.1.0，里面三个/四个包都附好了。点 Publish 就发布出去，客户可以**直接从你给的 Release 链接下载**对应平台的包。

#### 客户拿到怎么用

发给客户一个链接：`https://github.com/你的用户名/borehole-app/releases/tag/v0.1.0`

里面附了 INSTALL.md 的链接 + 各平台的 .dmg / .exe / .msi 直接下载。

---

### 🅱 备选：找台 Windows 机器自己 build

适合：你或同事手上有 Win 10/11 PC，且不打算频繁出包。

#### Windows 机器一次性配置

1. 装 Node.js 20+ → https://nodejs.org/
2. 装 Rust → https://rustup.rs/（运行 rustup-init.exe）
3. 装 Microsoft Visual Studio C++ Build Tools → https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - 安装时勾选 "Desktop development with C++"
4. （可选）装 WebView2 Runtime → https://developer.microsoft.com/en-us/microsoft-edge/webview2/
   - Win 11 通常自带；Win 10 1809+ 也大多有

#### 出包

```cmd
cd C:\path\to\borehole-app
npm install --legacy-peer-deps
npm run tauri:build
```

10-15 分钟。产物在：
```
src-tauri\target\release\bundle\msi\钻孔柱状图_0.1.0_x64_en-US.msi
src-tauri\target\release\bundle\nsis\钻孔柱状图_0.1.0_x64-setup.exe
```

两者都能装：
- `.msi` 适合企业部署（GPO 推送）
- `-setup.exe` 适合个人下载（NSIS 体积小，界面友好）

---

### 🅲 临时方案：只发 Mac 版

直接把 `钻孔柱状图_0.1.0_x64.dmg` 发给客户（Mac 用户）。配上 `INSTALL.md` 第一节告诉他们怎么右键打开绕过警告。Windows 用户先等。

---

## 怎么发

不管哪条路线，发给客户都是这几种方式：

| 方式 | 优点 | 缺点 |
|---|---|---|
| **邮件附件** | 直接 | 大多数邮箱限 25 MB，4MB .dmg 没问题；超 10MB 的 .exe 也勉强 |
| **微信文件** | 方便 | 单文件 100MB 限制内随便发；客户接收方便 |
| **网盘**（百度/坚果云） | 大文件友好 | 客户要下载 |
| **GitHub Releases** | 永久托管 + 版本管理 | 需要客户能访问 GitHub |
| **企业 OSS / 自建** | 完全可控 | 需要自己搭 |

国内 b2b 场景，**微信发文件 + INSTALL.md** 最实用。客户在群里收到，点击下载，按教程装。

---

## 客户需要看的安装步骤

发包同时给客户 `INSTALL.md`（已在项目根目录），核心是：

### Mac 用户
1. 双击 .dmg → 拖 app 到 Applications
2. 在 Applications 里**右键**点 app → 选"打开"（不能直接双击）
3. 弹窗点"打开"确认 → 装完

### Windows 用户
1. 双击 setup.exe
2. SmartScreen 弹蓝色保护窗口 → 点"更多信息" → 点"仍要运行"
3. 走安装向导 → 桌面有快捷方式

---

## 我现在能给客户什么

如果你**现在就要发包**：

1. 把 `src-tauri/target/release/bundle/dmg/钻孔柱状图_0.1.0_x64.dmg` 复制出来（4.1 MB）
2. 一起把 `INSTALL.md`（项目根目录）也发过去
3. 用微信/邮件发给客户

Windows 包等你启动 A 或 B 路线后再补一封邮件给客户。

---

## 哪些事还没做（后续提升）

- ❌ 代码签名（macOS Apple Developer / Windows Code Signing 证书）→ 不签客户会有警告，签了 100% 无感安装
- ❌ 自动更新 → 现在每次 push 新版本都要重新发包给客户
- ❌ 应用图标设计 → 还是 Tauri 默认 logo
- ❌ 一个简单的官网 / 下载页 → 现在还得点 GitHub 链接

这些都是"正式产品发布"前要做的，但**测试阶段可以先跳过**。

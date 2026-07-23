# Noise Pomodoro

[日本語](README.ja.md) | [English](README.md) | [Français](README.fr.md) | [Español](README.es.md)

生成白噪音、粉噪音、棕噪音、等时音、双耳节拍和梭罗吉欧频率，支持播放本地音频文件以及运行自定义 JavaScript 波形代码。内置番茄钟计时器，可为专注和休息阶段分别指定不同的声音。

## 截图

<table>
<tr>
<td align="center" width="33%"><img src="images/screenshots/main-panel.png" width="280" alt="面板默认视图" /><br />默认视图</td>
<td align="center" width="33%"><img src="images/screenshots/playing-preset.png" width="280" alt="预设正在播放" /><br />预设播放中</td>
<td align="center" width="33%"><img src="images/screenshots/pomodoro.png" width="280" alt="番茄钟正在运行" /><br />番茄钟运行中</td>
</tr>
</table>

## 功能

- **生成音源**：白噪音、粉噪音、棕噪音、等时音、双耳节拍和梭罗吉欧频率，均在 AudioWorklet 上生成，界面操作时不会出现音频卡顿。
- **文件播放**：播放你指定的本地音频文件。
- **自定义代码**：编写一个 JavaScript 表达式，使用 `t`（经过的秒数）和 `params`（任意参数），生成范围在 -1 到 1 之间的波形并即时播放。
- **番茄钟计时器**：可分别设置专注和休息时长，并为每个阶段指定声音。支持自动切换阶段、阶段结束提示、单次提示音和自定义脚本。
- **以状态栏为中心**：从状态栏打开面板。关闭面板后播放仍会继续，即使在禅模式（Zen Mode）下，状态栏也始终是操作入口。

## 使用方法

1. 点击状态栏图标，或在命令面板中执行 “Noise Pomodoro: Open Panel” 打开面板。
2. 选择一个声音预设即可开始播放。
3. 在番茄钟区域设置专注/休息时长以及各阶段的声音，然后按下 Start。

## 测试方法（面向贡献者）

如果你是第一次进行扩展开发，按以下顺序检查会比较容易理解：

1. 在终端中执行 `npm install`。
2. 执行 `npm run watch`，使源码修改自动重新构建。
3. 在 VS Code 中按 F5 启动 Extension Development Host。
4. 在打开的新窗口中打开命令面板，执行 “Noise Pomodoro: Open Panel”。
5. 依次尝试以下操作：
	- 选择一个预设，确认能发出声音。
	- 确认关闭面板后播放仍会继续。
	- 确认状态栏会显示当前播放的预设名称。
	- 使用 Start / Pause / Reset / Skip 操作番茄钟，确认显示与状态保持同步。
	- 如果存在文件播放预设，确认可以选择并播放本地音频文件。
	- 如果存在自定义代码模式，输入一个简单的表达式并应用，确认出错时会显示错误信息。
6. 如需查看日志，请在 VS Code 的输出面板中打开 “Noise Pomodoro”。
7. 修改之后，在 F5 开发主机中重复验证：界面改动重新显示面板即可，实现改动则等待 watch 重新构建后再测试。

## 设置

- `noisePomodoro.enablePhaseEndScripts`：允许在阶段结束时运行自定义脚本。默认值为 `false`。该脚本以扩展宿主 / Node 权限运行，请仅使用你自己编写的脚本。
- `noisePomodoro.statusBar.updateIntervalMs`：番茄钟状态栏的更新间隔（毫秒）。默认值为 `1000`。

## 开发

```bash
npm install
npm run watch
```

在 VS Code 中按 F5 即可启动 Extension Development Host。

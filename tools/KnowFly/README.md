# TzRuntime

TzRuntime 是一个用于天智数据库开发组的VSCode扩展。

## 功能

- 允许用户在多个C/C++编译器之间切换，如 `gcc`, `clang`, `msvc`。
- 更新 `C_Cpp.default.compilerPath` 配置以使用选定的编译器。

## 安装

1. 打开VSCode。
2. 转到扩展视图（按 `Ctrl+Shift+X` 或点击左侧边栏的扩展图标）。
3. 搜索并安装 `Compiler Switcher` 扩展。

## 使用方法

1. 打开命令面板（按 `Ctrl+Shift+P`）。
2. 输入并选择 `Switch Compiler` 命令。
3. 从列表中选择一个编译器。

## 配置

你可以在VSCode设置中配置可用的编译器列表。添加以下配置到你的设置文件中：

```json
{
  "compilerSwitcher.compilers": ["gcc", "clang", "msvc"]
}
```

# MD Viewer 测试文档

这是一个用于验证 **MD 完整预览器** 的测试文件。

## 链接测试（重点）

### 相对路径链接
- [相对路径：同级文件](./intro.md)
- [相对路径：子目录](./docs/readme.md)
- [相对路径：上级目录](../parent.md)
- [相对路径：锚点跳转](#三代码与表格)

### 绝对路径链接（Windows）
- [绝对路径 C:/](C:/Windows/System32)
- [绝对路径 D:/](D:/)
- [绝对路径文件](C:/Windows/explorer.exe)

### 外部链接
- [百度 https://www.baidu.com](https://www.baidu.com)
- [腾讯 https://www.qq.com](https://www.qq.com)

### 锚点与内部
- [跳到"代码与表格"章节](#三代码与表格)
- [跳到任务列表](#任务列表)

## 二、文本格式

支持 *斜体*、**加粗**、~~删除线~~、`行内代码`。

> 这是一段引用块，用于测试 blockquote 渲染效果。

## 三、代码与表格

### 代码块（带语法高亮）

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
greet('MD Viewer');
```

```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

### 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| GFM 表格 | ✅ | 支持 |
| 代码高亮 | ✅ | highlight.js |
| 相对路径 | ✅ | 基于根目录 |
| 绝对路径 | ✅ | C:/ D:/ |

### 任务列表

- [x] 解析 Markdown
- [x] 渲染 GFM
- [x] 处理链接跳转
- [ ] 导出 PDF
- [ ] 实时协作

## 四、图片

![占位图片](https://via.placeholder.com/150)

---

**结语**：若以上所有链接均能正常跳转、表格/代码/任务列表渲染正确，则预览器工作正常。

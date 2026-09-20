@echo off
chcp 65001 >nul
title MD Viewer 启动器

echo ==========================================================
echo   MD 完整预览器 - 一键启动
echo   支持：相对/绝对路径链接跳转、GFM、代码高亮、目录
echo ==========================================================
echo.

REM 切换到脚本所在目录（即预览器所在目录）
cd /d "%~dp0"

REM 检查 Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3
    echo 下载地址: https://www.python.org/downloads/
    echo 安装时请勾选 "Add Python to PATH"
    pause
    exit /b 1
)

echo [1/3] 检测到 Python:
python --version
echo.

echo [2/3] 启动本地服务器 (http://127.0.0.1:8765)
echo         浏览器将自动打开预览器
echo         (保持此窗口运行，关闭即停止服务器)
echo.

REM 写入一段启动服务器的 Python 代码（单文件，无需额外依赖）
echo import http.server, socketserver, webbrowser, os, sys > _md_server.py
echo. >> _md_server.py
echo os.chdir(r"%cd%") >> _md_server.py
echo. >> _md_server.py
echo class Handler(http.server.SimpleHTTPRequestHandler): >> _md_server.py
echo     def end_headers(self): >> _md_server.py
echo         # 允许双击打开 html 时正常加载（CORS 宽松） >> _md_server.py
echo         self.send_header("Access-Control-Allow-Origin", "*") >> _md_server.py
echo         super().end_headers() >> _md_server.py
echo     def log_message(self, *args): >> _md_server.py
echo         pass  # 静默日志 >> _md_server.py
echo. >> _md_server.py
echo PORT = 8765 >> _md_server.py
echo. >> _md_server.py
echo with socketserver.TCPServer(("", PORT), Handler) as httpd: >> _md_server.py
echo     url = f"http://127.0.0.1:{PORT}/md-preview.html" >> _md_server.py
echo     print(f"Server running at {url}") >> _md_server.py
echo     webbrowser.open(url) >> _md_server.py
echo     try: >> _md_server.py
echo         httpd.serve_forever() >> _md_server.py
echo     except KeyboardInterrupt: >> _md_server.py
echo         print("Server stopped.") >> _md_server.py

REM 延迟打开浏览器，等服务器起来
start "" python _md_server.py

echo.
echo [3/3] 服务器已启动，浏览器即将打开...
echo.
echo 使用说明：
echo   - 直接将 .md 文件 拖拽到预览器窗口即可渲染
echo   - 支持相对路径 / 绝对路径 / http 链接 全部可点击跳转
echo   - 关闭本窗口即可停止服务器
echo.
pause

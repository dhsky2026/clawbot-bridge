# -*- coding: utf-8 -*-
"""DHS-CHANNEL 解密工具（给阿宝用）

用法：
    python bridge_decrypt.py <密文文件>               # 解密并打印
    python bridge_decrypt.py <密文文件> -o 输出.md     # 解密并存盘
    python bridge_decrypt.py --key <口令> <密文文件>    # 直接给口令
    echo <口令> | python bridge_decrypt.py <密文文件>   # 从 stdin 读口令

格式：-----BEGIN DHS-BRIDGE-ENC----- / v1 / iters / salt / nonce / ct / -----END-----
算法：PBKDF2-HMAC-SHA256（派生 32B 密钥）+ SHA256-CTR 流密码（全部标准库，无第三方依赖）。
"""
from __future__ import print_function
import argparse
import base64
import getpass
import hashlib
import io
import os
import struct
import sys

MAGIC = '-----BEGIN DHS-BRIDGE-ENC-----'
END = '-----END DHS-BRIDGE-ENC-----'


def _keystream(key, nonce, n):
    out = bytearray()
    i = 0
    while len(out) < n:
        out += hashlib.sha256(key + nonce + struct.pack('>Q', i)).digest()
        i += 1
    return bytes(out[:n])


def decrypt_text(blob, password):
    lines = [l.strip() for l in blob.strip().splitlines() if l.strip()]
    if not lines or lines[0] != MAGIC:
        raise ValueError('不是 DHS-BRIDGE-ENC 密文（首行不匹配）')
    if lines[-1] != END:
        raise ValueError('密文未正常结束（可能被截断）')
    body = lines[1:-1]
    if len(body) < 5 or body[0] != 'v1':
        raise ValueError('不支持的版本')
    iters = int(body[1])
    salt = base64.b64decode(body[2])
    nonce = base64.b64decode(body[3])
    ct = base64.b64decode(body[4])
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iters, 32)
    pt = bytes(a ^ b for a, b in zip(ct, _keystream(key, nonce, len(ct))))
    return pt.decode('utf-8')


def main():
    ap = argparse.ArgumentParser(description='DHS-CHANNEL 解密工具')
    ap.add_argument('file', help='密文文件路径')
    ap.add_argument('-o', '--out', help='输出文件（默认打印到屏幕）')
    ap.add_argument('--key', help='口令（不给则交互输入）')
    args = ap.parse_args()

    blob = io.open(args.file, encoding='utf-8', errors='replace').read()
    pwd = args.key
    if not pwd:
        if not sys.stdin.isatty():
            pwd = sys.stdin.readline().strip()
        if not pwd:
            pwd = getpass.getpass('请输入通道口令: ')
    try:
        text = decrypt_text(blob, pwd)
    except Exception as e:
        print('[失败] %s' % e)
        print('       口令错误，或文件不是本通道的密文。')
        return 1
    if args.out:
        io.open(args.out, 'w', encoding='utf-8', newline='\n').write(text)
        print('[OK] 已解密 -> %s（%d 字符）' % (args.out, len(text)))
    else:
        print(text)
    return 0


if __name__ == '__main__':
    sys.exit(main())

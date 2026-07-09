const express = require('express');
const fs = require('fs');
const path = require('path');
const { createReadStream } = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// ---------- FFmpeg 配置 ----------
ffmpeg.setFfmpegPath('ffmpeg');
console.log('✅ 使用系统 FFmpeg (请确保已安装)');

const app = express();
const PORT = 8000;
const VIDEO_DIR = path.join(__dirname, 'video');
const THUMB_DIR = path.join(__dirname, 'thumbnails');
const SUBTITLE_DIR = path.join(__dirname, 'subtitles');

// 确保目录存在
if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
}
if (!fs.existsSync(THUMB_DIR)) {
    fs.mkdirSync(THUMB_DIR, { recursive: true });
}
if (!fs.existsSync(SUBTITLE_DIR)) {
    fs.mkdirSync(SUBTITLE_DIR, { recursive: true });
}

// ---------- 中间件 ----------
app.disable('x-powered-by');

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ---------- 生成缩略图函数 ----------
function generateThumbnail(videoPath, thumbPath, callback) {
    if (fs.existsSync(thumbPath)) {
        return callback(null);
    }

    ffmpeg(videoPath)
        .screenshots({
            timestamps: ['50%'],
            filename: path.basename(thumbPath),
            folder: THUMB_DIR,
            size: '320x180',
        })
        .on('end', function() {
            console.log(`✅ 缩略图生成成功: ${path.basename(thumbPath)}`);
            callback(null);
        })
        .on('error', function(err) {
            console.error(`❌ 生成缩略图失败: ${err.message}`);
            callback(err);
        });
}

// ---------- API: 获取视频列表 ----------
app.get('/api/videos', (req, res) => {
    try {
        const files = fs.readdirSync(VIDEO_DIR)
            .filter(f => f.toLowerCase().endsWith('.mp4'))
            .sort((a, b) => a.localeCompare(b, 'zh'));

        const videoList = files.map(filename => {
            const baseName = filename.replace(/\.[^.]+$/, '');
            
            // 处理缩略图
            const thumbJpg = path.join(THUMB_DIR, `${baseName}.jpg`);
            const thumbPng = path.join(THUMB_DIR, `${baseName}.png`);
            let thumbUrl = null;
            if (fs.existsSync(thumbJpg)) {
                thumbUrl = `/thumbnails/${baseName}.jpg`;
            } else if (fs.existsSync(thumbPng)) {
                thumbUrl = `/thumbnails/${baseName}.png`;
            }
            
            // 处理字幕 - 优先查找 .vtt 格式
            const subVtt = path.join(SUBTITLE_DIR, `${baseName}.vtt`);
            let subtitleUrl = null;
            let subtitleType = null;
            if (fs.existsSync(subVtt)) {
                subtitleUrl = `/subtitles/${baseName}.vtt`;
                subtitleType = 'vtt';
            }
            
            return {
                filename: filename,
                thumbnail: thumbUrl,
                subtitle: subtitleUrl,
                subtitleType: subtitleType,
                needGenerate: !thumbUrl
            };
        });

        res.json(videoList);
    } catch (err) {
        console.error('读取视频目录失败:', err);
        res.status(500).json({ error: '读取视频列表失败' });
    }
});

// ---------- 生成缩略图的API ----------
app.post('/api/generate-thumb/:filename', (req, res) => {
    const filename = req.params.filename;
    const videoPath = path.join(VIDEO_DIR, filename);
    const baseName = filename.replace(/\.[^.]+$/, '');
    const thumbPath = path.join(THUMB_DIR, `${baseName}.jpg`);

    if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: '视频不存在' });
    }

    if (fs.existsSync(thumbPath)) {
        return res.json({ success: true, thumbnail: `/thumbnails/${baseName}.jpg` });
    }

    generateThumbnail(videoPath, thumbPath, (err) => {
        if (err) {
            res.status(500).json({ error: '生成缩略图失败' });
        } else {
            res.json({ success: true, thumbnail: `/thumbnails/${baseName}.jpg` });
        }
    });
});

// ---------- 批量生成缩略图 ----------
app.post('/api/generate-all-thumbs', (req, res) => {
    try {
        const files = fs.readdirSync(VIDEO_DIR)
            .filter(f => f.toLowerCase().endsWith('.mp4'));
        
        if (files.length === 0) {
            return res.json({ success: false, message: '没有视频文件' });
        }

        let completed = 0;
        let failed = 0;
        const total = files.length;

        files.forEach(filename => {
            const baseName = filename.replace(/\.[^.]+$/, '');
            const thumbPath = path.join(THUMB_DIR, `${baseName}.jpg`);
            
            if (fs.existsSync(thumbPath)) {
                completed++;
                if (completed + failed === total) {
                    res.json({ 
                        success: true, 
                        total, 
                        completed, 
                        failed,
                        message: `完成！成功 ${completed} 个，失败 ${failed} 个`
                    });
                }
                return;
            }

            const videoPath = path.join(VIDEO_DIR, filename);
            generateThumbnail(videoPath, thumbPath, (err) => {
                if (err) {
                    failed++;
                } else {
                    completed++;
                }
                
                if (completed + failed === total) {
                    res.json({ 
                        success: true, 
                        total, 
                        completed, 
                        failed,
                        message: `完成！成功 ${completed} 个，失败 ${failed} 个`
                    });
                }
            });
        });
    } catch (err) {
        console.error('批量生成缩略图失败:', err);
        res.status(500).json({ error: '批量生成失败' });
    }
});

// ---------- 视频文件服务 ----------
app.get('/video/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(VIDEO_DIR, filename);
    
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(VIDEO_DIR)) {
        return res.status(403).send('Forbidden');
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Video not found');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
            'Cache-Control': 'no-cache',
        });

        const stream = createReadStream(filePath, { start, end });
        stream.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
        });
        createReadStream(filePath).pipe(res);
    }
});

// ---------- 缩略图服务 ----------
app.get('/thumbnails/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(THUMB_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Thumbnail not found');
    }
    
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') {
        contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
        contentType = 'image/jpeg';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath);
});

// ---------- 字幕服务 ----------
app.get('/subtitles/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!filename.endsWith('.vtt')) {
        return res.status(400).send('Only VTT subtitles are supported');
    }
    
    const filePath = path.join(SUBTITLE_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Subtitle not found');
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(content);
});

// ---------- 静态文件服务 ----------
app.get('/favicon.ico', (req, res) => {
    res.status(204).send();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

// ---------- 错误处理 ----------
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).send('Internal Server Error');
});

// ---------- 启动服务器 ----------
app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const localIPs = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIPs.push(iface.address);
            }
        }
    }

    console.log('=' .repeat(60));
    console.log('📹 LVC - Lan Video Center 已启动');
    console.log('=' .repeat(60));
    console.log(`  本地访问: http://127.0.0.1:${PORT}`);
    if (localIPs.length > 0) {
        localIPs.forEach(ip => {
            console.log(`  局域网访问: http://${ip}:${PORT}`);
        });
    }
    console.log(`  视频目录: ${VIDEO_DIR}`);
    console.log(`  字幕目录: ${SUBTITLE_DIR}`);
    console.log(`  缩略图目录: ${THUMB_DIR}`);
    console.log('  按 Ctrl+C 停止服务');
    console.log('=' .repeat(60));
    
    try {
        const { execSync } = require('child_process');
        execSync('ffmpeg -version', { stdio: 'ignore' });
        console.log('✅ FFmpeg 已安装，封面自动生成功能可用');
    } catch (e) {
        console.log('⚠️  FFmpeg 未安装，封面将使用默认图标');
        console.log('   如需自动生成封面，请安装 FFmpeg: https://ffmpeg.org/');
    }
});

process.on('SIGINT', () => {
    console.log('\n\n🛑 正在关闭服务...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 正在关闭服务...');
    process.exit(0);
});